/**
 * BunGridFSStorage - Multer storage engine for GridFS
 * Works with both Bun and Node.js
 *
 * @module bun-gridfs-storage/storage
 * @author Aissam Irhir <aissamirhir@gmail.com>
 */

import { EventEmitter } from "events";
import type { Request } from "express";
import type { ObjectId } from "mongodb";
import type {
  BunGridFSStorageOptions,
  FileConfig,
  FileConfigCallback,
  GridFSFile,
  MulterFile,
} from "./types";

// Type for GridFSBucket (works with any mongodb version)
type GridFSBucketType = InstanceType<typeof import("mongodb").GridFSBucket>;

/**
 * Custom Bun-compatible GridFS Storage Engine for Multer
 *
 * @example
 * ```typescript
 * import { BunGridFSStorage } from 'bun-gridfs-storage';
 * import multer from 'multer';
 * import mongoose from 'mongoose';
 *
 * const storage = new BunGridFSStorage({
 *   db: mongoose.connection.db,
 *   file: (req, file) => ({
 *     filename: `${Date.now()}-${file.originalname}`,
 *     bucketName: 'uploads',
 *   }),
 * });
 *
 * const upload = multer({ storage });
 * ```
 */
export class BunGridFSStorage extends EventEmitter {
  private dbPromise: Promise<any>;
  private db: any = null;
  private bucket: GridFSBucketType | null = null;
  private fileConfig: FileConfigCallback;
  private connected: boolean = false;
  private defaultBucketName: string = "fs";
  private defaultChunkSize: number = 255 * 1024; // 255KB
  private mongoClient: any = null;

  constructor(options: BunGridFSStorageOptions) {
    super();

    // Handle different connection methods
    if (options.url) {
      // Connect using MongoDB URI
      this.dbPromise = this.connectWithUrl(options.url);
    } else if (options.db instanceof Promise) {
      this.dbPromise = options.db;
    } else if (options.db) {
      this.dbPromise = Promise.resolve(options.db);
    } else {
      throw new Error("Either 'db' or 'url' must be provided");
    }

    // Default file config function
    this.fileConfig =
      options.file ||
      ((_req: Request, file: MulterFile): FileConfig => ({
        filename: file.originalname,
        bucketName: this.defaultBucketName,
      }));

    // Initialize connection
    this.initConnection();
  }

  /**
   * Connect to MongoDB using a connection URI
   * @private
   */
  private async connectWithUrl(url: string): Promise<any> {
    const { MongoClient } = await import("mongodb");
    this.mongoClient = new MongoClient(url);
    await this.mongoClient.connect();
    return this.mongoClient.db();
  }

  /**
   * Initialize database connection and GridFS bucket
   * @private
   */
  private async initConnection(): Promise<void> {
    try {
      this.db = await this.dbPromise;

      if (!this.db) {
        throw new Error("Database connection is null");
      }

      // Only create bucket if db.collection method exists
      if (typeof this.db.collection === "function") {
        // Dynamically import GridFSBucket to support all mongodb versions
        const { GridFSBucket } = await import("mongodb");

        this.bucket = new GridFSBucket(this.db, {
          bucketName: this.defaultBucketName,
          chunkSizeBytes: this.defaultChunkSize,
        }) as GridFSBucketType;

        this.connected = true;
        this.emit("connection", this.db);
      } else {
        throw new Error("Invalid database instance: missing collection method");
      }
    } catch (error) {
      this.emit("connectionFailed", error);
      // Only log in non-test environments
      if (process.env.NODE_ENV !== "test") {
        console.error("GridFS storage connection failed:", error);
      }
    }
  }

