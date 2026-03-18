# 📚 Web Manhau

A modern **SvelteKit + PWA** application for reading and managing webtoons/manhwas with offline support, ratings, and personalized favorites.

## ✨ Features

- **📖 Offline Reading** - Download chapters for offline access
- **⭐ Ratings & Reviews** - Rate and review your favorite series
- **❤️ Favorites Management** - Save and organize your reading list
- **📱 PWA Support** - Install as a native-like app on mobile/desktop
- **🔄 Sync Across Devices** - Cloud synchronization of your library
- **🌙 Dark Mode** - Eye-friendly dark theme
- **⚡ Lightning Fast** - Optimized performance with Vite

## 🛠️ Tech Stack

- **Frontend**: [SvelteKit](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: [SQLite](https://www.sqlite.org/) (via better-sqlite3)
- **PWA**: [@vite-pwa/sveltekit](https://vite-pwa-org.netlify.app/)
- **Testing**: [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)
- **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com/)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/web_manhau.git
cd web_manhau

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:5173
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Available Scripts

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Start development server with hot reload   |
| `npm run build`        | Build for production                       |
| `npm run preview`      | Preview production build                   |
| `npm run check`        | Type-check with SvelteKit and svelte-check |
| `npm run check:watch`  | Type-check in watch mode                   |
| `npm test`             | Run unit tests (Vitest)                    |
| `npm run test:watch`   | Run tests in watch mode                    |
| `npm run test:e2e`     | Run E2E tests (Playwright)                 |
| `npm run test:e2e:ui`  | Run E2E tests with UI                      |
| `npm run lint`         | Lint code with ESLint                      |
| `npm run format`       | Format code with Prettier                  |
| `npm run format:check` | Check code formatting                      |
| `npm run typecheck`    | Type-check TypeScript                      |
| `npm run audit`        | Audit npm dependencies                     |

## 📁 Project Structure

```
web_manhau/
├── src/
│   ├── lib/
│   │   ├── components/     # Reusable Svelte components
│   │   ├── services/       # Business logic & API services
│   │   ├── stores/         # State management (Zustand/Svelte stores)
│   │   ├── utils/          # Utility functions
│   │   ├── types.ts        # TypeScript type definitions
│   │   └── db/             # Database schemas and queries
│   ├── routes/             # SvelteKit file-based routing
│   └── app.svelte          # Root component
├── tests/
│   ├── unit/               # Unit tests
│   └── e2e/                # E2E tests (Playwright)
├── static/                 # Static assets
├── public/                 # Public assets (favicon, manifests, etc.)
├── docs/                   # Documentation
├── .github/                # GitHub templates & workflows
└── vite.config.ts          # Vite configuration
```

## 📚 Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md) - System design and patterns
- [API Reference](./docs/API.md) - Available endpoints and data models
- [Setup Guide](./docs/SETUP.md) - Local development setup
- [Deployment Guide](./docs/DEPLOYMENT.md) - How to deploy to production
- [Contributing Guidelines](./CONTRIBUTING.md) - How to contribute

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](./CONTRIBUTING.md) first.

### Quick steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 🐛 Reporting Issues

Found a bug? Please [create an issue](https://github.com/your-username/web_manhau/issues/new?template=bug_report.md) with:

- Clear description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, browser, Node version)

## 🔐 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## 👤 Author

**Your Name**

- GitHub: [@your-username](https://github.com/your-username)
- Email: your.email@example.com

## 💬 Support & Community

- 💡 [Discussions](https://github.com/your-username/web_manhau/discussions)
- 📦 [Releases](https://github.com/your-username/web_manhau/releases)
- 🐛 [Issues](https://github.com/your-username/web_manhau/issues)

---

**Made with ❤️ by the Web Manhau team**
