# VRS Admin

Next.js admin console for VRS Water Purifiers. Runs on **port 3001** so it can
sit alongside the customer site (`3000`) and the backend (`5000`).

## Quick start

```bash
cd vrs-admin
cp .env.local.example .env.local     # set NEXT_PUBLIC_API_URL if needed
npm install
npm run dev                          # http://localhost:3001
```

Make sure `vrs-backend` is running, and that you've bootstrapped an admin:

```bash
cd ../vrs-backend
# in .env: set ADMIN_EMAIL and ADMIN_PASSWORD
npm run seed:admin
```

## Pages

| Path            | Purpose                                    |
| --------------- | ------------------------------------------ |
| `/login`        | Admin sign-in (email + password)           |
| `/dashboard`    | Stats + recent orders + unread enquiries   |
| `/products`     | Product list · create · edit · delete      |
| `/customers`    | Customer directory (search, addresses)     |
| `/orders`       | Orders list · filter by status · update    |
| `/enquiries`    | Contact-form messages · status · delete    |

Auth is JWT-based — the token is stored in `localStorage`. A 401 from any admin
call bounces you back to `/login`.
