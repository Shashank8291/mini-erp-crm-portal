# Mini ERP + CRM Portal — Frontend

The client-side single page application (SPA) for the Mini ERP + CRM Operations Portal.

## 🚀 Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM (v7)
- **Visuals**: Three.js (interactive 3D particle canvas background)
- **Styling**: Pure CSS Glassmorphism design system (`src/index.css`)
- **HTTP Client**: Axios with automatic JWT interceptors
- **Linting**: Oxlint

## 📂 Source Structure

```
frontend/src/
├── api/            # API client modules (auth, customers, products, stock, orders, dashboard)
├── assets/         # Static graphic assets
├── components/     # Reusable components (Sidebar, ThreeBackground, ProtectedRoute, LogoIcon)
├── context/        # React context (AuthContext for user session and role management)
├── pages/          # Application views:
│   ├── Login.tsx          # JWT authentication screen
│   ├── Dashboard.tsx      # Overview metrics, charts, and quick-access widgets
│   ├── Customers.tsx      # CRM list, search, filters, modal forms, follow-up notes
│   ├── Products.tsx       # Inventory catalog, SKU management, low stock filters
│   ├── StockMovements.tsx # Stock IN/OUT audit adjustments
│   ├── Orders.tsx         # Multi-item sales order builder & status transitions
│   └── Profile.tsx        # User profile and password updater
├── types/          # Shared TypeScript interfaces
├── App.tsx         # Route configuration with role-based access guards
├── main.tsx        # DOM entry point
└── index.css       # Core styling & 40+ glassmorphism utility classes
```

## 🛠️ Scripts

- `npm run dev` — Starts local Vite development server on `http://localhost:5173`
- `npm run build` — Type-checks and creates production build in `dist/`
- `npm run lint` — Runs fast oxlint checks
- `npm run preview` — Previews production build locally

## ⚙️ Environment Configuration

Refer to `.env.example` in this directory:
```env
VITE_API_URL=http://localhost:5000/api
```

For full system architecture, database schema, and backend details, refer to the root [README.md](../README.md).
