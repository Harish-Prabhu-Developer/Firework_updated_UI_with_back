# Multi-Service Project Architecture

This document outlines the directory structure, components, and build output configurations of the entire **Firework Shop** repository. The project is organized as a monorepo-style structure featuring three main microservices/applications: **Admin**, **Client**, and **Server**.

---

## 1. Full Project Structure Overview

At the root level, the workspace is split into three main microservices, each operating with its own specialized package manager and development runtime environment:

```text
Firework_updated_UI_with_back/
├── Admin/                 # Administrative Dashboard (React Native for Web & Mobile)
├── client/                # Customer Storefront Website (Vite + React SPA)
├── server/                # Backend REST API Service (Express + Drizzle ORM + PostgreSQL)
└── ProjectStructure.md    # Architecture & Project Structure Guide (This File)
```

---

## 2. Microservice Project Structures

### 📂 A. Admin Panel (`/Admin`)
The **Admin Panel** uses a multi-platform architecture. Built with **React Native (CLI)**, it is designed to run natively on **Android/iOS** (via Metro Bundler) and compile into a premium web application (via **React Native Web** + **Webpack**).

```text
Admin/
├── android/                 # Native Android Gradle configuration & source (Java/C++)
├── ios/                     # Native iOS Xcode workspace & configurations (Obj-C/Swift)
├── public/                  # Public assets directory (Webpack template assets, favicon)
├── scripts/                 # Maintenance and build utility scripts
├── src/                     # Core App Source Code
│   ├── api/                 # Axios clients and API routing endpoints 
│   ├── components/          # Reusable UI widgets (buttons, charts, inputs)
│   ├── context/             # React Contexts (Auth states, global theme configurations)
│   ├── hooks/               # Custom React Hooks (useAuth, useScreenDimensions)
│   ├── layouts/             # Dashboard shell view layouts (Sidebar, Header, MainContainer)
│   ├── lib/                 # Standard helper/third-party configurations
│   ├── navigation/          # React Navigation routers (Drawer, Stack for both web & mobile)
│   ├── redux/               # Redux Toolkit global store config & slices (orders, products)
│   ├── screens/             # Concrete pages (Dashboard, OrderDetails, Inventory, Customers)
│   ├── shims/               # Web compatibility overrides (e.g. window/native overrides)
│   ├── styles/              # Global variables, color palettes & helper stylesheets
│   └── utils/               # Formatting scripts, validators, and date parsers
│       └── constants.ts     # Platform-specific API endpoints definitions (Mobile Env)
├── __tests__/               # Jest test files for native components
├── App.tsx                  # Root component loading navigations & redux provider
├── global.css               # Nativewind global CSS definitions
├── index.js                 # React Native mobile entry point
├── jest.config.js           # Jest testing framework configuration
├── metro.config.js          # Metro bundler configuration for iOS and Android
├── nativewind-env.d.ts      # NativeWind TypeScript environment definitions
├── postcss.config.js        # PostCSS configuration for Tailwind integration
├── react-native.config.js   # React Native CLI configuration
├── rn_config.json           # Application specific runtime configurations
├── tailwind.config.js       # Styling configuration utilizing NativeWind (Tailwind CSS)
├── babel.config.js          # Babel config transforming modern JS & JSX per platform
├── webpack.config.js        # Webpack compilation configuration for web deployment
├── package.json             # Service dependencies, metadata and build scripts
└── tsconfig.json            # TypeScript compile configurations
```

---

### 📂 B. Customer Storefront (`/client`)
The **Storefront** is a high-performance Single Page Application (SPA) built using **React**, **Vite** (bundler), and **Tailwind CSS v4** for premium layout design.

```text
client/
├── public/                  # Static assets copied directly to the output root (robots.txt, icons)
├── src/                     # Core Storefront Source Code
│   ├── assets/              # Premium design images, icons, and hero banners
│   ├── components/          # Interactive visual modules (Cart, CatalogGrid, shadcn UI wrappers)
│   ├── hooks/               # State/Interaction custom hooks (useCart, useWindowScroll)
│   ├── lib/                 # Classname mergers and helper configurations
│   ├── pages/               # Direct Route screens (Home, Category, Estimates, Contact, Cart)
│   ├── redux/               # Client-side global state (Cart, OrderEstimate, UI states)
│   ├── services/            # Direct API request methods (axios calls to backend)
│   ├── test/                # Test utilities and unit test definitions
│   ├── types/               # TypeScript interface structures and declarations
│   ├── App.tsx              # Application layout wrapper and React Router config
│   ├── App.css              # Custom styling overrides
│   ├── index.css            # Storefront styling system & Tailwind CSS imports
│   ├── main.tsx             # DOM injection mount point (Vite React app entry)
│   └── vite-env.d.ts        # Vite environment variable typescript definitions
├── .env                     # Environment variables configuring the storefront API endpoints
├── components.json          # shadcn/ui components configuration file
├── eslint.config.js         # ESLint flat configuration for code linting
├── index.html               # Main HTML entry point injecting root React script
├── vite.config.ts           # Vite compile parameters and Tailwind plugins
├── tsconfig.json            # Overall TypeScript solution settings
├── tsconfig.app.json        # TypeScript compile configurations for React components
├── tsconfig.node.json       # TypeScript configurations for Node based build scripts
├── package.json             # Storefront dependencies, engines, and run targets
└── vitest.config.ts         # Visual and functional unit testing configurations
```

