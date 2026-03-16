# PayFlow — Frontend

Next.js 14 frontend for the Payout Management system.

## Tech Stack
- Next.js 14 (App Router)
- React 18
- Material UI v6 + MUI Lab (Timeline)
- Sonner (toast notifications)
- Inter font

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. .env.local is already configured
# NEXT_PUBLIC_API_URL=http://localhost:5000

# 3. Run development server
npm run dev
```

App runs on `http://localhost:3000`

## Pages

| Route | Access | Description |
|-------|--------|-------------|
| /login | Public | Sign in page with demo credential hints |
| /payouts | OPS + FINANCE | Payout list with filters and inline actions |
| /payouts/[id] | OPS + FINANCE | Detail view + audit trail timeline |
| /vendors | OPS only | Vendor card grid + add vendor |

## Role Behaviour

**OPS**: Create vendors, create payouts (Draft), submit payouts for review
**FINANCE**: Approve or reject Submitted payouts (rejection reason required)

Nobody can skip status transitions — enforced on the backend.

## Project Structure
```
src/
├── app/
│   ├── login/page.js
│   ├── payouts/page.js
│   ├── payouts/[id]/page.js
│   └── vendors/page.js
├── components/
│   ├── AppShell.js      # Dark sidebar layout
│   ├── Providers.js     # MUI Theme + AuthProvider
│   ├── PrivateRoute.js
│   └── PublicRoute.js
└── context/
    └── AuthContext.js   # JWT auth state
```
