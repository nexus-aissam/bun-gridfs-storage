/**
 * Unit tests for BunGridFSStorage
 */

import { describe, test, expect, beforeAll, afterAll, mock } from "bun:test";
import { BunGridFSStorage } from "../src/storage";
import type { GridFSFile, FileConfig, MulterFile } from "../src/types";
import { EventEmitter } from "events";
import { Db, GridFSBucket, ObjectId } from "mongodb";

describe("BunGridFSStorage", () => {
  describe("Constructor", () => {
    test("should create instance with promise db", () => {
      const dbPromise = Promise.resolve({} as Db);
      const storage = new BunGridFSStorage({ db: dbPromise });

      expect(storage).toBeInstanceOf(BunGridFSStorage);
      expect(storage).toBeInstanceOf(EventEmitter);
    });

    test("should create instance with direct db", () => {
      const db = {} as Db;
      const storage = new BunGridFSStorage({ db });

      expect(storage).toBeInstanceOf(BunGridFSStorage);
    });

    test("should use custom file config callback", () => {
      const fileConfig = mock((req: any, file: MulterFile) => ({
        filename: `custom-${file.originalname}`,
        bucketName: "custom-bucket",
      }));

      const storage = new BunGridFSStorage({
        db: {} as Db,
        file: fileConfig,
      });

      expect(storage).toBeInstanceOf(BunGridFSStorage);
    });
  });

  describe("isReady", () => {
    test("should return false before connection", () => {
      const storage = new BunGridFSStorage({
        db: new Promise(() => {}), // Never resolves
      });

      expect(storage.isReady()).toBe(false);
    });
  });

  describe("getBucket", () => {
    test("should return null before initialization", () => {
      const storage = new BunGridFSStorage({
        db: new Promise(() => {}),
      });

      expect(storage.getBucket()).toBeNull();
    });
  });

  describe("Configuration", () => {
    test("should set default bucket name", () => {
      const storage = new BunGridFSStorage({
        db: {} as Db,
      });

      storage.setDefaultBucketName("my-bucket");
      // No direct assertion, but method should not throw
      expect(true).toBe(true);
    });

    test("should set default chunk size", () => {
      const storage = new BunGridFSStorage({
        db: {} as Db,
      });

      storage.setDefaultChunkSize(512 * 1024); // 512KB
      // No direct assertion, but method should not throw
      expect(true).toBe(true);
    });
  });

  describe("Event handling", () => {
    test("should emit connectionFailed on error", (done) => {
      const badDbPromise = Promise.reject(new Error("Connection failed"));

      const storage = new BunGridFSStorage({ db: badDbPromise });

      storage.on("connectionFailed", (error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Connection failed");
        done();
      });
    });
  });

  describe("File configuration", () => {
    test("should use default file config if not provided", async () => {
      const mockDb = {
        collection: () => ({}),
      } as unknown as Db;

      const storage = new BunGridFSStorage({ db: mockDb });

      // Access private fileConfig through type assertion
      const config = await (storage as any).fileConfig(
        {},
        { originalname: "test.txt" } as MulterFile
      );

      expect(config.filename).toBe("test.txt");
      expect(config.bucketName).toBe("fs");
    });

    test("should use custom file config", async () => {
      const mockDb = {} as Db;

      const storage = new BunGridFSStorage({
        db: mockDb,
        file: (req, file) => ({
          filename: `prefix-${file.originalname}`,
          bucketName: "custom",
          metadata: { userId: "123" },
        }),
      });

      const config = await (storage as any).fileConfig(
        {},
        { originalname: "test.txt" } as MulterFile
      );

      expect(config.filename).toBe("prefix-test.txt");
      expect(config.bucketName).toBe("custom");
      expect(config.metadata).toEqual({ userId: "123" });
    });

    test("should support async file config", async () => {
      const mockDb = {} as Db;

      const storage = new BunGridFSStorage({
        db: mockDb,
        file: async (req, file) => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10));
          return {
            filename: `async-${file.originalname}`,
            bucketName: "async-bucket",
          };
        },
      });

      const config = await (storage as any).fileConfig(
        {},
        { originalname: "test.txt" } as MulterFile
      );

      expect(config.filename).toBe("async-test.txt");
      expect(config.bucketName).toBe("async-bucket");
    });
  });

  describe("Type exports", () => {
    test("should have correct GridFSFile interface", () => {
      const file: GridFSFile = {
        id: new ObjectId(),
        filename: "test.txt",
        originalname: "original.txt",
        encoding: "7bit",
        mimetype: "text/plain",
        size: 1024,
        bucketName: "uploads",
        metadata: { key: "value" },
        contentType: "text/plain",
        uploadDate: new Date(),
      };

      expect(file.filename).toBe("test.txt");
      expect(file.size).toBe(1024);
    });

    test("should have correct FileConfig interface", () => {
      const config: FileConfig = {
        filename: "test.txt",
        bucketName: "uploads",
        chunkSize: 255 * 1024,
        metadata: { user: "123" },
        contentType: "text/plain",
      };

      expect(config.filename).toBe("test.txt");
      expect(config.bucketName).toBe("uploads");
    });
  });
});
