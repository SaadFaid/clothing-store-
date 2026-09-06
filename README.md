# E-Commerce Store

A full-featured e-commerce storefront built with **React + TypeScript + Vite** on the frontend and an **Express** backend, backed by **Supabase** (PostgreSQL, auth, storage) and **Stripe** for payments.

Use this as a starter template for a clothing / fashion online store.

## Features

- Product catalog with categories, sizes, colors, and filters
- Search, favorites, and best-sellers pages
- Shopping cart and checkout with Stripe payments
- Customer accounts (register / login) with profiles and theme preference
- Orders, returns, shipping info, and FAQ pages
- Admin dashboard: products, orders, users, messages, archive
- Contact us / messaging system
- Fully responsive UI with light/dark themes

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL) with RLS policies
- **Payments**: Stripe

## Getting Started

### 1. Database

The schema and sample data are in the SQL files:

- `complete_database_setup.sql` — full schema
- `sample_data.sql` — placeholder catalog and users
- `supabase/migrations/` — incremental migrations

### 2. Environment

Copy the example env files and fill in your own keys:

```bash
cp .env.example .env            # Vite frontend (Supabase URL, anon key, Stripe publishable key)
cp backend/.env.example backend/.env   # Express backend (Stripe secret, Supabase service role)
```

### 3. Install & run

```bash
npm install
npm run dev          # Vite dev server
```

Backend:

```bash
cd backend
npm install
npm run dev
```

## Project Structure

- `src/` — React app (pages, components, contexts, lib)
- `backend/` — Express payment API
- `supabase/migrations/` — database migrations
- `sample_data.sql` — demo catalog data

## License

This template is open source. Replace the placeholder content with your own branding before publishing.