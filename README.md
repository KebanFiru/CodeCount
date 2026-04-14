# CodeCount - VS Code Extension

<!-- Badges -->
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.108.2+-blue)](https://code.visualstudio.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue)](https://www.typescriptlang.org/)

> Quickly analyze your project's codebase by counting lines of code, comments, and get insights organized by file types.

## Overview

**CodeCount** is a powerful VS Code extension that provides comprehensive code metrics for your projects. Instantly see how many lines of code, comments, and blank lines your workspace contains. Get detailed breakdowns by file type, understand code distribution, and track your project's scale.

Perfect for developers, project managers, and teams who need quick insights into codebase size and complexity.

## Features

- **Workspace Analysis** - Get total line counts for your entire project
- **File-by-File Breakdown** - See statistics for individual files
- **Extension-Based Statistics** - Analyze code distribution across file types (TypeScript, JavaScript, Python, etc.)
- **Comment Detection** - Identify and count comment lines separately
- **Real-Time Refresh** - Update stats anytime with a single click
- **Sidebar Integration** - Dedicated panel in VS Code's Activity Bar
- **Gitignore Support** - Respects your `.gitignore` patterns automatically
- **⏱Performance Optimized** - Fast analysis even for large projects

## 📋 Commands

Access CodeCount commands via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
|---------|-------------|
| `CodeCount: Count Lines of Code` | Analyze the current active file |
| `CodeCount: Count Lines of Code in All Files` | Analyze entire workspace |
| `CodeCount: Count Lines of Code by Extension` | Get breakdown by file type |
| `CodeCount: Refresh CodeCount Stats` | Refresh sidebar statistics |

## 📦 Requirements

- **VS Code:** 1.108.2 or newer
- **Git:** Required for repository recognition (optional, but recommended)

## 🚀 Quick Start

### Installation

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "CodeCount"
4. Click **Install**
5. Reload VS Code if prompted

### Usage

#### Method 1: Using Commands
- Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
- Type "CodeCount" to see available commands
- Select the command you want to run

#### Method 2: Using Sidebar
- Click the **CodeCount** icon in the Activity Bar (left sidebar)
- View current statistics
- Click the refresh button to update

#### Example Output
```
Total lines in workspace (145 files): 25,847
Comment lines: 3,421
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Setup

## 📚 Configuration

CodeCount respects your project's `.gitignore` file, automatically excluding:
- `node_modules/`
- `dist/` and `build/`
- `.git/` directories
- And any patterns defined in `.gitignore`

## 🤝 Contributing

We welcome contributions! Here's how to help:

### Getting Started
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes
4. **Test** thoroughly
5. **Commit** with clear messages: `git commit -m 'Add amazing feature'`
6. **Push** to your branch: `git push origin feature/amazing-feature`
7. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Keep code clean and well-documented
- Run `pnpm run lint` before committing
- Write meaningful commit messages
- Test changes in the Extension Development Host

### Code Style
- Use TypeScript with strict mode enabled
- Follow ESLint rules (run `pnpm run lint`)
- Use descriptive variable and function names
- Add comments for complex logic

##  License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

##  Bug Reports & Feature Requests

Have a bug to report or feature to suggest?

- **Issues:** [GitHub Issues](https://github.com/KebanFiru/CodeCount/issues)
- **Discussions:** [GitHub Discussions](https://github.com/KebanFiru/CodeCount/discussions)

Please include:
- Clear description of the issue/feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- VS Code version and OS

## 📊Project Statistics

- **Language:** TypeScript
- **VS Code API:** 1.108.2+
- **License:** MIT
- **Status:** Active Development

## 💬 Questions?

Have questions? Feel free to:
- Open a [Discussion](https://github.com/KebanFiru/CodeCount/discussions)
- Check the [Issues](https://github.com/KebanFiru/CodeCount/issues) page
- Create an Issue with the `question` label

---



