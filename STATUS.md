# Status — Netflix QR (mode Kode Akses + Worker Aroshi)

Update terakhir: **semua komponen TERPASANG & TERUJI**. Tinggal nunggu cooldown
limit IP Aroshi (di luar kendali kita).

## Arsitektur

```
[USER] → [WEB Vercel] → [TUNNEL CF] → [WORKER Termux] → [AROSHI]
 HP/PC    kode akses      cloudflared    srv.mjs          nftools.aroshi.my.id
```

## Yang UDAH beres & teruji ✅

| Komponen | Status | Bukti |
|---|---|---|
| Web Vercel | ✅ LIVE | netflix-qr-web.vercel.app |
| Kode akses | ✅ TERUJI | salah→401, benar→200 |
| Sesi cookie | ✅ TERUJI | GET /api/auth ok |
| Worker | ✅ TERUJI | /health `{ok:true,db:false}` |
| Tunnel CF | ✅ TERUJI | /health dari internet ok |
| Generate link | ✅ TERUJI | jam 10:11 dapet link Netflix asli |
| Endpoint /ensure + /take | ✅ TERUJI | idempotent, polling works |
| Script auto-start | ✅ ADA | start-all.sh |
| Watchdog | ✅ ADA | watchdog.sh |

## ⏸️ Yang belum: Aroshi limit IP

Aroshi (`nftools.aroshi.my.id`) **limit per IP**. Habis generate kebanyakan → `403`/`429`:
```
POST nftools.aroshi.my.id/api/random → 403 / 429
→ halaman gak ngeluarin link ("No valid link returned: empty")
```

**Bukan bug sistem kita.** Generate PERTAMA (jam 10:11) sukses dapet link asli.

Cara lepas limit:
1. **Tunggu cooldown** 15-60 menit (paling gampang).
2. **Ganti IP** — proxy/VPN/mobile data (lo udah punya `proxies.txt`).
3. **Kurangi frekuensi** — CONCURRENCY=1, jangan spam.

## Cara pakai (buat lo)

```bash
# 1. Set token Vercel (sekali):
export VERCEL_TOKEN=vca_xxx

# 2. Jalanin semua (worker + tunnel + auto-update URL Vercel):
bash ~/.zeline/aroshi-worker/start-all.sh

# 3. Keep-alive (opsional, biar auto-restart kalau mati):
bash ~/.zeline/aroshi-worker/watchdog.sh &
```

Kalau tunnel dapet URL baru, `start-all.sh` auto-update `WORKER_URL` di Vercel.
Redeploy Vercel manual: `cd ~/.zeline/netflix-qr-web && npx vercel --prod`

## Kode akses aktif

Env Vercel `ACCESS_CODES`: `NQR-7K2P`, `NQR-9XQ4`, `NQR-3MZ8`
Ganti: Vercel → Settings → Environment Variables → `ACCESS_CODES` (pisah koma) → redeploy.

## Env Vercel yang di-set

```
ACCESS_CODES  = "NQR-7K2P,NQR-9XQ4,NQR-3MZ8"
JWT_SECRET    = <random 64 hex>
WORKER_URL    = https://<tunnel>.trycloudflare.com  (auto-update via start-all.sh)
WORKER_TOKEN  = 8f61237bea1f89dd1c9888280f0ff9e3
```

## File penting

- Web: `~/.zeline/netflix-qr-web/` (repo GitHub Zero-L-Project)
- Worker: `~/.zeline/aroshi-worker/` (git repo lokal)
- Script: `start-all.sh`, `watchdog.sh`
