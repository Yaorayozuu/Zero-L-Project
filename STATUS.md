# Status — Netflix QR Web (mode KODE AKSES)

Update: **login/DB dibuang, diganti kode akses. Live & teruji.**

## Yang udah beres ✅

| Bagian | Status |
|---|---|
| Deploy Vercel | ✅ READY — https://netflix-qr-web.vercel.app |
| Kode akses (ACCESS_CODES) | ✅ teruji: kode salah 401, kode benar 200 |
| Sesi cookie JWT | ✅ teruji |
| Guard generate | ✅ tanpa kode akses = 401 |
| GitHub | ✅ push `8dad72f` |

## Kode akses aktif

Baca dari env Vercel `ACCESS_CODES`. Sekarang ada 3:
- `NQR-7K2P`
- `NQR-9XQ4`
- `NQR-3MZ8`

Ganti/tambah kode: Vercel → Project → Settings → Environment Variables → `ACCESS_CODES` (pisah koma), lalu redeploy.

## Yang masih tersisa ⏳

### Worker (WAJIB biar generate jalan)
Web sekarang minta link ke worker (`WORKER_URL`). Selama worker belum jalan, generate = 503.

1. Jalanin worker di Termux/VPS: `node worker.js`
2. Set env Vercel:
   ```
   WORKER_URL   = https://<url-worker-lo>   (atau http://IP:3001)
   WORKER_TOKEN = <samain dengan worker>
   ```
3. Redeploy.

Catatan: Vercel (serverless) gak bisa nge-host worker karena butuh Chromium.

## Env Vercel yg udah di-set

```
ACCESS_CODES = "NQR-7K2P,NQR-9XQ4,NQR-3MZ8"
JWT_SECRET   = <random 64 hex>   (encrypted)
```

## Perubahan desain

- **Tidak ada DB, tidak ada signup, tidak ada riwayat.** User cuma masukin kode akses.
- **Tanpa limit** generate (Aroshi yang jaga stok per IP).
- Link generate **gak kesimpen** — user harus salin/download sebelum refresh.
- Endpoint: `/api/auth` (masuk/keluar), `/api/generate` (QR), `/api/health`.
