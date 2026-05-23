# Nitro Clicker

> Private clicker game connected to the Nitro / Gwen Ha Star ecosystem.

Nitro Clicker is a small authenticated web app deployed under Nitro:

```txt
https://nitro.sterenna.fr/clicker/
```

It is designed as a quick progression loop for the Star ecosystem:

```txt
click → collect energy → buy upgrades → generate passive energy → prestige → unlock Star rewards
```

## Architecture

```txt
nitro-clicker/
├── index.html
├── css/
│   └── clicker.css
├── js/
│   ├── app.js
│   ├── clicker-state.js
│   └── clicker-save.js
├── docs/
│   └── game-design.md
└── .github/workflows/
    └── deploy-ovh.yml
```

## Nitro shared auth

This app is deployed under `nitro.sterenna.fr`, so it can use the shared Nitro modules:

```js
import { requireAuth } from '/shared/guards.js';
import { supabase } from '/shared/supabase-client.js';
import { getProfile } from '/shared/profile.js';
```

The app requires a Nitro session. If the user is not connected, they are redirected to:

```txt
/login.html?next=/clicker/
```

## Deployment

The GitHub Actions workflow deploys the app with SSH + rsync:

```txt
main branch
→ GitHub Actions
→ ~/nitro/clicker/
→ https://nitro.sterenna.fr/clicker/
```

Required GitHub secrets:

```txt
OVH_HOST
OVH_USER
OVH_SSH_KEY
```

No Supabase key is stored in this repo. Nitro Clicker uses `/shared/config.js` from `gwen-ha-star-static`.

## Current status

Alpha scaffold:

- Nitro auth required
- local fallback save
- optional Supabase save table support
- click power upgrades
- passive generation upgrades
- prestige loop placeholder

## Future Supabase table

Suggested table:

```sql
create table public.nitro_clicker_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
```

RLS should restrict each user to their own row.
