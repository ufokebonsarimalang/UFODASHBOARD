# 🚀 Firebase Migration - Quick Start

## ✅ Files Sudah Siap!

File-file berikut sudah ditambahkan ke repo:
- ✅ `firebase-config.js` - Credentials sudah diisi
- ✅ `firebase-loader.js` - Data loader dari Firebase
- ✅ `AppScript_FirebaseSync.gs` - Apps Script untuk import data

---

## 📋 Yang Perlu Kamu Lakukan:

### STEP 1: Update Google Apps Script
```
1. Buka: https://script.google.com
2. Buka project Apps Script yang ada (atau create baru)
3. Copy SEMUA kode dari file: AppScript_FirebaseSync.gs (di repo ini)
4. Paste ke dalam editor Apps Script
5. Update FIREBASE_SECRET dengan database secret Firebase kamu:
   const FIREBASE_SECRET = "PASTE_SECRET_DI_SINI";
6. Save (Ctrl+S)
```

### STEP 2: Test & Import Data
```
1. Di Apps Script editor, pilih function: testFirebaseConnection
2. Klik tombol ▶ (Run)
3. Lihat Execution log - harus ada pesan: ✅ Firebase connection OK
4. Setelah OK, pilih function: importAllSheetDataToFirebase
5. Klik ▶ (Run) - tunggu selesai (1-2 menit)
6. Di log harus ada: ✅ Import process completed!
```

### STEP 3: Update index.html
```html
<!-- Di bagian <head>, sebelum </head>, tambahkan: -->

<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js"></script>

<!-- UFO Dashboard Firebase -->
<script src="firebase-config.js"></script>
<script src="firebase-loader.js"></script>
```

### STEP 4: Update Data Fetch Calls di index.html

**Cari dan REPLACE:**

#### Untuk Absensi:
```javascript
// LAMA:
const resAbsen = await fetch(WEBAPP_URL + "?nama=" + encodeURIComponent(namaTarget)).then(r => r.json());

// BARU:
const resAbsen = await firebaseDataProvider.getAbsensi(namaTarget);
```

#### Untuk Penjualan:
```javascript
// LAMA:
const resJual = await fetch(WEBAPP_URL + "?action=penjualan&nama=" + encodeURIComponent(namaTarget)).then(r => r.json());

// BARU:
const resJual = await firebaseDataProvider.getPenjualan(namaTarget);
```

#### Untuk UC:
```javascript
// LAMA:
const resUC = await fetch(WEBAPP_URL + "?action=uc&nama=" + encodeURIComponent(namaTarget)).then(r => r.json());

// BARU:
const resUC = await firebaseDataProvider.getUC(namaTarget);
```

#### Untuk Perolehan:
```javascript
// LAMA:
const resPerolehan = await fetch(WEBAPP_URL + "?action=perolehan").then(r => r.json());

// BARU:
const resPerolehan = await firebaseDataProvider.getPerolehan();
```

#### Untuk Nama Dropdown (loadNama function):
```javascript
// LAMA:
const res = await fetch(WEBAPP_URL + "?action=nama");
const data = await res.json();

// BARU:
const data = await firebaseDataProvider.getNames();
```

**Daftar lengkap replacements:**
```javascript
cacheData.absensi = await firebaseDataProvider.getAbsensi(targetNama);
cacheData.penjualan = await firebaseDataProvider.getPenjualan(targetNama);
cacheData.uc = await firebaseDataProvider.getUC(targetNama);
cacheData.perolehan = await firebaseDataProvider.getPerolehan();
cacheData.perolehanBrand = await firebaseDataProvider.getPerolehanBrand(targetNama);
cacheData.denda.late = await firebaseDataProvider.getDendaLate(targetNama);
cacheData.promo = await firebaseDataProvider.getPromo();
cacheData.reward = await firebaseDataProvider.getReward();
cacheData.rewardSaya = await firebaseDataProvider.getRewardSaya(targetNama);
cacheData.rules = await firebaseDataProvider.getRules();
cacheData.punishment = await firebaseDataProvider.getPunishment();
cacheData.pelanggaranSaya = await firebaseDataProvider.getPelanggaranSaya(targetNama);
```

### STEP 5: Test di Browser
```
1. Buka dashboard
2. Login dengan username & password (tetap dari Sheet)
3. Lihat menu Absensi - data harus tampil dari Firebase
4. Coba menu lainnya - semua harus jalan
5. Test export Excel/PDF - harus tetap berfungsi
6. Refresh halaman - data tetap ada (dari Firebase)
```

---

## 🎉 Selesai!

Sekarang dashboard kamu:
- ✅ Login masih via Sheet (sama seperti sebelumnya)
- ✅ Data dari Firebase (bukan Sheet lagi)
- ✅ Semua fungsi tetap jalan
- ✅ Export tetap jalan
- ✅ Real-time update dari Firebase

---

## 📱 Yang Belum Ada (Opsional - nanti bisa ditambah):
- Admin upload Excel menu (bisa ditambahkan nanti)
- Firebase Authentication (masih via Sheet sekarang)

---

## ⚠️ Penting!

**JANGAN lupa update FIREBASE_SECRET di AppScript_FirebaseSync.gs!**

Dari mana dapetin:
1. Firebase Console → Realtime Database
2. Klik tab "Rules"
3. Klik 3 titik (...) di kanan atas
4. Klik "Database secrets"
5. Copy secret key

---

## 🆘 Ada Error?

**"Cannot read property of undefined"**
```
Mungkin Firebase belum load
Tambahkan di console browser (F12):
console.log(db) - harus keluar Firebase object
```

**"Data tidak tampil"**
```
1. Buka Firebase Console → Realtime Database
2. Lihat struktur data - ada di sana?
3. Kalau kosong, jalankan importAllSheetDataToFirebase lagi
```

**"Login error"**
```
Login masih via Sheet, pastikan WEBAPP_URL masih aktif
```

---

**Butuh bantuan? Hubungi saya!** 😊
