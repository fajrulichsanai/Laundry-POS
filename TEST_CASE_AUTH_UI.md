# UI Test Cases - Authentication Feature

**Project:** Laundry POS System  
**Feature:** Authentication (Login, Session Management, Logout)  
**Created:** March 15, 2026  
**Test Type:** User Interface (UI) Testing  

---

## 📋 Table of Contents

1. [Login - Positive Test Cases](#1-login---positive-test-cases)
2. [Login - Negative Test Cases](#2-login---negative-test-cases)
3. [Session Management - Positive Test Cases](#3-session-management---positive-test-cases)
4. [Session Management - Negative Test Cases](#4-session-management---negative-test-cases)
5. [Logout - Positive Test Cases](#5-logout---positive-test-cases)
6. [Route Protection - Test Cases](#6-route-protection---test-cases)
7. [Input Validation - Test Cases](#7-input-validation---test-cases)
8. [Security & Edge Cases](#8-security--edge-cases)

---

## 1. Login - Positive Test Cases

### TC-AUTH-UI-001
**Title:** Login dengan kredensial yang valid  
**Type:** Positive  
**Priority:** High  

**Steps:**
1. Buka halaman login `/login`
2. Verifikasi tampilan form login dengan elemen:
   - Logo "FreshClean Laundry"
   - Field email dengan icon user
   - Field password dengan icon lock
   - Button "Masuk ke Sistem"
3. Masukkan email yang valid (contoh: `admin@laundry.com`)
4. Masukkan password yang benar
5. Klik button "Masuk ke Sistem"

**Expected Result:**
- Button berubah menjadi "Memproses..." dengan spinner loading
- Form fields menjadi disabled selama proses
- Setelah berhasil, user di-redirect ke halaman `/dashboard`
- Session cookie `session_token` terbuat di browser
- Header/Layout menampilkan informasi user yang login

**Code Reference:** `app/login/page.tsx` (lines 11-30), `lib/actions/auth.ts` (lines 10-64)

---

### TC-AUTH-UI-002
**Title:** Login dengan email case-insensitive  
**Type:** Positive  
**Priority:** Medium  

**Steps:**
1. Buka halaman login `/login`
2. Masukkan email dengan huruf kapital (contoh: `ADMIN@LAUNDRY.COM`)
3. Masukkan password yang benar
4. Klik button "Masuk ke Sistem"

**Expected Result:**
- Login berhasil karena sistem mengkonversi email ke lowercase
- User di-redirect ke `/dashboard`
- Session terbuat dengan user yang sesuai

**Code Reference:** `lib/actions/auth.ts` (line 28 - `.eq('email', email.toLowerCase())`)

---

## 2. Login - Negative Test Cases

### TC-AUTH-UI-003
**Title:** Login dengan email field kosong  
**Type:** Negative  
**Priority:** High  

**Steps:**
1. Buka halaman login `/login`
2. Biarkan field email kosong
3. Masukkan password
4. Klik button "Masuk ke Sistem"

**Expected Result:**
- Browser menampilkan validasi HTML5 "Please fill out this field"
- Form tidak ter-submit
- Tidak ada request ke server
- User tetap di halaman login

**Code Reference:** `app/login/page.tsx` (line 78 - `required` attribute pada email input)

---

### TC-AUTH-UI-004
**Title:** Login dengan password field kosong  
**Type:** Negative  
**Priority:** High  

**Steps:**
1. Buka halaman login `/login`
2. Masukkan email yang valid
3. Biarkan field password kosong
4. Klik button "Masuk ke Sistem"

**Expected Result:**
- Browser menampilkan validasi HTML5 "Please fill out this field"
- Form tidak ter-submit
- Tidak ada request ke server
- User tetap di halaman login

**Code Reference:** `app/login/page.tsx` (line 99 - `required` attribute pada password input)

---

### TC-AUTH-UI-005
**Title:** Login dengan email yang tidak terdaftar  
**Type:** Negative  
**Priority:** High  

**Steps:**
1. Buka halaman login `/login`
2. Masukkan email yang tidak ada di database (contoh: `unknown@test.com`)
3. Masukkan password apapun
4. Klik button "Masuk ke Sistem"

**Expected Result:**
- Loading state muncul selama proses
- Error message muncul dengan background merah:
  - Judul: "Login Gagal"
  - Pesan: "User tidak ditemukan"
- Icon AlertCircle ditampilkan
- User tetap di halaman login
- Form fields kembali enabled
- Input tidak di-clear (email tetap terisi)

**Code Reference:** `lib/actions/auth.ts` (lines 36-38), `app/login/page.tsx` (lines 47-54)

---

### TC-AUTH-UI-006
**Title:** Login dengan password yang salah  
**Type:** Negative  
**Priority:** High  

**Steps:**
1. Buka halaman login `/login`
2. Masukkan email yang valid dan terdaftar
3. Masukkan password yang salah
4. Klik button "Masuk ke Sistem"

**Expected Result:**
- Loading state muncul selama proses
- Error message muncul dengan background merah:
  - Judul: "Login Gagal"
  - Pesan: "Password salah"
- Icon AlertCircle ditampilkan
- User tetap di halaman login
- Form fields kembali enabled

**Code Reference:** `lib/actions/auth.ts` (lines 48-50), `app/login/page.tsx` (lines 47-54)

**⚠️ Security Note:** Error message yang spesifik ini memungkinkan user enumeration attack (attacker bisa tahu email mana yang terdaftar berdasarkan error berbeda)

---

### TC-AUTH-UI-007
**Title:** Login dengan email format tidak valid  
**Type:** Negative  
**Priority:** Medium  

**Steps:**
1. Buka halaman login `/login`
2. Masukkan email dengan format tidak valid (contoh: `emailtanpa@`, `notanemail`, `@domain.com`)
3. Masukkan password
4. Klik button "Masuk ke Sistem"

**Expected Result:**
- Browser HTML5 validation menampilkan pesan error format email
- Form tidak ter-submit
- User tetap di halaman login

**Code Reference:** `app/login/page.tsx` (line 72 - `type="email"` mengaktifkan HTML5 validation)

---

### TC-AUTH-UI-008
**Title:** Login dengan akun inactive/disabled  
**Type:** Negative  
**Priority:** High  

**Steps:**
1. Siapkan user dengan `active = false` di database
2. Buka halaman login `/login`
3. Masukkan email user yang inactive
4. Masukkan password yang benar
5. Klik button "Masuk ke Sistem"

**Expected Result:**
- Error message muncul: "User tidak ditemukan"
- Login ditolak
- User tetap di halaman login
- Tidak ada session yang terbuat

**Code Reference:** `lib/actions/auth.ts` (line 29 - `.eq('active', true)`)

---

### TC-AUTH-UI-009
**Title:** Login dengan double-click pada submit button  
**Type:** Negative  
**Priority:** Medium  

**Steps:**
1. Buka halaman login `/login`
2. Masukkan kredensial yang valid
3. Klik button "Masuk ke Sistem" dua kali dengan cepat (double-click)

**Expected Result:**
- Button langsung disabled setelah click pertama
- Loading state muncul dengan spinner
- Hanya satu request yang terkirim ke server
- Tidak ada duplicate session creation
- User di-redirect ke dashboard setelah berhasil

**Code Reference:** `app/login/page.tsx` (lines 9, 16, 109 - state `loading` mencegah multiple submit)

---

### TC-AUTH-UI-010
**Title:** Login saat koneksi internet terputus  
**Type:** Negative  
**Priority:** Medium  

**Steps:**
1. Buka halaman login `/login`
2. Masukkan kredensial yang valid
3. Matikan koneksi internet (simulate offline)
4. Klik button "Masuk ke Sistem"

**Expected Result:**
- Loading state muncul
- Setelah timeout, error message muncul: "Terjadi kesalahan. Silakan coba lagi."
- User tetap di halaman login
- Button kembali enabled setelah error

**Code Reference:** `app/login/page.tsx` (lines 21-23 - try-catch error handling)

---

## 3. Session Management - Positive Test Cases

### TC-AUTH-UI-011
**Title:** Session persisten setelah refresh halaman  
**Type:** Positive  
**Priority:** High  

**Steps:**
1. Login dengan kredensial yang valid
2. Tunggu hingga redirect ke dashboard
3. Refresh halaman (F5 atau Cmd+R)

**Expected Result:**
- User tetap login
- Tidak di-redirect ke halaman login
- Dashboard data tetap ditampilkan
- Session cookie masih ada di browser
- User info tetap tampil di header

**Code Reference:** `middleware.ts` (lines 20-47 - session validation), `lib/session.ts` (lines 71-128)

---

### TC-AUTH-UI-012
**Title:** Auto-redirect ke dashboard ketika mengakses root URL saat sudah login  
**Type:** Positive  
**Priority:** High  

**Steps:**
1. Login dengan kredensial yang valid (hingga masuk dashboard)
2. Edit URL manual menjadi `/` (root path)
3. Tekan Enter

**Expected Result:**
- User otomatis di-redirect ke `/dashboard`
- Session tetap valid
- Tidak ada flicker atau loading yang lama

**Code Reference:** `middleware.ts` (lines 64-67)

---

### TC-AUTH-UI-013
**Title:** Session auto-refresh setelah 50% waktu expired  
**Type:** Positive  
**Priority:** Medium  

**Steps:**
1. Login dengan kredensial yang valid
2. Catat waktu expires_at dari session cookie
3. Tunggu hingga 50% dari session duration (≈3.5 hari dari 7 hari)
4. Lakukan activity (navigasi atau refresh halaman)
5. Periksa expires_at di session cookie dan database

**Expected Result:**
- Session expires_at diperpanjang otomatis 7 hari lagi dari waktu sekarang
- User tidak perlu login ulang
- Activity berjalan normal tanpa interrupsi

**Code Reference:** `lib/session.ts` (lines 119-138 - sliding session mechanism)

**Note:** Test ini memerlukan waktu lama atau manipulation database untuk testing cepat

---

### TC-AUTH-UI-014
**Title:** Multiple tabs dengan session yang sama  
**Type:** Positive  
**Priority:** Medium  

**Steps:**
1. Login di tab pertama
2. Buka tab baru di browser yang sama
3. Akses halaman dashboard atau halaman protected lainnya di tab baru

**Expected Result:**
- Session cookie ter-share antar tabs
- User langsung bisa akses dashboard tanpa login lagi
- Kedua tabs menampilkan user yang sama
- Session token sama di kedua tabs

**Code Reference:** `middleware.ts` (line 9 - cookie sharing), session-based auth design

---

## 4. Session Management - Negative Test Cases

### TC-AUTH-UI-015
**Title:** Akses protected page tanpa login  
**Type:** Negative  
**Priority:** High  

**Steps:**
1. Pastikan tidak ada session (belum login atau sudah logout)
2. Akses URL protected page secara langsung (contoh: `/dashboard`, `/pos`, `/transactions`)
3. Tekan Enter

**Expected Result:**
- User otomatis di-redirect ke halaman `/login`
- Halaman protected tidak tampil sama sekali
- Error tidak muncul di console
- URL berubah ke `/login`

**Code Reference:** `middleware.ts` (lines 50-54)

---

### TC-AUTH-UI-016
**Title:** Session expired setelah 7 hari  
**Type:** Negative  
**Priority:** High  

**Steps:**
1. Login dengan kredensial yang valid
2. Manipulasi database: ubah `expires_at` di tabel sessions menjadi waktu yang sudah lewat
3. Refresh halaman atau navigasi ke halaman lain

**Expected Result:**
- User otomatis di-redirect ke `/login`
- Session dihapus dari database
- Session cookie dihapus dari browser
- Pesan tidak muncul (silent redirect)

**Code Reference:** `lib/session.ts` (lines 101-106), `middleware.ts` (lines 27-37)

---

### TC-AUTH-UI-017
**Title:** Session dengan user inactive  
**Type:** Negative  
**Priority:** High  

**Steps:**
1. Login dengan kredensial yang valid (masuk ke dashboard)
2. Admin mengubah status user menjadi `active = false` di database
3. Refresh halaman atau navigasi ke halaman lain

**Expected Result:**
- User otomatis logout dan di-redirect ke `/login`
- Session dihapus dari database
- Session cookie dihapus dari browser
- User tidak bisa akses halaman protected

**Code Reference:** `middleware.ts` (lines 39-45), `lib/session.ts` (lines 110-115)

---

### TC-AUTH-UI-018
**Title:** Manual delete session cookie dari browser  
**Type:** Negative  
**Priority:** Medium  

**Steps:**
1. Login dengan kredensial yang valid
2. Buka Developer Tools → Application/Storage → Cookies
3. Hapus cookie dengan nama `session_token`
4. Refresh halaman atau navigasi

**Expected Result:**
- User otomatis di-redirect ke `/login`
- User harus login ulang
- Tidak ada error yang muncul

**Code Reference:** `middleware.ts` (lines 9-11, 50-54)

---

### TC-AUTH-UI-019
**Title:** Session token yang tidak valid/corrupted  
**Type:** Negative  
**Priority:** Medium  

**Steps:**
1. Login dengan kredensial yang valid
2. Buka Developer Tools → Application → Cookies
3. Edit cookie `session_token` menjadi value random (contoh: `invalid_token_12345`)
4. Refresh halaman atau navigasi

**Expected Result:**
- Session validation gagal
- User di-redirect ke `/login`
- Session tidak ditemukan di database
- User harus login ulang

**Code Reference:** `middleware.ts` (lines 18-47), `lib/session.ts` (lines 79-90)

---

## 5. Logout - Positive Test Cases

### TC-AUTH-UI-020
**Title:** Logout dari dashboard  
**Type:** Positive  
**Priority:** High  

**Steps:**
1. Login dengan kredensial yang valid
2. Navigasi ke halaman dashboard atau halaman protected lainnya
3. Klik button/link Logout (biasanya di header/sidebar)

**Expected Result:**
- Session dihapus dari database (tabel sessions)
- Cookie `session_token` dihapus dari browser
- User di-redirect ke halaman `/login`
- Jika mencoba akses back button, user tidak bisa ke dashboard (tetap redirect ke login)

**Code Reference:** `lib/actions/auth.ts` (lines 139-143), `lib/session.ts` (lines 155-169)

---

### TC-AUTH-UI-021
**Title:** Logout dari multiple tabs  
**Type:** Positive  
**Priority:** Medium  

**Steps:**
1. Login di browser
2. Buka dashboard di 2 tabs berbeda
3. Logout dari salah satu tab
4. Switch ke tab lainnya dan coba refresh atau navigasi

**Expected Result:**
- Session terhapus untuk semua tabs (cookie shared)
- Tab kedua juga otomatis redirect ke `/login` saat ada activity
- Kedua tabs tidak bisa akses dashboard lagi tanpa login ulang

**Code Reference:** Session-based auth design, cookie sharing di browser

---

## 6. Route Protection - Test Cases

### TC-AUTH-UI-022
**Title:** Redirect ke dashboard saat user sudah login dan akses /login  
**Type:** Positive  
**Priority:** High  

**Steps:**
1. Login dengan kredensial yang valid
2. Edit URL manual menjadi `/login`
3. Tekan Enter

**Expected Result:**
- User otomatis di-redirect ke `/dashboard`
- Form login tidak tampil
- Session tetap valid

**Code Reference:** `middleware.ts` (lines 57-61)

---

### TC-AUTH-UI-023
**Title:** Akses root path "/" tanpa login  
**Type:** Negative  
**Priority:** High  

**Steps:**
1. Pastikan belum login (hapus cookie jika perlu)
2. Akses URL root `/`
3. Tekan Enter

**Expected Result:**
- User otomatis di-redirect ke `/login`
- Login form ditampilkan

**Code Reference:** `middleware.ts` (lines 70-74)

---

### TC-AUTH-UI-024
**Title:** Protected routes tidak bisa diakses tanpa session  
**Type:** Negative  
**Priority:** High  

**Steps:**
1. Pastikan tidak ada session (belum login)
2. Coba akses berbagai protected routes:
   - `/dashboard`
   - `/pos`
   - `/transactions`
   - `/customers`
   - `/services`
   - `/reports`
   - `/expenses`
   - `/settings`

**Expected Result:**
- Semua route di atas redirect ke `/login`
- Halaman protected tidak tampil sama sekali
- Middleware memblokir akses tanpa error

**Code Reference:** `middleware.ts` (lines 13-14, 50-54)

---

## 7. Input Validation - Test Cases

### TC-AUTH-UI-025
**Title:** Email field hanya accept format email valid  
**Type:** Negative  
**Priority:** Medium  

**Test Data:**
- Invalid: `notanemail`, `test@`, `@domain.com`, `test @domain.com`, `test..@domain.com`
- Valid: `test@domain.com`, `user+tag@example.co.id`

**Steps:**
1. Buka halaman login
2. Input salah satu format invalid ke field email
3. Input password
4. Submit form

**Expected Result:**
- Browser HTML5 validation menampilkan error
- Form tidak ter-submit untuk format invalid
- Form ter-submit untuk format valid

**Code Reference:** `app/login/page.tsx` (line 72 - `type="email"`)

---

### TC-AUTH-UI-026
**Title:** Password field disembunyikan (masked)  
**Type:** Positive  
**Priority:** Low  

**Steps:**
1. Buka halaman login
2. Ketik text di field password
3. Observasi tampilan

**Expected Result:**
- Karakter yang diketik ditampilkan sebagai bullet points (••••)
- Password tidak tampil plain text
- Field type adalah "password"

**Code Reference:** `app/login/page.tsx` (line 93 - `type="password"`)

---

### TC-AUTH-UI-027
**Title:** Form autocomplete untuk email dan password  
**Type:** Positive  
**Priority:** Low  

**Steps:**
1. Login sekali dengan kredensial valid
2. Logout
3. Kembali ke halaman login
4. Klik pada field email atau password

**Expected Result:**
- Browser menawarkan autocomplete untuk email yang pernah digunakan
- Browser menawarkan saved password (jika diizinkan)
- Attribute `autoComplete="email"` dan `autoComplete="current-password"` bekerja

**Code Reference:** `app/login/page.tsx` (lines 73, 94)

---

### TC-AUTH-UI-028
**Title:** Loading state mencegah user submit form berulang kali  
**Type:** Positive  
**Priority:** Medium  

**Steps:**
1. Buka halaman login
2. Input kredensial yang **salah** (untuk memperpanjang loading time)
3. Klik submit
4. Saat loading, coba klik submit lagi
5. Saat loading, coba ketik di input fields

**Expected Result:**
- Button submit disabled saat loading
- Button menampilkan spinner dan text "Memproses..."
- Input fields disabled saat loading
- User tidak bisa submit form lagi hingga proses selesai
- Setelah error/sukses, form kembali enabled

**Code Reference:** `app/login/page.tsx` (lines 9, 16, 79, 100, 109-120)

---

## 8. Security & Edge Cases

### TC-AUTH-UI-029
**Title:** XSS Prevention - Input tidak execute JavaScript  
**Type:** Negative (Security)  
**Priority:** High  

**Steps:**
1. Buka halaman login
2. Input XSS payload di field email: `<script>alert('XSS')</script>`
3. Input password apapun
4. Submit form

**Expected Result:**
- Script tidak ter-execute
- Input di-treat sebagai plain text
- Error muncul "User tidak ditemukan" atau validation error
- Tidak ada alert popup yang muncul
- Console tidak menampilkan XSS execution

**Code Reference:** React automatically escapes input, form handling di `app/login/page.tsx`

---

### TC-AUTH-UI-030
**Title:** SQL Injection Prevention  
**Type:** Negative (Security)  
**Priority:** High  

**Steps:**
1. Buka halaman login
2. Input SQL injection payload di email: `admin' OR '1'='1`
3. Input password: `' OR '1'='1`
4. Submit form

**Expected Result:**
- SQL injection tidak berhasil
- Query tidak ter-corrupt (Supabase menggunakan parameterized queries)
- Error "User tidak ditemukan" muncul
- Tidak ada data leak atau unauthorized access

**Code Reference:** `lib/actions/auth.ts` (lines 27-29 - Supabase client uses parameterized queries)

---

### TC-AUTH-UI-031
**Title:** CSRF Protection via Cookie Settings  
**Type:** Positive (Security)  
**Priority:** High  

**Steps:**
1. Login dengan valid credentials
2. Buka Developer Tools → Application → Cookies
3. Inspect cookie `session_token`
4. Periksa attribute: HttpOnly, Secure, SameSite

**Expected Result:**
- Cookie memiliki flag `HttpOnly = true` (tidak bisa diakses via JavaScript)
- Cookie memiliki flag `Secure = true` di production (hanya dikirim via HTTPS)
- Cookie memiliki flag `SameSite = Lax` (proteksi terhadap CSRF attack)
- Cookie tidak bisa diakses via `document.cookie` di console

**Code Reference:** `lib/session.ts` (lines 58-63)

---

### TC-AUTH-UI-032
**Title:** Brute Force Attack - Tidak ada rate limiting (VULNERABILITY)  
**Type:** Negative (Security)  
**Priority:** Critical  

**Steps:**
1. Buka halaman login
2. Input email yang valid
3. Submit dengan password salah 10 kali berturut-turut dengan cepat
4. Observasi response

**Expected Result (Current Behavior - VULNERABLE):**
- ⚠️ Sistem membiarkan unlimited login attempts
- Tidak ada lockout atau delay
- Setiap attempt langsung di-process
- Tidak ada captcha atau verification
- **CRITICAL ISSUE:** Sistem rentan terhadap brute force attack

**Expected Result (Should Be Implemented):**
- Setelah 5 failed attempts, tampilkan captcha
- Setelah 10 failed attempts, lockout account 15 menit
- Setelah 20 failed attempts, lockout account sampai admin unlock

**Code Reference:** TIDAK ADA rate limiting di `lib/actions/auth.ts` - **Security vulnerability**

---

### TC-AUTH-UI-033
**Title:** User Enumeration via Error Message (VULNERABILITY)  
**Type:** Negative (Security)  
**Priority:** High  

**Steps:**
1. Input email yang TIDAK terdaftar → submit
2. Catat error message
3. Input email yang TERDAFTAR tapi password salah → submit
4. Catat error message
5. Bandingkan kedua error message

**Expected Result (Current Behavior - VULNERABLE):**
- Email tidak terdaftar: "User tidak ditemukan"
- Email terdaftar, password salah: "Password salah"
- ⚠️ Attacker bisa mengetahui email mana yang terdaftar di sistem
- **SECURITY ISSUE:** Information disclosure vulnerability

**Expected Result (Should Be Implemented):**
- Semua login failure harus menampilkan error message yang sama: "Email atau password salah"
- Tidak membedakan antara "user tidak ditemukan" dan "password salah"

**Code Reference:** `lib/actions/auth.ts` (lines 36-38, 48-50) - **Security vulnerability**

---

### TC-AUTH-UI-034
**Title:** Plain Text Password Comparison (CRITICAL VULNERABILITY)  
**Type:** Negative (Security)  
**Priority:** Critical  

**Steps:**
1. Buka dan review source code `lib/actions/auth.ts` line 46-48
2. Cek apakah password comparison menggunakan bcrypt.compare atau plain comparison
3. Test login dengan password yang di-hash vs plain password

**Expected Result (Current Behavior - CRITICAL):**
- ⚠️ **CRITICAL:** Code menggunakan `password === user.password_hash`
- Password di-compare secara plain text tanpa hashing
- Comment "DEVELOPMENT MODE" di line 45-46
- **CRITICAL VULNERABILITY:** Production tidak boleh menggunakan plain text comparison

**Expected Result (Should Be Implemented):**
```javascript
const isPasswordValid = await bcrypt.compare(password, user.password_hash)
```

**Code Reference:** `lib/actions/auth.ts` (lines 45-48) - **CRITICAL security vulnerability**

**Impact:** Jika attacker mendapat akses ke database, mereka bisa login dengan password hash langsung karena sistem tidak melakukan hashing comparison.

---

### TC-AUTH-UI-035
**Title:** Session Hijacking via Cookie Theft  
**Type:** Negative (Security)  
**Priority:** High  

**Steps:**
1. Login dengan valid credentials
2. Copy session_token dari cookie
3. Buka browser lain (atau incognito)
4. Inject cookie dengan session_token yang sama (via Developer Tools)
5. Akses dashboard

**Expected Result:**
- User bisa akses dashboard menggunakan stolen session token
- **Note:** Ini adalah behavior normal untuk cookie-based auth
- **Mitigation:** HttpOnly flag mencegah XSS steal cookie
- **Recommended:** Implement device fingerprinting atau IP binding

**Code Reference:** `lib/session.ts` (cookie httpOnly flag), `middleware.ts` (session validation)

---

### TC-AUTH-UI-036
**Title:** Concurrent Sessions - Multiple devices  
**Type:** Positive  
**Priority:** Medium  

**Steps:**
1. Login di browser Chrome
2. Login dengan user yang sama di browser Firefox
3. Login dengan user yang sama di Mobile browser
4. Verifikasi semua session di database

**Expected Result (Current Behavior):**
- Sistem membolehkan unlimited concurrent sessions
- Semua devices bisa login bersamaan dengan user yang sama
- Setiap login membuat session token baru di database
- **Note:** Tidak ada limit jumlah session per user

**Recommended Enhancement:**
- Limit maksimal 3-5 active sessions per user
- Tampilkan UI untuk manage active sessions
- Option untuk logout all devices

**Code Reference:** `lib/session.ts` (createSession function tidak check existing sessions)

---

## 📊 Test Summary

| Category | Total | Positive | Negative | Priority High | Priority Critical |
|----------|-------|----------|----------|---------------|-------------------|
| Login | 10 | 2 | 8 | 6 | 0 |
| Session Management | 9 | 4 | 5 | 6 | 0 |
| Logout | 2 | 2 | 0 | 1 | 0 |
| Route Protection | 3 | 1 | 2 | 3 | 0 |
| Input Validation | 4 | 3 | 1 | 1 | 0 |
| Security & Edge Cases | 8 | 2 | 6 | 4 | 2 |
| **TOTAL** | **36** | **14** | **22** | **21** | **2** |

---

## 🔴 Critical Issues Found

1. **TC-AUTH-UI-034: Plain Text Password Comparison**
   - Severity: CRITICAL
   - Location: `lib/actions/auth.ts` line 48
   - Impact: Password tidak di-hash saat comparison, hanya development mode tapi sangat berbahaya jika masuk production
   - Action Required: MUST FIX before production

2. **TC-AUTH-UI-032: No Rate Limiting**
   - Severity: CRITICAL
   - Location: No implementation found
   - Impact: Sistem rentan terhadap brute force attack
   - Action Required: Implement rate limiting + account lockout

3. **TC-AUTH-UI-033: User Enumeration**
   - Severity: HIGH
   - Location: `lib/actions/auth.ts` lines 36-38, 48-50
   - Impact: Attacker bisa enumerate registered emails
   - Action Required: Generic error message untuk semua login failures

---

## 📝 Notes

### Features NOT Implemented (Disebutkan user tapi tidak ada di code):
- ❌ **OTP Verification** - tidak ada implementasi
- ❌ **Register/Signup Page** - function ada di backend tapi tidak ada UI
- ❌ **Forgot Password** - tidak ada
- ❌ **Email Verification** - tidak ada
- ❌ **2FA/Two-Factor Authentication** - tidak ada

### Features Yang Ada:
- ✅ Login with email & password
- ✅ Session management dengan cookie
- ✅ Auto session refresh (sliding session)
- ✅ Logout functionality
- ✅ Route protection via middleware
- ✅ Password hashing di signup (bcrypt)
- ✅ Case-insensitive email
- ✅ Active/Inactive user status

---

## 🎯 Recommended Improvements

### Priority 1 (MUST):
1. Fix plain text password comparison → use bcrypt.compare()
2. Implement rate limiting for login attempts
3. Change error messages to generic "Email atau password salah"
4. Add account lockout after multiple failed attempts

### Priority 2 (SHOULD):
1. Implement forgot password flow
2. Add password strength validation (min 8 chars, complexity)
3. Implement session limit per user
4. Add activity logging (login attempts, etc.)

### Priority 3 (NICE TO HAVE):
1. Add signup/register page UI
2. Implement email verification
3. Add "Remember Me" functionality
4. Session management UI (view & revoke sessions)
5. Two-factor authentication (TOTP)

---

**Document Version:** 1.0  
**Last Updated:** March 15, 2026  
**Tested On:** Source code analysis - ready for UI testing execution
