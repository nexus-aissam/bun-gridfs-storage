# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2025-12-06

### Added

- **URL Connection**: Connect directly with MongoDB URI string (`url` option) - no mongoose required!
- **close() Method**: Properly close MongoDB connections when using URL
- Exported `MongoDbLike` type for better TypeScript integration

### Fixed

- **Type Compatibility**: Fixed TypeScript type conflicts with mongoose's internal mongodb types
- **MongoDbLike Interface**: Added flexible `MongoDbLike` interface for db parameter (compatible with `mongoose.connection.db`)
- **MulterFile Type**: Made optional fields truly optional (`destination`, `filename`, `path`, `buffer`)

---

## [1.1.0] - 2025-12-06

### Changed

- **Improved Compatibility**: Now supports mongoose 5.x, 6.x, 7.x, and 8.x
- **Improved Compatibility**: Now supports mongodb driver 4.x, 5.x, and 6.x
- **Dynamic Import**: GridFSBucket is now dynamically imported for version compatibility
- **Reduced Bundle Size**: From 1.3MB to ~5KB by marking dependencies as external
- **Removed src from npm**: Package now only includes dist folder

### Fixed

- Type conflicts between different mongodb versions
- Compatibility issues with older mongoose versions

### Dependencies

- **Peer Dependencies** (updated):
  - `mongodb` >=4.0.0 (was ^6.0.0)
  - `mongoose` >=5.0.0 (was ^8.0.0)
  - `multer` >=1.4.0

---

## [1.0.0] - 2025-12-06

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
  - `mongodb` >=4.0.0
  - `mongoose` >=5.0.0
  - `multer` >=1.4.0
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

- 20 unit tests covering core functionality
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
- Minimal bundle size (~5KB with external dependencies)

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
