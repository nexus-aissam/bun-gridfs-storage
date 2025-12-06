/**
 * bun-gridfs-storage - A Multer storage engine for GridFS
 * Works with both Bun and Node.js
 *
 * @module bun-gridfs-storage
 * @author Aissam Irhir <aissamirhir@gmail.com>
 * @license MIT
 */

export { BunGridFSStorage } from "./storage";
export type {
  GridFSFile,
  FileConfig,
  FileConfigCallback,
  BunGridFSStorageOptions,
  BunGridFSStorageEvents,
  MulterFile,
} from "./types";
