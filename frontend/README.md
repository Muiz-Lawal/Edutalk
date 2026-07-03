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

Frontend runs on `http://localhost:5173`

3. Build for production:

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   └── Header.jsx              # Navigation component
├── context/
│   └── AuthContext.jsx         # Global auth state
├── hooks/
│   └── useAuth.js              # Custom auth hook
├── pages/
│   ├── LandingPage.jsx         # Home page
│   ├── LoginPage.jsx           # Login form
│   ├── SignupPage.jsx          # Signup form
│   ├── BrowseClassesPage.jsx   # Class catalog
│   ├── ClassDetailPage.jsx     # Class details & enrollment
│   ├── DashboardPage.jsx       # Student dashboard
│   └── HostDashboardPage.jsx   # Host dashboard
├── styles/
│   ├── global.css              # Global styles
│   ├── Header.css
│   ├── Auth.css
│   ├── BrowseClasses.css
│   ├── ClassDetail.css
│   ├── Dashboard.css
│   └── LandingPage.css
├── utils/
│   └── api.js                  # Axios instance & API client
├── App.jsx                     # Main app component
└── main.jsx                    # Entry point
```

## Configuration

Create a `.env` file with:

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

## Features

✅ User authentication (login/signup)
✅ Class browsing & filtering
✅ Class detail page with scheduling
✅ Tiered pricing visualization
✅ Student dashboard
✅ Host dashboard
✅ Responsive design
✅ Protected routes

## Pages

### Public Pages

- **Landing Page** - Hero section, features, pricing info
- **Browse Classes** - Search, filter, category browsing
- **Class Details** - Full class info, enrollment card
- **Login** - Email/password authentication
- **Signup** - Registration form with host option

### Protected Pages (Auth Required)

- **Student Dashboard** - Enrollments, payment history, profile
- **Host Dashboard** - Classes, earnings, analytics, free slots

## Components

### Header

- Logo/branding
- Navigation links
- Auth-based menu (login/logout)
- Teacher/learning mode toggle

## Styling

- **CSS Architecture**: BEM (Block, Element, Modifier) pattern
- **Color Scheme**: Purple gradient (#667eea, #764ba2)
- **Responsive**: Mobile-first approach
- **Breakpoints**: 768px (tablet/desktop)

## API Integration

All API calls go through the `api.js` utility which:

- Creates Axios instance with baseURL
- Auto-attaches JWT token to requests
- Handles response/error interceptors

Endpoints used:

- `/auth/register`, `/auth/login`, `/auth/profile`
- `/classes`, `/classes/:id`
- `/payments/create-intent`, `/payments/confirm`

## Development Scripts

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Key Features to Implement Next

- [ ] Stripe payment form integration
- [ ] Session join/video room
- [ ] Recording playback
- [ ] Review submission
- [ ] Class creation form
- [ ] Schedule builder
- [ ] Analytics charts
- [ ] User profile editor
- [ ] Notification system
- [ ] Mobile PWA support

## Dependencies

- **react**: UI library
- **react-dom**: React DOM rendering
- **react-router-dom**: Routing
- **axios**: HTTP client
- **@stripe/react-stripe-js**: Stripe components
- **@stripe/stripe-js**: Stripe SDK

## Dev Dependencies

- **@vitejs/plugin-react**: Vite React plugin
- **vite**: Build tool & dev server

## Authentication Flow

1. User registers/logs in
2. Backend returns JWT token
3. Token stored in localStorage
4. Token auto-attached to API requests
5. Logout clears token

## Responsive Design

- **Desktop**: 1200px max container
- **Tablet**: Grid columns adjust
- **Mobile**: Single column, touch-optimized

## Performance

- Code splitting via React Router
- Lazy loading images
- CSS optimization
- Minified production build

## TODO (Phase 2+)

- [ ] Add TypeScript
- [ ] E2E testing (Cypress)
- [ ] Unit tests (Vitest)
- [ ] Storybook component library
- [ ] Dark mode support
- [ ] i18n translations
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] PWA installation

---

**Backend API URL**: http://localhost:5000
**Frontend URL**: http://localhost:5173
