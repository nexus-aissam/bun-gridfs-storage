# bun-gridfs-storage

A **Multer storage engine** for **GridFS** that works seamlessly with both **Bun** and **Node.js**.

This package provides a production-ready, type-safe implementation for storing uploaded files in MongoDB GridFS using Multer. Unlike the original `multer-gridfs-storage`, this package is optimized for Bun's runtime while maintaining full Node.js compatibility.

## Features

- ✅ **Bun & Node.js compatible** - Works with both runtimes
- ✅ **TypeScript first** - Full type safety with strict mode
- ✅ **Event-driven** - Monitor upload progress and errors
- ✅ **Flexible configuration** - Custom filenames, metadata, and bucket names
- ✅ **Promise support** - Deferred database connections
- ✅ **Stream handling** - Optimized for Bun's stream implementation
- ✅ **Production ready** - Based on battle-tested implementation

## Installation

### Bun

```bash
bun add bun-gridfs-storage multer mongodb mongoose
```

### npm

```bash
npm install bun-gridfs-storage multer mongodb mongoose
```

### Yarn

```bash
yarn add bun-gridfs-storage multer mongodb mongoose
```

## Quick Start

### Basic Usage

```typescript
import { BunGridFSStorage } from 'bun-gridfs-storage';
import multer from 'multer';
import mongoose from 'mongoose';

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/mydb');

// Create storage engine
const storage = new BunGridFSStorage({
  db: mongoose.connection.db,
  file: (req, file) => ({
    filename: `${Date.now()}-${file.originalname}`,
    bucketName: 'uploads',
  }),
});

// Create multer instance
const upload = multer({ storage });

// Use in Express route
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ file: req.file });
});
```

### Advanced Usage with Metadata

```typescript
const storage = new BunGridFSStorage({
  db: mongoose.connection.db,
  file: async (req, file) => {
    // Generate unique filename
    const uid = crypto.randomUUID();

    return {
      filename: `${uid}-${file.originalname}`,
      bucketName: 'uploads',
      chunkSize: 255 * 1024, // 255KB chunks
      metadata: {
        userId: req.user.id,
        uploadDate: new Date(),
        originalName: file.originalname,
        mimeType: file.mimetype,
      },
      contentType: file.mimetype,
    };
  },
});

// Listen to events
storage.on('connection', (db) => {
  console.log('GridFS storage connected');
});

storage.on('file', (file) => {
  console.log('File uploaded:', file.filename, 'Size:', file.size);
});

storage.on('streamError', (error, fileConfig) => {
  console.error('Upload error:', error, fileConfig);
});
```

### Deferred Connection

```typescript
// Storage can be created before database connection
const storage = new BunGridFSStorage({
  db: getMongooseDb(), // Returns Promise<Db>
  file: (req, file) => ({
    filename: file.originalname,
    bucketName: 'uploads',
  }),
});

async function getMongooseDb() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.db;
  }

  return new Promise((resolve, reject) => {
    mongoose.connection.once('open', () => {
      resolve(mongoose.connection.db);
    });

    mongoose.connection.once('error', (err) => {
      reject(err);
    });
  });
}
```

## API Documentation

### Constructor

```typescript
new BunGridFSStorage(options: BunGridFSStorageOptions)
```

#### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `db` | `Promise<Db>` \| `Db` | Yes | MongoDB database connection (can be a promise) |
| `file` | `FileConfigCallback` | No | Callback to configure file storage |

#### FileConfigCallback

```typescript
type FileConfigCallback = (
  req: Request,
  file: Express.Multer.File
) => Promise<FileConfig> | FileConfig;
```

#### FileConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `filename` | `string` | Yes | Filename to use in GridFS |
| `bucketName` | `string` | Yes | GridFS bucket name |
| `chunkSize` | `number` | No | Chunk size in bytes (default: 255KB) |
| `metadata` | `Record<string, any>` | No | Custom metadata to store |
| `contentType` | `string` | No | Content type (defaults to file mimetype) |

### Methods

#### `isReady(): boolean`

Check if the storage engine is connected and ready.

```typescript
if (storage.isReady()) {
  console.log('Storage is ready');
}
```

#### `getBucket(): GridFSBucket | null`

Get the underlying GridFSBucket instance.

```typescript
const bucket = storage.getBucket();
if (bucket) {
  // Use bucket directly for advanced operations
  const downloadStream = bucket.openDownloadStreamByName('myfile.txt');
}
```

#### `setDefaultBucketName(name: string): void`

Set the default bucket name.

```typescript
storage.setDefaultBucketName('my-bucket');
```

#### `setDefaultChunkSize(size: number): void`

Set the default chunk size in bytes.

```typescript
storage.setDefaultChunkSize(512 * 1024); // 512KB
```

### Events

The storage engine extends `EventEmitter` and emits the following events:

#### `connection`

Emitted when database connection is established.

