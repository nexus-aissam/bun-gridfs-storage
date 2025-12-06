# Examples

This document contains comprehensive examples for using `bun-gridfs-storage`.

## Table of Contents

- [Basic Setup](#basic-setup)
- [Express.js Integration](#expressjs-integration)
- [Custom File Configuration](#custom-file-configuration)
- [Event Handling](#event-handling)
- [File Management](#file-management)
- [Advanced Patterns](#advanced-patterns)

## Basic Setup

### Minimal Configuration

```typescript
import { BunGridFSStorage } from 'bun-gridfs-storage';
import multer from 'multer';
import mongoose from 'mongoose';

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/myapp');

// Create storage with minimal config
const storage = new BunGridFSStorage({
  db: mongoose.connection.db,
});

const upload = multer({ storage });
```

### With Custom File Naming

```typescript
const storage = new BunGridFSStorage({
  db: mongoose.connection.db,
  file: (req, file) => ({
    filename: `${Date.now()}-${file.originalname}`,
    bucketName: 'uploads',
  }),
});
```

## Express.js Integration

### Single File Upload

```typescript
import express from 'express';
import multer from 'multer';
import { BunGridFSStorage } from 'bun-gridfs-storage';

const app = express();

const storage = new BunGridFSStorage({
  db: mongoose.connection.db,
  file: (req, file) => ({
    filename: `${Date.now()}-${file.originalname}`,
    bucketName: 'uploads',
  }),
});

const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    message: 'File uploaded successfully',
    file: {
      id: req.file.id,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});
```

### Multiple File Upload

```typescript
app.post('/upload-multiple', upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const files = (req.files as Express.Multer.File[]).map(file => ({
    id: file.id,
    filename: file.filename,
    size: file.size,
  }));

  res.json({
    message: `${files.length} files uploaded successfully`,
    files,
  });
});
```

### File Download

```typescript
import { ObjectId } from 'mongodb';

app.get('/download/:id', async (req, res) => {
  const bucket = storage.getBucket();

  if (!bucket) {
    return res.status(500).json({ error: 'Storage not ready' });
  }

  try {
    const downloadStream = bucket.openDownloadStream(
      new ObjectId(req.params.id)
    );

    downloadStream.on('error', (error) => {
      console.error('Download error:', error);
      res.status(404).json({ error: 'File not found' });
    });

    downloadStream.on('file', (file) => {
      res.set('Content-Type', file.contentType || 'application/octet-stream');
      res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
    });

    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: 'Download failed' });
  }
});
```

## Custom File Configuration

### With User Context

```typescript
interface AuthRequest extends Request {
  user?: { id: string; organization: string };
}

const storage = new BunGridFSStorage({
  db: mongoose.connection.db,
  file: (req: AuthRequest, file) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    return {
      filename: `${req.user.organization}-${Date.now()}-${file.originalname}`,
      bucketName: 'user-uploads',
      metadata: {
        userId: req.user.id,
        organizationId: req.user.organization,
        uploadedAt: new Date(),
        originalName: file.originalname,
        mimeType: file.mimetype,
      },
      contentType: file.mimetype,
    };
  },
});
```

### With Custom ID Generation

```typescript
import { randomUUID } from 'crypto';

const storage = new BunGridFSStorage({
  db: mongoose.connection.db,
  file: async (req, file) => {
    // Generate unique ID
    const uid = randomUUID();

    // Extract file extension
    const ext = file.originalname.split('.').pop();

    return {
      filename: `${uid}.${ext}`,
      bucketName: 'uploads',
      chunkSize: 255 * 1024, // 255KB
      metadata: {
        uid,
        originalName: file.originalname,
        uploadedBy: req.user?.id,
        visibility: 'public',
      },
    };
  },
});
```

### Async File Configuration

```typescript
const storage = new BunGridFSStorage({
  db: mongoose.connection.db,
  file: async (req, file) => {
    // Perform async operations (e.g., check user permissions)
    const hasPermission = await checkUserPermission(req.user.id);

    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    // Generate unique filename using external service
    const uniqueName = await generateUniqueFilename(file.originalname);

    return {
      filename: uniqueName,
      bucketName: 'protected-uploads',
      metadata: {
        userId: req.user.id,
        verified: true,
      },
    };
  },
});
```

## Event Handling

### Listen to All Events

```typescript
const storage = new BunGridFSStorage({
  db: mongoose.connection.db,
  file: (req, file) => ({
    filename: file.originalname,
    bucketName: 'uploads',
  }),
});

// Connection event
storage.on('connection', (db) => {
  console.log('✅ GridFS storage connected');
});

// Connection failed event
storage.on('connectionFailed', (error) => {
  console.error('❌ Connection failed:', error.message);
  // Send alert to monitoring service
  sendAlert('GridFS connection failed', error);
});

// File uploaded event
storage.on('file', (file) => {
  console.log('📁 File uploaded:', {
    id: file.id.toString(),
    filename: file.filename,
    size: file.size,
  });

  // Trigger post-upload processing
  processUploadedFile(file);
});

// Stream error event
storage.on('streamError', (error, fileConfig) => {
  console.error('⚠️ Upload error:', error.message, fileConfig);
  // Log to error tracking service
  logError('File upload failed', { error, fileConfig });
});
```

### Post-Upload Processing

```typescript
storage.on('file', async (file) => {
  // Example: Generate thumbnail for images
  if (file.mimetype.startsWith('image/')) {
    await generateThumbnail(file.id);
  }

  // Example: Scan file for viruses
  await scanForViruses(file.id);

  // Example: Update database
  await FileModel.create({
    gridfsId: file.id,
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype,
    metadata: file.metadata,
  });
});
```

## File Management

### List All Files

```typescript
app.get('/files', async (req, res) => {
  const bucket = storage.getBucket();

  if (!bucket) {
    return res.status(500).json({ error: 'Storage not ready' });
  }

  try {
    const files = await bucket
      .find({})
      .sort({ uploadDate: -1 })
      .limit(50)
      .toArray();

    res.json({
      files: files.map(file => ({
        id: file._id,
        filename: file.filename,
        size: file.length,
        uploadDate: file.uploadDate,
        metadata: file.metadata,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list files' });
  }
});
```

### Delete File

```typescript
import { ObjectId } from 'mongodb';

app.delete('/files/:id', async (req, res) => {
  const bucket = storage.getBucket();

  if (!bucket) {
    return res.status(500).json({ error: 'Storage not ready' });
  }

  try {
    await bucket.delete(new ObjectId(req.params.id));
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});
```

### Get File Metadata

```typescript
app.get('/files/:id/metadata', async (req, res) => {
  const bucket = storage.getBucket();

  if (!bucket) {
    return res.status(500).json({ error: 'Storage not ready' });
  }

  try {
    const files = await bucket
      .find({ _id: new ObjectId(req.params.id) })
      .toArray();

    if (files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = files[0];
    res.json({
      id: file._id,
      filename: file.filename,
      length: file.length,
      chunkSize: file.chunkSize,
      uploadDate: file.uploadDate,
      contentType: file.contentType,
      metadata: file.metadata,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metadata' });
  }
});
```

## Advanced Patterns

### Deferred Connection

```typescript
// Create storage before database is connected
const storage = new BunGridFSStorage({
  db: getMongooseDb(),
  file: (req, file) => ({
    filename: file.originalname,
    bucketName: 'uploads',
  }),
});

async function getMongooseDb() {
  // Check if already connected
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    console.log('Using existing connection');
    return mongoose.connection.db;
  }

  console.log('Waiting for mongoose to connect...');

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for mongoose connection'));
    }, 30000);

    mongoose.connection.once('open', () => {
      clearTimeout(timeout);
      if (mongoose.connection.db) {
        resolve(mongoose.connection.db);
      } else {
        reject(new Error('Mongoose connected but db is null'));
      }
    });

    mongoose.connection.once('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}
```

### Multiple Buckets

```typescript
// Create separate storage for different file types
const imageStorage = new BunGridFSStorage({
  db: mongoose.connection.db,
  file: (req, file) => ({
    filename: `${Date.now()}-${file.originalname}`,
    bucketName: 'images',
  }),
});

const documentStorage = new BunGridFSStorage({
  db: mongoose.connection.db,
  file: (req, file) => ({
    filename: `${Date.now()}-${file.originalname}`,
    bucketName: 'documents',
  }),
});

const uploadImage = multer({ storage: imageStorage });
const uploadDocument = multer({ storage: documentStorage });

app.post('/upload/image', uploadImage.single('image'), handleImageUpload);
app.post('/upload/document', uploadDocument.single('doc'), handleDocumentUpload);
```

### File Validation

```typescript
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ message: 'File uploaded', file: req.file });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }

  res.status(500).json({ error: error.message });
});
```

### Progress Tracking

```typescript
import { Transform } from 'stream';

class ProgressTracker extends Transform {
  private bytesWritten = 0;
  private totalBytes: number;

  constructor(totalBytes: number, private onProgress: (percent: number) => void) {
    super();
    this.totalBytes = totalBytes;
  }

  _transform(chunk: any, encoding: string, callback: Function) {
    this.bytesWritten += chunk.length;
    const percent = Math.round((this.bytesWritten / this.totalBytes) * 100);
    this.onProgress(percent);
    callback(null, chunk);
  }
}

// Use in upload endpoint
app.post('/upload-with-progress', (req, res) => {
  const form = new multiparty.Form();

  form.on('part', (part) => {
    if (part.filename) {
      const progressTracker = new ProgressTracker(
        part.byteCount,
        (percent) => {
          console.log(`Upload progress: ${percent}%`);
          // Send progress to client via WebSocket
          io.emit('upload-progress', { percent });
        }
      );

      part.pipe(progressTracker).pipe(uploadStream);
    }
  });

  form.parse(req);
});
```

### Cleanup Old Files

```typescript
import { GridFSBucket } from 'mongodb';

async function cleanupOldFiles(olderThanDays: number) {
  const bucket = storage.getBucket();

  if (!bucket) {
    throw new Error('Storage not ready');
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const files = await bucket
    .find({
      uploadDate: { $lt: cutoffDate },
    })
    .toArray();

  console.log(`Found ${files.length} files to delete`);

  for (const file of files) {
    await bucket.delete(file._id);
    console.log(`Deleted file: ${file.filename}`);
  }

  return files.length;
}

// Schedule cleanup job (example with node-cron)
import cron from 'node-cron';

cron.schedule('0 0 * * *', async () => {
  console.log('Running daily cleanup...');
  const deleted = await cleanupOldFiles(30);
  console.log(`Cleaned up ${deleted} files`);
});
```

## Testing

### Unit Test Example

```typescript
import { describe, test, expect, mock } from 'bun:test';
import { BunGridFSStorage } from 'bun-gridfs-storage';

describe('BunGridFSStorage', () => {
  test('should create instance', () => {
    const storage = new BunGridFSStorage({
      db: {} as any,
      file: (req, file) => ({
        filename: file.originalname,
        bucketName: 'test',
      }),
    });

    expect(storage).toBeDefined();
    expect(storage.isReady()).toBe(false);
  });

  test('should emit connection event', (done) => {
    const mockDb = { collection: () => ({}) } as any;

    const storage = new BunGridFSStorage({
      db: Promise.resolve(mockDb),
    });

    storage.on('connection', (db) => {
      expect(db).toBe(mockDb);
      done();
    });
  });
});
```

## Best Practices

1. **Always handle errors:**
   ```typescript
   storage.on('streamError', (error) => {
     console.error('Upload error:', error);
     // Log to monitoring service
   });
   ```

2. **Validate files before upload:**
   ```typescript
   const upload = multer({
     storage,
     fileFilter: (req, file, cb) => {
       // Validate file type, size, etc.
     },
   });
   ```

3. **Use metadata for searchability:**
   ```typescript
   file: (req, file) => ({
     filename: file.originalname,
     bucketName: 'uploads',
     metadata: {
       tags: req.body.tags,
       category: req.body.category,
       searchable: true,
     },
   })
   ```

4. **Implement cleanup strategies:**
   ```typescript
   // Schedule periodic cleanup of old or unused files
   ```

5. **Monitor storage usage:**
   ```typescript
   async function getStorageStats() {
     const bucket = storage.getBucket();
     const files = await bucket.find({}).toArray();
     const totalSize = files.reduce((sum, file) => sum + file.length, 0);
     return { fileCount: files.length, totalSize };
   }
   ```
