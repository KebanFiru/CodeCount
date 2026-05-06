# CodeCount - VS Code Extension

<!-- Badges -->
[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/KebanFiru.CodeLineCounter?label=VS%20Marketplace&color=0078d7)](https://marketplace.visualstudio.com/items?itemName=KebanFiru.CodeLineCounter)

> Quickly analyze your project's codebase with comprehensive metrics, Git analytics, and interactive dashboards.

## Overview

**CodeCount** is a powerful VS Code extension that provides deep insights into your codebase. Get instant metrics on lines of code, understand contributor activity, track commit trends, and visualize language distribution. Perfect for developers, project managers, and teams who need comprehensive codebase analytics.

## Features

###  Code Metrics
- **Workspace Analysis** - Total line counts for entire projects
- **File-by-File Breakdown** - Statistics for individual files
- **Branch-Aware Language Distribution** - Analyze code by file type with branch-specific stats on feature branches
- **Comment Detection** - Separate counts for comment and blank lines
- **Gitignore Support** - Automatically respects `.gitignore` patterns

###  Git Analytics (Repository View)
- **Branch-Aware Contributor Statistics** - Track contributions with smart branch detection:
  - Feature branches show all branch contributors
  - Main branch shows complete repository history
- **Commit Trends** - Visualize commits, additions, and deletions over time
- **Monthly Activity** - Monitor development activity by month
- **Work Patterns** - Understand coding patterns by weekday and hour
- **Repository Metrics** - Total contributors, commits, and lines changed

###  Interactive Dashboard
- **Real-Time Statistics Panel** - View metrics in VS Code sidebar with instant updates
- **Expandable Lists** - Top 3 preview with "Show all/Show less" toggle for:
  - Contributors by lines changed
  - Languages by line count
- **Interactive Charts** - Fully responsive visualizations using Chart.js v4.4.0:
  - Hover support with cursor feedback
  - Tooltips with detailed information
  - Horizontal bar charts for better readability
- **Dark Mode Support** - Optimized for all VS Code themes with white text contrast
- **Performance Optimized** - Instant analysis even for large projects

##  Commands

Access CodeCount commands via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
|---------|-------------|
| `CodeCount: Count Lines of Code` | Analyze the current active file |
| `CodeCount: Count Lines of Code in All Files` | Analyze entire workspace |
| `CodeCount: Count Lines of Code by Extension` | Get breakdown by file type |
| `CodeCount: Refresh CodeCount Stats` | Refresh sidebar statistics |

##  Requirements

- **VS Code:** 1.108.2 or newer
- **Git:** Required for repository analytics and contributor tracking

### Usage

#### Method 1: Using Sidebar
- Click the **CodeCount** icon in the Activity Bar (left sidebar)
- View comprehensive statistics including:
  - Stats overview grid
  - Language distribution with breakdown
  - Top contributors and their contributions
  - Repository analytics and commit history

#### Method 2: Using Commands
- Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
- Type "CodeCount" to see available commands
- Select the command you want to run

#### Dashboard Features
- **Branch Context Awareness** - Statistics adapt based on your current branch:
  - On feature branches: Shows contributors and languages specific to that branch
  - On main/master: Displays full repository history
- **Expandable Lists** - Click "Show all" / "Show less" to toggle between preview and full views
- **Interactive Charts** - Hover over any visualization for detailed tooltips and data points
- **Full-Width Analytics** - View commit trends, monthly activity, and work patterns across the repository
- **Real-Time Updates** - Click refresh button to update statistics when branch or files change

##  Architecture

### Technology Stack
- **Frontend:** HTML/CSS/JavaScript in VS Code Webview
- **Charts:** Chart.js v4.4.0
- **Language:** TypeScript with strict mode
- **Styling:** CSS Grid layout with responsive design
- **Git Integration:** Child process execution for git commands

##  Configuration

### Git Integration
CodeCount respects your project's `.gitignore` file, automatically excluding:
- `node_modules/`
- `dist/` and `build/`
- `.git/` directories
- And any patterns defined in `.gitignore`

### Branch-Aware Analytics

**Feature Branches:** When you're on a feature branch (not main/master), CodeCount intelligently shows:
- Contributors who have commits on your branch
- Languages and files modified in your branch
- Branch-specific statistics

**Main Branch:** When on main or master, you see:
- Complete repository history with all contributors
- Cumulative language distribution across entire project
- Full commit history and analytics

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
- Extension version

##  Questions?

Have questions? Feel free to:
- Open a [Discussion](https://github.com/KebanFiru/CodeCount/discussions)
- Check the [Issues](https://github.com/KebanFiru/CodeCount/issues) page
- Create an Issue with the `question` label

---



