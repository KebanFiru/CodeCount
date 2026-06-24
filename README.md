# CodeCount - VS Code Extension

<!-- Badges -->
[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/KebanFiru.CodeLineCounter?label=VS%20Marketplace&color=0078d7)](https://marketplace.visualstudio.com/items?itemName=KebanFiru.CodeLineCounter)

> Quickly analyze your project's codebase with comprehensive metrics, Git analytics, and interactive dashboards.

## Overview

**CodeCount** is a VS Code extension that provides deep insights into your codebase. Get instant metrics on lines of code, understand contributor activity, track commit trends, and visualize language distribution across your entire project or a specific branch.

## Features

### Code Metrics
- **Workspace Analysis** — Total line counts for entire projects
- **File-by-File Breakdown** — Statistics for individual files and by extension
- **Branch-Aware Language Distribution** — On feature branches, only counts files changed on that branch
- **Comment Detection** — Separate counts for comment and blank lines
- **Gitignore Support** — Automatically respects `.gitignore` patterns

### Git Analytics
- **Branch-Aware Statistics** — All three analytics sections (Language Distribution, Contributors, Repository Analytics) automatically scope to the current branch on feature branches and show full history on main/master, each with a branch badge indicating which view is active
- **Commit Trends** — Visualize commits, additions, and deletions over time with selectable granularity:
  - Daily, Weekly, Monthly, Yearly
  - **By Days of the Week** — aggregate by day of week within any date range
  - **By Hour of Day** — aggregate by hour within any date range
- **Date Range Filtering** — All granularities support start/end date pickers
- **Repository Metrics** — Total contributors, commits, lines added and deleted

### Interactive Dashboard
- **Sidebar Tree View** — Quick stats in the Activity Bar with expandable sections
- **Analytics Webview** — Full dashboard with tabs for Languages, Contributors, and Repo Analytics
- **Chart.js Visualizations** — Bar charts, line charts, and horizontal bar charts with hover tooltips
- **Dark Mode Support** — Optimized for VS Code dark themes

## Commands

Access via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
|---------|-------------|
| `CodeCount: Count Lines of Code` | Analyze the current active file |
| `CodeCount: Count Lines of Code in All Files` | Analyze entire workspace |
| `CodeCount: Count Lines of Code by Extension` | Get breakdown by file type |
| `CodeCount: Refresh CodeCount Stats` | Refresh sidebar and dashboard |

## Requirements

- **VS Code:** 1.115.0 or newer
- **Git:** Required for repository analytics and contributor tracking

## Usage

### Sidebar
Click the **CodeCount** icon in the Activity Bar to open the sidebar. It shows:
- Language distribution with line counts
- Top contributors and their activity
- Quick link to the full Analytics Dashboard

### Analytics Dashboard
Open via the sidebar shortcut or the **Open Analytics Dashboard** command. Features:
- **Branch context awareness** — Language, Contributor, and Repo Analytics sections all adapt to your current branch; each shows a branch badge (⎇ branch-name or ⎇ all branches)
- **Date range filtering** — restrict all charts to a custom date window, including By Days of the Week and By Hour views
- **Granularity selector** — switch between Daily / Weekly / Monthly / Yearly / By Days of the Week / By Hour
- **Contributor file history** — click a file in the Contributors tab to diff any commit

## Architecture

- **Language:** TypeScript (strict mode, ES2022, Node16 modules)
- **Build:** Compiled directly to `out/` via `tsc` — no bundler
- **Charts:** Chart.js v4 loaded from CDN in the webview
- **Git integration:** All git calls use `execFile` through a private `execGit` helper — no shell spawning

## License

MIT — see [LICENSE](LICENSE) for details.

## Bug Reports & Feature Requests

- **Issues:** [GitHub Issues](https://github.com/KebanFiru/CodeCount/issues)
- **Discussions:** [GitHub Discussions](https://github.com/KebanFiru/CodeCount/discussions)

---
