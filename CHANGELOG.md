# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-XX

### Added

- Initial release of `bun-gridfs-storage`
- Multer storage engine for GridFS compatible with both Bun and Node.js
- Full TypeScript support with strict mode enabled
- Event-driven architecture with 4 events:
  - `connection` - Emitted when database connection is established
  - `file` - Emitted when a file is successfully uploaded
  - `streamError` - Emitted when a stream error occurs
  - `connectionFailed` - Emitted when database connection fails
- Custom file configuration callback support
- Deferred connection support (Promise-based database connection)
- Dual module support (ESM and CommonJS)
- Comprehensive TypeScript type definitions
- Unit tests using Bun's test runner
- Integration tests with mocked MongoDB
- Detailed documentation and examples
- MIT License

### Features

- **Bun Compatibility**: Optimized stream handling for Bun runtime
- **Node.js Support**: Full backward compatibility with Node.js 18+
- **Type Safety**: Complete TypeScript definitions with strict mode
- **Flexible Configuration**:
  - Custom filenames
  - Custom metadata
  - Custom bucket names
  - Configurable chunk sizes
- **Production Ready**: Based on battle-tested implementation
- **Developer Experience**:
  - Clear error messages
  - Comprehensive documentation
  - Real-world examples
  - Best practices guide

### Dependencies

- **Peer Dependencies**:
  - `mongodb` ^6.0.0
  - `mongoose` ^8.0.0
  - `multer` ^1.4.0
- **Dev Dependencies**:
  - `@types/express` ^5.0.0
  - `@types/multer` ^1.4.12
  - `bun-types` latest
  - `typescript` ^5.9.0

### Documentation

- Comprehensive README.md with installation and usage instructions
- API documentation for all public methods and types
- EXAMPLES.md with 15+ practical examples
- TypeScript type definitions for all exported types
- Comparison with `multer-gridfs-storage`

### Testing

- 13+ unit tests covering core functionality
- Integration tests with mocked MongoDB
- Test coverage for:
  - Constructor variations
  - Connection lifecycle
  - File upload flow
  - File removal
  - Event handling
  - Custom file configuration
  - Error handling

### Build System

- Dual build output (ESM and CommonJS)
- TypeScript declaration files
- Optimized for tree-shaking
- Minimal bundle size (1.34 MB bundled with dependencies)

## [Unreleased]

### Planned Features

- Additional storage providers (S3, Azure Blob, etc.)
- Stream progress tracking
- Built-in file validation
- Automatic thumbnail generation for images
- File encryption support
- Compression support
- Multi-part upload support

---

[1.0.0]: https://github.com/aissamirhir/bun-gridfs-storage/releases/tag/v1.0.0
