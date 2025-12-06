# Contributing to bun-gridfs-storage

Thank you for your interest in contributing to `bun-gridfs-storage`! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/bun-gridfs-storage.git
   cd bun-gridfs-storage
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/aissamirhir/bun-gridfs-storage.git
   ```

## Development Setup

### Prerequisites

- **Bun** >= 1.0.0 OR **Node.js** >= 18.0.0
- **Git**
- **MongoDB** (for integration testing, optional)

### Install Dependencies

```bash
bun install
```

### Build the Project

```bash
bun run build
```

This will generate:
- `dist/index.js` - CommonJS build
- `dist/index.mjs` - ESM build
- `dist/index.d.ts` - TypeScript declarations

### Run Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch
```

### Clean Build

```bash
bun run clean
```

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feature/add-xyz` - For new features
- `fix/bug-xyz` - For bug fixes
- `docs/update-readme` - For documentation updates
- `refactor/improve-xyz` - For refactoring

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```bash
feat(storage): add progress tracking for uploads

- Implement ProgressTracker class
- Add progress event to BunGridFSStorage
- Update documentation

Closes #123
```

```bash
fix(types): correct MulterFile interface definition

The stream property should accept ReadableStream
```

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/storage.test.ts

# Run with coverage (if configured)
bun test --coverage
```

### Writing Tests

- Place tests in the `tests/` directory
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

**Example:**

```typescript
import { describe, test, expect } from "bun:test";
import { BunGridFSStorage } from "../src/storage";

describe("BunGridFSStorage", () => {
  test("should create instance with valid config", () => {
    // Arrange
    const mockDb = {} as any;

    // Act
    const storage = new BunGridFSStorage({ db: mockDb });

    // Assert
    expect(storage).toBeInstanceOf(BunGridFSStorage);
  });
});
```

## Submitting Changes

### Before Submitting

1. **Update tests** - Add/update tests for your changes
2. **Run tests** - Ensure all tests pass
3. **Build** - Ensure the project builds without errors
4. **Update documentation** - Update README.md, EXAMPLES.md, etc.
5. **Update CHANGELOG** - Add your changes to CHANGELOG.md

### Pull Request Process

1. **Update your fork**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes**:
   ```bash
   git push origin feature/your-feature
   ```

3. **Create Pull Request** on GitHub:
   - Provide a clear title and description
   - Reference related issues
   - Include screenshots (if applicable)
   - Check the PR checklist

4. **Address review feedback**:
   - Make requested changes
   - Push updates to the same branch
   - Respond to comments

### Pull Request Template

```markdown
## Description
Brief description of the changes

## Motivation and Context
Why is this change needed? What problem does it solve?

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran and how to reproduce them

## Checklist
- [ ] My code follows the code style of this project
- [ ] I have updated the documentation accordingly
- [ ] I have added tests to cover my changes
- [ ] All new and existing tests passed
- [ ] I have updated the CHANGELOG.md
```

## Coding Standards

### TypeScript

- Use **strict mode** (enabled in tsconfig.json)
- Always type function parameters and return values
- Use `interface` for object shapes
- Use `type` for unions and intersections
- Avoid `any` type when possible

**Good:**

```typescript
export interface FileConfig {
  filename: string;
  bucketName: string;
  metadata?: Record<string, any>;
}

export async function uploadFile(
  config: FileConfig
): Promise<GridFSFile> {
  // Implementation
}
```

**Bad:**

```typescript
export function uploadFile(config: any): any {
  // Implementation
}
```

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use double quotes for strings
- Max line length: 100 characters
- Use trailing commas in arrays/objects

### Naming Conventions

- **Classes**: PascalCase (e.g., `BunGridFSStorage`)
- **Interfaces**: PascalCase (e.g., `FileConfig`)
- **Functions**: camelCase (e.g., `uploadFile`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `DEFAULT_CHUNK_SIZE`)
- **Files**: kebab-case (e.g., `storage.ts`)

### Documentation

- Add JSDoc comments for public APIs
- Include parameter descriptions
- Include return type descriptions
- Add examples where helpful

**Example:**

```typescript
/**
 * Upload a file to GridFS
 *
 * @param config - File configuration
 * @returns Promise resolving to uploaded file info
 *
 * @example
 * ```typescript
 * const file = await uploadFile({
 *   filename: 'test.txt',
 *   bucketName: 'uploads',
 * });
 * ```
 */
export async function uploadFile(
  config: FileConfig
): Promise<GridFSFile> {
  // Implementation
}
```

## Project Structure

```
bun-gridfs-storage/
├── src/
│   ├── index.ts       # Main export
│   ├── storage.ts     # Storage implementation
│   └── types.ts       # TypeScript types
├── tests/
│   ├── storage.test.ts
│   └── integration.test.ts
├── dist/              # Build output (generated)
├── docs/              # Additional documentation
├── package.json
├── tsconfig.json
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

## Release Process

Releases are handled by the maintainers:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Publish to npm

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/aissamirhir/bun-gridfs-storage/issues)
- **Discussions**: [GitHub Discussions](https://github.com/aissamirhir/bun-gridfs-storage/discussions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