```typescript
storage.on('connection', (db: Db) => {
  console.log('Connected to database');
});
```

#### `file`

Emitted when a file is successfully uploaded.

```typescript
storage.on('file', (file: GridFSFile) => {
  console.log('Uploaded:', file.filename, 'ID:', file.id);
});
```

#### `streamError`

Emitted when a stream error occurs during upload.

```typescript
storage.on('streamError', (error: Error, fileConfig: Partial<FileConfig>) => {
  console.error('Upload failed:', error.message, fileConfig);
});
```

#### `connectionFailed`

Emitted when database connection fails.

```typescript
storage.on('connectionFailed', (error: Error) => {
  console.error('Connection failed:', error.message);
});
```

## TypeScript Support

Full TypeScript definitions are included. Import types as needed:

```typescript
import type {
  GridFSFile,
  FileConfig,
  FileConfigCallback,
  BunGridFSStorageOptions,
  BunGridFSStorageEvents,
} from 'bun-gridfs-storage';
```

### GridFSFile Interface

```typescript
interface GridFSFile {
  id: ObjectId;              // MongoDB ObjectId
  filename: string;          // Stored filename
  originalname: string;      // Original filename
  encoding: string;          // File encoding
  mimetype: string;          // MIME type
  size: number;              // File size in bytes
  bucketName: string;        // Bucket name
  metadata?: Record<string, any>;  // Custom metadata
  contentType?: string;      // Content type
  uploadDate?: Date;         // Upload timestamp
}
```

## Examples

### Express.js with File Upload

```typescript
import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { BunGridFSStorage } from 'bun-gridfs-storage';

const app = express();

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/myapp');

// Create storage
const storage = new BunGridFSStorage({
  db: mongoose.connection.db,
  file: (req, file) => ({
    filename: `${Date.now()}-${file.originalname}`,
    bucketName: 'uploads',
    metadata: {
      userId: req.user?.id,
      uploadedAt: new Date(),
    },
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Single file upload
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({
    message: 'File uploaded successfully',
    file: req.file,
  });
});

// Multiple files upload
app.post('/upload-multiple', upload.array('files', 5), (req, res) => {
  res.json({
    message: 'Files uploaded successfully',
    files: req.files,
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### File Download

```typescript
app.get('/download/:filename', async (req, res) => {
  const bucket = storage.getBucket();

  if (!bucket) {
    return res.status(500).send('Storage not ready');
  }

  try {
    const downloadStream = bucket.openDownloadStreamByName(req.params.filename);

    downloadStream.on('error', (error) => {
      res.status(404).send('File not found');
    });

    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).send('Download failed');
  }
});
```

### File Deletion

```typescript
app.delete('/files/:id', async (req, res) => {
  const bucket = storage.getBucket();

  if (!bucket) {
    return res.status(500).send('Storage not ready');
  }

  try {
    await bucket.delete(new ObjectId(req.params.id));
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).send('Deletion failed');
  }
});
```

## Why This Package?

### Bun Compatibility

The original `multer-gridfs-storage` package has compatibility issues with Bun's runtime. This package:

- Uses Bun-optimized stream handling
- Properly handles EventEmitter in Bun
- Tested with Bun's test runner
- Maintains Node.js compatibility

### Comparison with multer-gridfs-storage

| Feature | bun-gridfs-storage | multer-gridfs-storage |
|---------|-------------------|----------------------|
| Bun Support | ✅ | ❌ |
| Node.js Support | ✅ | ✅ |
| TypeScript | ✅ Full types | ⚠️ Partial |
| Modern API | ✅ Promise-based | ⚠️ Callback-based |
| Events | ✅ 4 events | ✅ Multiple events |
| Maintenance | ✅ Active | ⚠️ Limited |

## Development

### Build

```bash
bun run build
```

This will generate:
- `dist/index.js` - CommonJS build
- `dist/index.mjs` - ESM build
- `dist/index.d.ts` - TypeScript declarations

### Test

```bash
bun test
```

Run tests with watch mode:

```bash
bun test --watch
```

### Clean

```bash
bun run clean
```

## Requirements

- **Node.js** >= 18.0.0 OR **Bun** >= 1.0.0
- **MongoDB** >= 6.0.0
- **Mongoose** >= 8.0.0
- **Multer** >= 1.4.0

## License

MIT License - see [LICENSE](LICENSE) file for details

## Author

**Aissam Irhir** <aissamirhir@gmail.com>

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Changelog

### 1.0.0 (2025-01-XX)

- Initial release
- Bun and Node.js support
- Full TypeScript support
- Event-driven architecture
- Custom file configuration
- Deferred connection support

## Support

If you encounter any issues or have questions:

- Open an issue on [GitHub](https://github.com/aissamirhir/bun-gridfs-storage/issues)
- Check existing issues for solutions

## Acknowledgments

This package is inspired by and based on the battle-tested implementation used in production environments. Special thanks to the MongoDB and Multer communities.
