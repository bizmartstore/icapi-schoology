# iCAPI LMS

## Supabase setup (project `mvxyqbjwnpwcovkarwqa`)

### 1. API keys in `.env`

Copy `.env.example` to `.env` and set:

- `VITE_SUPABASE_URL` — `https://mvxyqbjwnpwcovkarwqa.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` — **anon public** key from [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/mvxyqbjwnpwcovkarwqa/settings/api)

Restart the dev server after changing `.env`.

**Lovable** (`*.lovable.app`): Production builds use committed `.env.production` and `src/config/supabase-public.ts`, so the app works even if Lovable Cloud still has an old Supabase connection with empty/wrong secrets. For a clean setup, open **Cloud → Secrets** and set (or remove stale) `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` for project `mvxyqbjwnpwcovkarwqa`, or disconnect the old Supabase integration in Lovable. Lovable injects `/__l5e/events.js` on publish; `public/lovable-analytics-shim.js` blocks those analytics calls so you do not get `trackevents 403` console noise. To avoid injection entirely, deploy with `npm run deploy` (Cloudflare Workers).

Local dev: copy `.env.example` → `.env` (gitignored).

### 2. Apply database schema (required once per new project)

**Option A — Supabase CLI**

```bash
npx supabase login
npm run supabase:link
npm run supabase:push
```

**Option B — SQL connection string**

Add `DATABASE_URL` to `.env` (Dashboard → Database → Connection string), then:

```bash
npm run db:push:sql
```

This creates all tables, RLS policies, RPCs (`grant_admin_role`, `submit_quiz`), and storage buckets (`banners`, `materials`, `submissions`).

### 3. Auth settings (recommended)

In Dashboard → **Authentication → Providers → Email**, turn **off** “Confirm email” so signup can create a profile immediately (the app inserts into `profiles` right after `signUp`).

### 4. Run the app

```bash
npm install
npm run dev
```

### Admin banner uploads

After migrations, the `banners` bucket exists. Sign in as an admin, open **Admin → Banners**, upload an image, then save the banner row.

### Roles

| Role | How to get it |
|------|----------------|
| Student / Teacher | Sign up; role is set from `user_type` on profile |
| Admin | Admin code dialog or `grant_admin_role` RPC (authorized email only in app) |
| Approved access | Admin approves teachers; teachers approve students |
