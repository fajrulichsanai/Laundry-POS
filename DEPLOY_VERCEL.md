# 🚀 Deployment Guide - Vercel

Panduan lengkap untuk deploy **Laundry POS System** ke Vercel.

---

## 📋 Prerequisites

Sebelum deploy, pastikan Anda sudah:

- ✅ Memiliki akun [Vercel](https://vercel.com)
- ✅ Memiliki akun [Supabase](https://supabase.com) dan project sudah setup
- ✅ Database schema sudah di-import ke Supabase
- ✅ Git repository sudah di-push ke GitHub/GitLab/Bitbucket

---

## 🔧 Step 1: Persiapan Database

### 1.1. Setup Supabase Database

Pastikan database Supabase sudah ter-setup dengan menjalankan migration files:

```sql
-- Jalankan di Supabase SQL Editor secara berurutan:
1. database/schema.sql                           -- Setup tables
2. migration-add-expenses-notes.sql              -- Add notes column
3. migration-add-pickup-date.sql                 -- Add pickup tracking
```

### 1.2. Catat Credentials Supabase

Ambil credentials dari Supabase Dashboard:

1. Buka project Supabase Anda
2. Masuk ke **Settings** → **API**
3. Catat:
   - **Project URL** (contoh: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
   - **Service Role Key** (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...) ⚠️ **Secret!**

---

## 🌐 Step 2: Deploy ke Vercel

### Opsi A: Deploy via Vercel Dashboard (Recommended)

#### 1. Import Project

1. Login ke [Vercel Dashboard](https://vercel.com/dashboard)
2. Klik **"Add New Project"** atau **"Import Project"**
3. Pilih Git provider (GitHub/GitLab/Bitbucket)
4. Authorize Vercel untuk akses repository Anda
5. Pilih repository **Laundry POS**

#### 2. Configure Project

- **Framework Preset:** Next.js (otomatis terdeteksi)
- **Root Directory:** `./` (default)
- **Build Command:** `next build` (default)
- **Output Directory:** `.next` (default)

#### 3. Setup Environment Variables

Tambahkan environment variables di Vercel:

| Variable Name | Value | Source |
|---------------|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Supabase Settings → API → service_role ⚠️ |

⚠️ **PENTING:** 
- `NEXT_PUBLIC_*` variables akan exposed ke browser (aman)
- `SUPABASE_SERVICE_ROLE_KEY` harus disimpan sebagai **Secret** (hanya untuk server-side)

#### 4. Deploy

1. Klik **"Deploy"**
2. Tunggu build process selesai (~2-5 menit)
3. Setelah selesai, Vercel akan memberikan URL deployment (contoh: `https://laundry-pos-xxxxx.vercel.app`)

---

### Opsi B: Deploy via Vercel CLI

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login ke Vercel

```bash
vercel login
```

#### 3. Deploy Project

Dari root directory project:

```bash
# Deploy production
vercel --prod

# Atau deploy preview dulu
vercel
```

#### 4. Set Environment Variables via CLI

```bash
# Set env variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

Pilih environment: **Production**, **Preview**, atau **Development**

#### 5. Redeploy Setelah Set Env

```bash
vercel --prod
```

---

## ✅ Step 3: Verifikasi Deployment

### 3.1. Test Aplikasi

1. Buka URL deployment Anda
2. Pastikan redirect ke `/login` jika belum login
3. Test login dengan user yang ada di database
4. Test fitur-fitur utama:
   - ✅ Login/Logout
   - ✅ Dashboard
   - ✅ POS (Create Transaction)
   - ✅ Transactions List
   - ✅ Reports & Excel Export
   - ✅ Master Data (Customers, Services)

### 3.2. Check Logs

Jika ada error, cek logs di Vercel:

1. Buka Vercel Dashboard
2. Pilih project Anda
3. Masuk ke tab **"Deployments"**
4. Klik deployment yang ingin dicek
5. Lihat **"Build Logs"** dan **"Function Logs"**

---

## 🔒 Step 4: Security Checklist

Sebelum production, pastikan:

- [ ] **SUPABASE_SERVICE_ROLE_KEY** tidak ter-commit ke Git
- [ ] File `.env.local` ada di `.gitignore`
- [ ] Environment variables sudah diset di Vercel
- [ ] RLS (Row Level Security) enabled di Supabase tables
- [ ] **FIX CRITICAL SECURITY ISSUES** (lihat `TEST_CASE_AUTH_UI.md`):
  - [ ] Ganti plain text password comparison dengan `bcrypt.compare()`
  - [ ] Implement rate limiting untuk login
  - [ ] Ganti error message menjadi generic "Email atau password salah"
  - [ ] Add account lockout setelah failed attempts

---

## 🔄 Step 5: Continuous Deployment

Setelah setup awal, setiap push ke branch `main` akan otomatis trigger deployment baru:

```bash
git add .
git commit -m "Update feature X"
git push origin main
```

Vercel akan otomatis:
1. Detect push ke repository
2. Build project
3. Deploy ke production
4. Memberikan notifikasi status (success/failed)

---

## 🌍 Step 6: Custom Domain (Optional)

### 6.1. Tambah Custom Domain

1. Buka Vercel Dashboard → Project Settings
2. Masuk ke tab **"Domains"**
3. Klik **"Add Domain"**
4. Masukkan domain Anda (contoh: `laundry.yourdomain.com`)

### 6.2. Configure DNS

Tambahkan DNS record di provider domain Anda:

**Untuk subdomain (laundry.yourdomain.com):**
```
Type: CNAME
Name: laundry
Value: cname.vercel-dns.com
```

**Untuk root domain (yourdomain.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

### 6.3. Tunggu SSL Certificate

Vercel akan otomatis generate SSL certificate (HTTPS) dalam beberapa menit.

---

## 📊 Step 7: Monitoring & Analytics

### Vercel Analytics (Optional)

Enable analytics untuk monitoring:

1. Buka Vercel Dashboard → Project Settings
2. Tab **"Analytics"**
3. Enable **Vercel Analytics**
4. Install package (jika perlu):

```bash
npm install @vercel/analytics
```

Update `app/layout.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

---

## 🐛 Troubleshooting

### Build Failed: Module not found

**Problem:** Dependencies tidak terinstall

**Solution:**
```bash
# Pastikan package.json lengkap
npm install

# Commit dan push
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### Runtime Error: Supabase connection failed

**Problem:** Environment variables tidak diset dengan benar

**Solution:**
1. Cek Vercel Dashboard → Settings → Environment Variables
2. Pastikan semua 3 variables ada dan benar
3. Redeploy: Deployments → ... → Redeploy

### Error: Session tidak terbuat

**Problem:** `SUPABASE_SERVICE_ROLE_KEY` tidak diset atau salah

**Solution:**
1. Copy ulang Service Role Key dari Supabase Dashboard
2. Paste ke Vercel Environment Variables
3. Redeploy

### 404 Error pada Routes

**Problem:** Middleware atau routing issue

**Solution:**
1. Cek `middleware.ts` config matcher
2. Cek `next.config.js` untuk pastikan tidak ada conflict
3. Lihat Function Logs di Vercel

---

## 📝 Notes

### Deployment URLs

- **Production:** `https://laundry-pos-xxxxx.vercel.app`
- **Preview (per branch):** `https://laundry-pos-git-feature-xxxxx.vercel.app`
- **Custom Domain:** `https://yourdomain.com` (jika sudah setup)

### Build Time

- Initial build: ~2-5 menit
- Rebuild: ~1-3 menit
- Edge deployment: Global (auto CDN)

### Limits (Free Plan)

- Bandwidth: 100GB/month
- Build execution: 100 hours/month
- Serverless function execution: 100GB-hours/month
- Domains: Unlimited

Untuk production dengan traffic tinggi, pertimbangkan upgrade ke **Pro Plan**.

---

## ✅ Post-Deployment Checklist

Setelah deploy berhasil:

- [ ] Test semua fitur di production URL
- [ ] Verifikasi session/authentication bekerja
- [ ] Test Excel export di production
- [ ] Cek performance dengan Lighthouse
- [ ] Setup monitoring/logging
- [ ] Backup database secara berkala
- [ ] Dokumentasi credentials di password manager
- [ ] **FIX critical security issues** sebelum public launch

---

## 🆘 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Supabase Docs:** https://supabase.com/docs
- **Community Support:** Vercel Discord, Next.js Discussion

---

**Happy Deploying! 🚀**

Last Updated: March 15, 2026
