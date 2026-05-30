# iCAPI LMS

## Supabase setup (project `mvxyqbjwnpwcovkarwqa`)

### 1. API keys in `.env`

Copy `.env.example` to `.env` and set:

- `VITE_SUPABASE_URL` — `https://mvxyqbjwnpwcovkarwqa.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` — **anon public** key from [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/mvxyqbjwnpwcovkarwqa/settings/api)

Restart the dev server after changing `.env`.

**Lovable preview** (`*.lovable.app`): add the same two variables under **Project → Settings → Secrets** (or Environment), then redeploy. The `POST …/__l5e/trackevents 403` message is Lovable analytics and is unrelated to Supabase.

`.env` is not committed (see `.gitignore`); do not deploy with an empty publishable key.

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
