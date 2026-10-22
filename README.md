# Bugzflow Dev Kit

A powerful Webflow Designer Extension designed to streamline developer workflows. Bugzflow Dev Kit brings essential frontend development tools—including HTML and Tailwind CSS conversion, custom script management, Webflow variables, and asset management—directly into the Webflow Designer interface.

## Getting Started & Local Setup

This project uses **PNPM** as its package manager.

### Prerequisites

- **Node.js:** v18.x or higher
- **PNPM:** Install globally using `npm install -g pnpm`

### Installation

Clone the repository and navigate to the project directory, then install the dependencies:

```bash
pnpm install
```

### Development

Start the local development server:

```bash
pnpm run dev
```

### Build

Create a production-ready build:

```bash
pnpm build
```

### Preview Production Build


To view all available scripts, run:

```bash
pnpm run
```

---

## Key Features

- **HTML to Webflow Conversion:** Write custom HTML, CSS, and JavaScript and transform them into Webflow-compatible structures.
- **Tailwind to Webflow:** Convert Tailwind CSS markup and utility classes into clean HTML and CSS tailored for Webflow.
- **Webflow Variables Workspace:** Create, bulk-edit, manage, and synchronize Webflow variables using tabular and JSON formats.
- **Hosted Scripts Manager:** Register, store, and manage version-controlled custom scripts with CDN URLs and integrity hashes.
- **Asset Management:** Upload, organize, and manage images, videos, and folders directly within the Webflow Designer.
- **Feedback & Documentation:** Access integrated GitBook documentation and feedback collection tools.
- **Dark & Light Mode:** Switch between themes for a comfortable development experience.

---

## Tech Stack & Architecture

| Category | Technologies |
|---|---|
| Core Framework | React 18 / 19, TypeScript, Vite |
| Package Manager | PNPM |
| Webflow Integrations | Webflow Designer API, Webflow Developer API |
| Styling & UI | Tailwind CSS, shadcn/ui, Lucide Icons |
| Theme Support | Dark Mode, Light Mode |
| State Management | Redux Toolkit (RTK), React Context API |
| Data Fetching | RTK Query, Fetch API |

---

## Project Structure

```text
dev kit/
├── cmd/                        # Build and automation scripts
├── src/
│   ├── components/             # UI components, sidebar, layouts
│   ├── config/                 # Navigation and route configurations
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Webflow API helpers and utilities
│   ├── pages/                  # HTML, Tailwind, Variables, Assets
│   ├── redux/                  # Redux slices and API services
│   ├── routes/                 # Router configuration
│   ├── types/                  # TypeScript type definitions
│   ├── App.tsx                 # Main application layout
│   ├── global.d.ts             # Global type declarations
│   ├── index.css               # Global styles and Tailwind entry
│   ├── main.tsx                # Application entry point
│   └── modify-html.js          # Custom HTML parser and modifier
├── wf-app-hot-reload.d.ts      # Webflow Hot Reload declarations
├── webflow.json                # Webflow extension configuration
├── vite.config.ts              # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── pnpm-lock.yaml              # PNPM lockfile
└── package.json                # Dependencies and scripts
```

---

## Development Workflow

1. Install dependencies with `pnpm install`.
2. Start the development server with `pnpm run dev`.
3. Implement and test features inside the Webflow Designer Extension.
4. Generate a production build with `pnpm build`.
5. Preview the production build using `pnpm start`, if configured.

## License

Add your project's license information here if applicable.
