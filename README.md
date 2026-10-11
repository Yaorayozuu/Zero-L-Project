# Netflix QR Web (Vercel)

Dashboard login + generate QR Aroshi.

## Env (Vercel Project Settings → Environment Variables)

```
POSTGRES_URL=postgres://...            # dari Vercel Postgres / Storage
JWT_SECRET=<random-32-chars-min>
WORKER_URL=https://worker.yourdomain.com   # URL worker Aroshi (optional)
WORKER_TOKEN=<random-token>                # auth worker (optional)
NODE_ENV=production
```

## Deploy

```bash
npm i
npx vercel link        # connect project
npx vercel             # deploy preview
npx vercel --prod      # deploy production
```

## First user (seed via API setelah deploy)

```bash
curl -X POST https://your-app.vercel.app/api/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<strong-password>"}'
```

## Catatan

- Limit 3x/hari per user (reset otomatis tiap hari UTC).
- Kalo pool fresh kosong atau Aroshi limit → fallback ke stok user lain (zero-fail).
- Worker generate fresh dipanggil async tiap ada request (jangan nunggu).
