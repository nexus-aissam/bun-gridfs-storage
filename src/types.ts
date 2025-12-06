/**
 * TypeScript type definitions for bun-gridfs-storage
 *
 * @module bun-gridfs-storage/types
 * @author Aissam Irhir <aissamirhir@gmail.com>
 */

import type { Request } from "express";
import type { ObjectId } from "mongodb";

/**
 * GridFS file information returned after upload
 */
export interface GridFSFile {
  /** MongoDB ObjectId of the uploaded file */
  id: ObjectId;

  /** Filename used in GridFS */
  filename: string;

  /** Original filename from the upload */
  originalname: string;

  /** File encoding (e.g., "7bit", "base64") */
  encoding: string;

  /** MIME type of the file */
  mimetype: string;

  /** File size in bytes */
  size: number;

  /** GridFS bucket name where file is stored */
  bucketName: string;

  /** Custom metadata stored with the file */
  metadata?: Record<string, any>;

  /** Content type of the file */
  contentType?: string;

  /** Date when the file was uploaded */
  uploadDate?: Date;
}

/**
 * Configuration for storing a file in GridFS
 */
export interface FileConfig {
  /** Filename to use in GridFS */
  filename: string;

  /** GridFS bucket name */
  bucketName: string;

  /** Chunk size in bytes (default: 255KB) */
  chunkSize?: number;

  /** Custom metadata to store with the file */
  metadata?: Record<string, any>;

  /** Content type of the file */
  contentType?: string;
}

/**
 * Multer file type
 */
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  stream: NodeJS.ReadableStream;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

/**
 * Callback function to configure file storage
 * Can return a promise or the configuration directly
 */
export type FileConfigCallback = (
  req: Request,
  file: MulterFile
) => Promise<FileConfig> | FileConfig;

/**
 * Options for initializing BunGridFSStorage
 */
export interface BunGridFSStorageOptions {
  /**
   * MongoDB database connection
   * Can be a Promise (for deferred connection) or direct Db instance
   */
  db: Promise<import("mongodb").Db> | import("mongodb").Db;

  /**
   * Optional callback to configure file storage
   * If not provided, uses original filename and default bucket
   */
  file?: FileConfigCallback;
}

/**
 * Events emitted by BunGridFSStorage
 */
export interface BunGridFSStorageEvents {
  /** Emitted when database connection is established */
  connection: (db: import("mongodb").Db) => void;

  /** Emitted when a file is successfully stored */
  file: (file: GridFSFile) => void;

  /** Emitted when a stream error occurs */
  streamError: (error: Error, fileConfig: Partial<FileConfig>) => void;

  /** Emitted when database connection fails */
  connectionFailed: (error: Error) => void;
}