  /**
   * Multer storage engine _handleFile method
   * Called when a file needs to be stored
   *
   * @param req - Express request object
   * @param file - Multer file object
   * @param cb - Callback to invoke when done
   */
  async _handleFile(
    req: Request,
    file: MulterFile,
    cb: (error?: Error | null, info?: Partial<GridFSFile>) => void
  ): Promise<void> {
    try {
      // Wait for connection if not ready
      if (!this.connected || !this.bucket) {
        await this.waitForConnection();
      }

      if (!this.db) {
        throw new Error("Database not initialized");
      }

      // Get file configuration
      const fileConfig = await this.fileConfig(req, file);

      // Create bucket for this upload (use fileConfig.bucketName if provided)
      const { GridFSBucket } = await import("mongodb");
      const uploadBucket = new GridFSBucket(this.db, {
        bucketName: fileConfig.bucketName || this.defaultBucketName,
        chunkSizeBytes: fileConfig.chunkSize || this.defaultChunkSize,
      });

      // Create upload stream
      const uploadStream = uploadBucket.openUploadStream(fileConfig.filename, {
        chunkSizeBytes: fileConfig.chunkSize || this.defaultChunkSize,
        metadata: fileConfig.metadata,
        contentType: fileConfig.contentType || file.mimetype,
      });

      // Track uploaded size
      let size = 0;

      // Handle stream events
      file.stream.on("data", (chunk: Buffer) => {
        size += chunk.length;
      });

      file.stream.on("error", (error: Error) => {
        this.emit("streamError", error, fileConfig);
        uploadStream.destroy(error);
        cb(error);
      });

      uploadStream.on("error", (error: Error) => {
        this.emit("streamError", error, fileConfig);
        cb(error);
      });

      uploadStream.on("finish", () => {
        const storedFile: GridFSFile = {
          id: uploadStream.id as ObjectId,
          filename: fileConfig.filename,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          size: size,
          bucketName: fileConfig.bucketName,
          metadata: fileConfig.metadata,
          contentType: fileConfig.contentType || file.mimetype,
          uploadDate: new Date(),
        };

        this.emit("file", storedFile);
        cb(null, storedFile);
      });

      // Pipe the file stream to GridFS
      file.stream.pipe(uploadStream);
    } catch (error: any) {
      this.emit("streamError", error, {});
      cb(error);
    }
  }

  /**
   * Multer storage engine _removeFile method
   * Called when a file needs to be removed
   *
   * @param _req - Express request object (unused)
   * @param file - GridFS file object to remove
   * @param cb - Callback to invoke when done
   */
  async _removeFile(
    _req: Request,
    file: GridFSFile,
    cb: (error?: Error | null) => void
  ): Promise<void> {
    try {
      if (!this.bucket) {
        await this.waitForConnection();
      }

      if (!this.bucket) {
        throw new Error("GridFS bucket not initialized");
      }

      await this.bucket.delete(file.id);
      cb(null);
    } catch (error: any) {
      cb(error);
    }
  }

  /**
   * Wait for the storage to be connected
   * @private
   * @param maxWaitMs - Maximum time to wait in milliseconds (default: 10000)
   */
  private async waitForConnection(maxWaitMs: number = 10000): Promise<void> {
    if (this.connected && this.bucket) {
      return;
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkConnection = () => {
        if (this.connected && this.bucket) {
          resolve();
        } else if (Date.now() - startTime > maxWaitMs) {
          reject(new Error("Timeout waiting for GridFS connection"));
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }

  /**
   * Check if storage is ready
   * @returns True if connected and bucket is initialized
   */
  isReady(): boolean {
    return this.connected && this.bucket !== null;
  }

  /**
   * Get the GridFS bucket instance
   * @returns GridFSBucket instance or null if not initialized
   */
  getBucket(): GridFSBucketType | null {
    return this.bucket;
  }

  /**
   * Set default bucket name for new instances
   * @param name - Bucket name
   */
  setDefaultBucketName(name: string): void {
    this.defaultBucketName = name;
  }

  /**
   * Set default chunk size for new instances
   * @param size - Chunk size in bytes
   */
  setDefaultChunkSize(size: number): void {
    this.defaultChunkSize = size;
  }

  /**
   * Close the MongoDB connection (only if connected via URL)
   * Call this when shutting down your application
   */
  async close(): Promise<void> {
    if (this.mongoClient) {
      await this.mongoClient.close();
      this.mongoClient = null;
      this.connected = false;
      this.bucket = null;
    }
  }
}