---

### 📂 C. Backend API (`/server`)
The **Server** is a modern REST API built with **Express** and **TypeScript**. It utilizes **Drizzle ORM** for direct, high-performance querying and migrations to **PostgreSQL**.

```text
server/
├── drizzle/                 # Automatically generated Drizzle schema SQL migrations
├── src/                     # Backend Source Code
│   ├── assets/              # Dynamic PDF layouts, watermarks, or fonts
│   ├── config/              # Server settings (database initialization, environments)
│   ├── controllers/         # HTTP Controller logic (Auth, Orders, Products, Estimates, PDF)
│   ├── db/                  # Drizzle database configurations
│   │   ├── index.ts         # DB connections instantiation (Postgres pg client)
│   │   ├── schema.ts        # Database entity schemas (Users, Products, Orders, etc.)
│   │   ├── seed.ts          # Database starter kit seeder script
│   │   └── migrate.ts       # Database automatic migration execution script
│   ├── middleware/          # Express request filters (Auth token verifier, Error handlers, CORS)
│   ├── routes/              # Route endpoints linking URL patterns to Controllers
│   ├── services/            # Specialized tools (PDF generator engine, Mailer notification engine)
│   ├── templates/           # HTML templates (Invoice generators and transaction receipts)
│   ├── types/               # Backend-specific Request/Response type shapes
│   ├── utils/               # Crytographical tools, helpers, and date manipulation
│   └── server.ts            # Entrypoint that binds database and instantiates the Express application
├── uploads/                 # Local directory for user-uploaded assets (images, videos)
├── .env                     # Local environment configuration secrets (Database, JWT, Mailer)
├── drizzle.config.ts        # Drizzle Kit CLI configuration
├── tsconfig.json            # TS-to-JS compilation settings (targetting NodeNext ES Modules)
└── package.json             # Express dependencies, TSX dev setups, and build directives
```

---

## 3. Build-to-Output Structures

The table below outlines the build configurations and target formats for each microservice:

| Microservice | Build Tool | Command | Primary Output Directory | Target Environment |
| :--- | :--- | :--- | :--- | :--- |
| **Admin (Web)** | Webpack | `npm run build` | `Admin/dist/` | Static Web Server (Nginx, S3) |
| **Admin (Mobile)** | Metro Bundler | `npm run android` / `ios` | `android/app/build/` | Native Android APK/AAB & iOS App |
| **Client** | Vite (Rollup) | `npm run build` | `client/dist/` | Static CDN / Nginx SPA Hosting |
| **Server** | TypeScript (`tsc`) | `npm run build` | `server/dist/` | Node.js Runtime Container |

---

### 🖥️ A. Admin Production Output (`Admin/dist`)
Webpack compiles the React Native styles, components, and pages into browser-compatible assets. 

```text
Admin/dist/
├── index.html                   # HTML template loading the JS application bundle
├── main.bundle.web.js           # Production application runtime and vendor modules
├── [id].bundle.web.js           # Chunk files generated dynamically (screens, thick plugins)
├── [id].bundle.web.js.LICENSE   # Licenses parsed from node_modules packages
└── [hash].png                   # Hashed assets, logos and icon vectors
```

*Note: For native builds (Android), Metro/Gradle outputs compiled debug and release packages to `Admin/android/app/build/outputs/apk/release/app-release.apk`.*

---

### 🛍️ B. Client Production Output (`client/dist`)
Vite bundles the code and chunks using Rollup, performing CSS extraction, minification, tree-shaking, and cache-busting hashing.

