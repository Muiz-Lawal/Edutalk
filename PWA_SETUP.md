# PWA Implementation Guide - EduTalk

## Overview

EduTalk includes a comprehensive Progressive Web App (PWA) implementation that provides a native app-like experience on web browsers with offline support, push notifications, and mobile optimization.

## Features

### 1. **Installation**

- Install app to home screen on any device
- One-click installation from install prompt
- iOS, Android, Windows, and macOS support

### 2. **Offline Support**

- Works completely offline
- Cached content loads instantly
- Automatic sync when connection restored
- Queue management for failed requests

### 3. **Push Notifications**

- Browser push notifications
- Real-time updates from backend
- Notification badges and sounds
- Deep linking from notifications

### 4. **Service Worker**

- Automatic cache management
- Network-first strategy for APIs
- Cache-first strategy for assets
- Background sync capability

### 5. **Responsive Design**

- Mobile-first approach
- Touch-friendly UI
- Adaptive layouts
- Landscape and portrait support

## Core Services

### Image Caching Service

**File**: `frontend/src/utils/imageCacheService.js`

- 7-day TTL for cached images
- 50 MB storage limit
- Automatic cleanup of old images
- Platform-agnostic (web & mobile)

### Local Data Caching

**File**: `frontend/src/utils/localCacheService.js`

Cache durations:

- Classes: 1 hour
- Videos: 24 hours
- User profile: 7 days
- Analytics: 1 hour
- Default: 30 minutes

### Offline Request Queue

**File**: `frontend/src/utils/offlineQueueService.js`

- Automatic queuing when offline
- Retry logic with exponential backoff
- Configurable max retries
- Sync when connection restored

### Push Notifications

**File**: `frontend/src/utils/pushNotificationHandler.js`

- Firebase Cloud Messaging
- VAPID key authentication
- Foreground & background handling
- Deep linking support

### Sync Status Component

**File**: `frontend/src/components/SyncStatusComponent.jsx`

Status values:

- `online` - Connected, all data synced
- `offline` - No connection, requests queued
- `syncing` - Reconnected, processing queue

## Responsive Layout CSS

**File**: `frontend/src/styles/responsive.css`

Mobile-first breakpoints:

- Mobile: 320px
- Tablet: 640px
- Desktop: 1024px
- Large: 1440px

## Environment Setup

Create `.env` files:

**Backend** (`backend/.env`):

```
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
WEB_PUSH_CONTACT=your_email
```

**Frontend** (`frontend/.env`):

```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

## Build & Deploy

Production build:

```bash
cd frontend
npm run build
```

Deploy to any static host (Vercel, Netlify, etc.)

**HTTPS required** for PWA features

## Testing

1. **Service Worker**: DevTools > Application > Service Workers
2. **Offline**: DevTools > Network > Offline mode
3. **Cache**: DevTools > Application > Cache Storage
4. **Lighthouse**: `npx lighthouse https://yourapp.com`

## Browser Support

- Chrome 40+
- Firefox 44+
- Safari 11.1+
- Edge 17+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

**Status**: Production Ready | **Last Updated**: May 2026
