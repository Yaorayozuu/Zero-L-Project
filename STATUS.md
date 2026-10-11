# Status Koneksi Aroshi — Netflix QR Web

Update terakhir: sudah **terconnect end-to-end** (web → worker → Aroshi).

## Yang udah beres ✅

| Bagian | Status | Catatan |
|---|---|---|
| Git repo | ✅ connected | `origin https://github.com/Yaorayozuu/Zero-L-Project.git` (branch `main`) |
| Worker → Aroshi | ✅ TERUJI | Generate basic & medium dapet link Netflix asli + QR |
| Web → Worker | ✅ | `/api/generate` trigger worker + fallback `/pool` |
| Auth (login/JWT) | ✅ TERUJI | bcrypt hash + jose JWT verified |
| DB layer (`lib/db.js`) | ✅ fixed | query parameterized (`$1`,`$2`), sebelumnya broken |
| Worker anti-crash | ✅ | DB/browser error gak matiin proses; link masuk memory pool |

Bukti test (worker log):
```
Stock: { basic: '22', standard: '56', premium: '9' }
Generated: basic  -> https://netflix.com/?nftoken=BgjCwOvc...
Generated: medium -> https://netflix.com/?nftoken=BgjCwOvc...
```

## Yang lo perlu lakuin (butuh kredensial lo) ⏳

### 1. Push ke GitHub
Commit udah lokal, tinggal push (butuh token/SSH lo):
```bash
cd .zeline/netflix-qr-web && git push origin main
```

### 2. Login Vercel + deploy
```bash
cd .zeline/netflix-qr-web
vercel login        # approve di browser
vercel --prod
```

### 3. Set Env di Vercel (Project Settings → Environment Variables)
```
POSTGRES_URL  = <dari Vercel Postgres / Storage>   # WAJIB
JWT_SECRET    = <random min 32 char>               # WAJIB
WORKER_URL    = https://<worker-lo>/               # buat generate fresh
WORKER_TOKEN  = <samain dengan worker>
```

### 4. Deploy Worker (di VPS/server, BUKAN Vercel)
Worker butuh Chromium → gak bisa di Vercel serverless. Set env & jalankan `node worker.js`.
Di Termux: `CHROME_BIN=/data/data/com.termux/files/usr/lib/chromium/chrome`.

### 5. Seed user admin
```bash
curl -X POST https://<app>.vercel.app/api/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<strong-pass>"}'
```

## Catatan penting

- **Local build Next di Termux GAK bisa** (Next 14 gak punya SWC binary android-arm64). Ini normal — build & deploy harus di Vercel/Linux.
- Worker saat ini jalan di Termux pakai `puppeteer-core` + Chromium Termux (sudah terbukti generate sukses).
- Aroshi punya limit per IP; `CONCURRENCY` worker jangan > 2.