```text
client/dist/
├── assets/
│   ├── index-[hash].js          # Compressed storefront application script
│   ├── index-[hash].css         # Minified Tailwind styles
│   └── [asset-name]-[hash].png  # Compressed and optimized image resources
├── favicon.ico                  # Browser tab identity logo
├── index.html                   # Entry page with injected modern script tags
├── placeholder.svg              # Fallback UI illustrations
├── robots.txt                   # Search Engine Indexing permissions rules
└── sitemap.xml                  # SEO Indexing URLs hierarchy
```

---

### ⚙️ C. Server Production Output (`server/dist`)
The TypeScript compiler (`tsc`) transpiles all `.ts` files inside `/src` to clean, production-ready ES Modules (`.js`) inside `/dist` matching the exact path layout of `/src`.

```text
server/dist/
├── config/                      # Compiled configuration JS scripts
├── controllers/                 # Transpiled Request handlers
├── db/                          # Transpiled Database initializers and schemas
├── middleware/                  # Transpiled filter files
├── routes/                      # Route JS configs
├── services/                    # Background utilities and PDF engine scripts
├── templates/                   # Rendered receipts and transaction setups
├── utils/                       # Transpiled helpers and cryptography files
├── server.js                    # Transpiled Node entry script
├── server.d.ts                  # Declarations file generated for the main script
├── server.js.map                # Map file tracking transpiled JS back to TS code
└── server.d.ts.map              # Map file detailing type declarations configurations
```

In production, the backend is started via `node dist/server.js`.

---

## 4. Environment Configurations & Variables

This section outlines the active environment configurations used across each microservice to handle databases, system networking port bounds, token authentication, secure dynamic email transmissions, and client/server handshakes.

### 🛍️ A. Storefront Environment (`client/.env`)
The client storefront uses build-time variables. Under Vite, variables accessible to client-side code must be prefixed with `VITE_`.

| Variable Name | Default Config Value | Purpose | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `"http://localhost:3000"` | Client REST API Endpoint | Configures the HTTP gateway URL target for outgoing API requests. |

---

### ⚙️ B. Backend API Environment (`server/.env`)
The Express backend parses local secrets and system configs at server launch using the `dotenv` package.

| Variable Name | Default Config Value | Purpose | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | `3000` | Port Binding | Sets the system port the Express listener binds to on starting. |
| `DATABASE_URL` | `postgresql://postgres:root@localhost:5432/new_crackers_shop` | Postgres Database URI | Direct PG client credentials linking to database username, password, host, port, and schema. |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-this` | Authorization Token Cryptography | Encryption key used by middleware to securely sign and verify Session JWT Tokens. |
| `ENCRYPTION_KEY` | `your-32-character-encryption-key!!` | Data Encryption Key | 32-character key utilized by controllers to securely encrypt/decrypt database entries. |
| `BASE_URL` | `http://10.204.212.247:3000` | Backend Root Server URL | Publicly accessible server address (commonly mapped to local LAN IP for mobile testing). |
| `SMTP_HOST` | `smtp.gmail.com` | Mail Server Target Host | Host domain of SMTP server used to send transaction notifications. |
| `SMTP_PORT` | `587` | Mail Server Network Port | Active SMTP port (using standard 587 for TLS secure connections). |
| `SMTP_USER` | `yourgmail.com` | Mail Client User ID | Authentication credentials identifier used to login to mail server. |
| `SMTP_PASS` | `yourgmail-password` | Mail Secure App Password | Google App Password allowing programmatic transactional email delivery. |
| `EMAIL_FROM` | `yourgmail.com` | Sender Metadata Tag | Outbox identity displayed on invoice emails. |
| `FRONTEND_URL` | `http://10.204.212.247:5000` | Storefront Client URL | URL of the frontend storefront interface, utilized by backend to handle CORS. |

---

### 📱 C. Admin Mobile Configuration (`Admin/src/utils/constants.ts`)
React Native applications compiled natively on mobile platforms (Android/iOS) do not read direct backend-like environment configuration files natively. Instead, platform-aware modules are utilized dynamically to determine endpoints inside `Admin/src/utils/constants.ts`:

- **Platform Switcher Code**:
  ```typescript
  import { Platform } from 'react-native';
  export const API_URL = Platform.OS === 'android' 
    ? 'http://10.204.212.247:3000/api/v1' 
    : 'http://192.168.29.216:3000/api/v1';
  ```
- **Resolved Endpoints**:
  - **Android Device / Emulator**: `http://10.204.212.247:3000/api/v1` (Uses internal LAN address or virtual router mappings)
  - **iOS Simulator / Web**: `http://192.168.29.216:3000/api/v1` (Direct local link address to native packager)
