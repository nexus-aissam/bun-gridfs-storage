/**
 * Integration tests for BunGridFSStorage with mocked MongoDB
 */

import { describe, test, expect, beforeAll, mock } from "bun:test";
import { BunGridFSStorage } from "../src/storage";
import type { MulterFile } from "../src/types";
import { EventEmitter } from "events";
import { ObjectId } from "mongodb";

describe("BunGridFSStorage Integration", () => {
  describe("Connection lifecycle", () => {
    test("should emit connection event when connected", (done) => {
      const mockDb = {
        collection: () => ({}),
      } as any;

      const storage = new BunGridFSStorage({
        db: Promise.resolve(mockDb),
      });

      storage.on("connection", (db) => {
        expect(db).toBe(mockDb);
        done();
      });
    });

    test("should handle deferred connection", async () => {
      let resolveDb: any;
      const dbPromise = new Promise<any>((resolve) => {
        resolveDb = resolve;
      });

      const storage = new BunGridFSStorage({ db: dbPromise });

      expect(storage.isReady()).toBe(false);

      // Resolve connection after delay
      setTimeout(() => {
        resolveDb({
          collection: () => ({}),
        });
      }, 50);

      // Wait a bit for connection
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  describe("File upload flow", () => {
    test("should handle file upload with mocked stream", (done) => {
      const mockUploadStream = new EventEmitter() as any;
      mockUploadStream.id = new ObjectId();
      mockUploadStream.destroy = mock(() => {});

      const mockBucket = {
        openUploadStream: mock(() => mockUploadStream),
        delete: mock(() => Promise.resolve()),
      };

      const mockDb = {
        collection: () => ({}),
      } as any;

      const storage = new BunGridFSStorage({
        db: Promise.resolve(mockDb),
      });

      // Manually set bucket for testing
      (storage as any).bucket = mockBucket;
      (storage as any).connected = true;

      const mockFileStream = new EventEmitter() as any;
      mockFileStream.pipe = mock((destination: any) => {
        // Simulate data chunks
        setTimeout(() => {
          mockFileStream.emit("data", Buffer.from("test data"));
          destination.emit("finish");
        }, 10);
        return destination;
      });

      const mockFile: MulterFile = {
        fieldname: "file",
        originalname: "test.txt",
        encoding: "7bit",
        mimetype: "text/plain",
        size: 9,
        stream: mockFileStream as any,
        destination: "",
        filename: "",
        path: "",
        buffer: Buffer.from(""),
      };

      storage.on("file", (file) => {
        expect(file.originalname).toBe("test.txt");
        expect(file.size).toBeGreaterThan(0);
        done();
      });

      storage._handleFile({} as any, mockFile, (error, info) => {
        if (error) {
          done(error);
        }
      });
    });

    test("should emit streamError on upload failure", (done) => {
      const mockUploadStream = new EventEmitter() as any;
      mockUploadStream.id = new ObjectId();
      mockUploadStream.destroy = mock(() => {});

      const mockBucket = {
        openUploadStream: mock(() => mockUploadStream),
      };

      const mockDb = {
        collection: () => ({}),
      } as any;

      const storage = new BunGridFSStorage({
        db: Promise.resolve(mockDb),
      });

      (storage as any).bucket = mockBucket;
      (storage as any).connected = true;

      const mockFileStream = new EventEmitter() as any;
      mockFileStream.pipe = mock((destination: any) => {
        setTimeout(() => {
          const error = new Error("Upload failed");
          mockFileStream.emit("error", error);
        }, 10);
        return destination;
      });

      const mockFile: MulterFile = {
        fieldname: "file",
        originalname: "test.txt",
        encoding: "7bit",
        mimetype: "text/plain",
        size: 0,
        stream: mockFileStream as any,
        destination: "",
        filename: "",
        path: "",
        buffer: Buffer.from(""),
      };

      storage.on("streamError", (error) => {
        expect(error.message).toBe("Upload failed");
        done();
      });

      storage._handleFile({} as any, mockFile, () => {});
    });
  });

  describe("File removal", () => {
    test("should remove file from GridFS", (done) => {
      const mockFileId = new ObjectId();

      const mockBucket = {
        delete: mock((id: ObjectId) => {
          expect(id).toBe(mockFileId);
          return Promise.resolve();
        }),
      };

      const mockDb = {
        collection: () => ({}),
      } as any;

      const storage = new BunGridFSStorage({
        db: Promise.resolve(mockDb),
      });

      (storage as any).bucket = mockBucket;
      (storage as any).connected = true;

      const mockFile = {
        id: mockFileId,
        filename: "test.txt",
        originalname: "test.txt",
        encoding: "7bit",
        mimetype: "text/plain",
        size: 100,
        bucketName: "uploads",
      };

      storage._removeFile({} as any, mockFile as any, (error) => {
        expect(error).toBeNull();
        expect(mockBucket.delete).toHaveBeenCalled();
        done();
      });
    });

    test("should handle removal errors", (done) => {
      const mockFileId = new ObjectId();

      const mockBucket = {
        delete: mock(() => Promise.reject(new Error("Delete failed"))),
      };

      const mockDb = {
        collection: () => ({}),
      } as any;

      const storage = new BunGridFSStorage({
        db: Promise.resolve(mockDb),
      });

      (storage as any).bucket = mockBucket;
      (storage as any).connected = true;

      const mockFile = {
        id: mockFileId,
      };

      storage._removeFile({} as any, mockFile as any, (error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toBe("Delete failed");
        done();
      });
    });
  });

  describe("Custom file configuration", () => {
    test("should apply custom filename and metadata", (done) => {
      const customMetadata = { userId: "user123", folder: "documents" };

      const mockUploadStream = new EventEmitter() as any;
      mockUploadStream.id = new ObjectId();

      let capturedOptions: any;

      const mockBucket = {
        openUploadStream: mock((filename: string, options: any) => {
          capturedOptions = options;
          return mockUploadStream;
        }),
      };

      const mockDb = {
        collection: () => ({}),
      } as any;

      const storage = new BunGridFSStorage({
        db: Promise.resolve(mockDb),
        file: (req, file) => ({
          filename: `custom-${Date.now()}-${file.originalname}`,
          bucketName: "custom-bucket",
          metadata: customMetadata,
          contentType: "custom/type",
          chunkSize: 512 * 1024,
        }),
      });

      (storage as any).bucket = mockBucket;
      (storage as any).connected = true;

      const mockFileStream = new EventEmitter() as any;
      mockFileStream.pipe = mock((destination: any) => {
        setTimeout(() => {
          destination.emit("finish");
        }, 10);
        return destination;
      });

      const mockFile: MulterFile = {
        fieldname: "file",
        originalname: "test.txt",
        encoding: "7bit",
        mimetype: "text/plain",
        size: 0,
        stream: mockFileStream as any,
        destination: "",
        filename: "",
        path: "",
        buffer: Buffer.from(""),
      };

      storage._handleFile({} as any, mockFile, (error) => {
        if (error) {
          done(error);
          return;
        }

        expect(capturedOptions.metadata).toEqual(customMetadata);
        expect(capturedOptions.contentType).toBe("custom/type");
        expect(capturedOptions.chunkSizeBytes).toBe(512 * 1024);
        done();
      });
    });
  });
});
