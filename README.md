# CodeCount

## Overview

CodeCount is a VS Code extension that counts lines of code in your workspace and shows stats in a dedicated view.

## Features

- Count total lines of code in the workspace.
- Count lines per file and by file extension.
- Refreshable stats view in the Activity Bar.

## Commands

- `CodeCount: Count Lines of Code`
- `CodeCount: Count Lines of Code in All Files`
- `CodeCount: Count Lines of Code by Extension`
- `CodeCount: Refresh CodeCount Stats`

## Requirements

- VS Code 1.108.2 or newer.

## Usage

1. Open the Command Palette.
2. Run one of the CodeCount commands.
3. Open the CodeCount view in the Activity Bar to see stats.

## Contribution Guidelines

Thanks for taking the time to contribute! To keep changes consistent, please follow these steps:

1. Fork the repository and create a feature branch.
2. Install dependencies with `npm install`.
3. Build or watch the extension during development:
   - `npm run compile` for a one-time build
   -  Press `F5` on [extension.ts](src/extension.ts) to launch the Extension Development Host.
4. Run checks before opening a pull request:
   - `npm run lint`
5. Open a pull request with a clear description of the change and any testing notes.


