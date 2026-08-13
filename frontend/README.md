# EduTalk Frontend

React + Vite frontend for the EduTalk platform.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

Frontend runs on http://localhost:5173

3. Build for production:

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── Header.jsx
│   ├── MessageBanner.jsx
│   ├── PromptDialog.jsx
│   ├── ConfirmDialog.jsx
│   └── ...
├── context/
│   └── AuthContext.jsx
├── hooks/
│   └── useAuth.js
├── pages/
│   ├── LandingPage.jsx
│   ├── LoginPage.jsx
│   ├── SignupPage.jsx
│   ├── BrowseClassesPage.jsx
│   ├── ClassDetailPage.jsx
│   ├── DashboardPage.jsx
│   ├── HostDashboardPage.jsx
│   ├── CreateClassPage.jsx
│   └── ...
├── styles/
│   ├── global.css
│   ├── CreateClassPage.css
│   └── ...
├── utils/
│   └── api.js
├── App.jsx
└── main.jsx
```

## Configuration

Create a .env file with:

```env
VITE_API_URL=http://localhost:5001/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

## Features

✅ User authentication (login/signup)
✅ Class browsing & filtering
✅ Class detail page with enrollment
✅ Host dashboard with analytics
✅ Host Create Class page with schedule builder
✅ Responsive layout and mobile support
✅ Protected routes and JWT handling
✅ Accessible modals and alerts

## Pages

### Public Pages

- **Landing Page** - Hero, featured classes, platform overview
- **Browse Classes** - Search, filter, categories
- **Class Details** - Course info, pricing, enrollment card
- **Login** - User authentication
- **Signup** - New user registration with host upgrade option

### Protected Pages (Auth Required)

- **Student Dashboard** - Enrollments, progress, profile
- **Host Dashboard** - Class management, earnings, analytics
- **Create Class** - Host class creation with pricing and schedule settings

## Components

### Key Reusable UI

- `Header` - Navigation and auth menu
- `MessageBanner` - Accessible status/error messages
- `PromptDialog` / `ConfirmDialog` - Non-blocking modals
- `LoadingSpinner` - Inline and full-page loading states

## Styling

- CSS with mobile-first responsive design
- Breakpoints: 480px, 768px, 1024px
- BEM-like naming for component styles
- Accessible focus states and form controls

## API Integration

All API calls use `api.js`:

- Creates Axios instance with `baseURL`
- Auto-attaches JWT from localStorage
- Handles 401 responses and redirects to login

Endpoints used:

- `/auth/register`, `/auth/login`, `/auth/profile`
- `/classes`, `/classes/my-classes`, `/classes/:id`
- `/payments/create-intent`, `/payments/confirm`

## Development Scripts

```bash
npm run dev          # start Vite dev server (localhost:5173)
npm run build        # production build (runs tsc + vite build)
npm run preview      # preview built site
npm run lint         # run ESLint against src (flat-config)
```

Running lint locally

- ESLint is configured with a flat config at `frontend/eslint.config.js`. To run:

```bash
cd frontend
npm install
npm run lint
```

- The repo currently allows a small set of development warnings (unused vars in platform-wide components). To silence intentional unused variables, prefix them with an underscore (e.g. `_err`) or update the rule in `frontend/eslint.config.js`.

## Notes

- The Create Class page is available at `/create-class` for host users.
- The frontend now includes an ESLint configuration and ignores `node_modules` and `dist`.
- If you add or update JSX pages, run `npm run lint` before committing.

## Next Steps

- [ ] Add stronger automated tests for shared UI components
- [ ] Add E2E coverage for host class creation and checkout flows
- [ ] Complete certificate PDF generation and email delivery

---

**Backend API URL**: http://localhost:5001
**Frontend URL**: http://localhost:5173
