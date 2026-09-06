/**
 * Firebase Data Loader
 * Wrapper untuk kompatibilitas dengan kode existing
 * Mengambil data dari Firebase Realtime DB
 */

// Load data dari Firebase dengan kategori dan nama (optional)
async function loadDataFromFirebase(category, nama = null) {
  try {
    let path = `data/${category}`;
    if(nama && nama.trim()) {
      path = `data/${category}/${nama.toUpperCase()}`;
    }
    
    return new Promise((resolve, reject) => {
      const ref = db.ref(path);
      ref.once('value', (snapshot) => {
        const data = snapshot.val();
        
        // Return format yang sama dengan Apps Script response
        if(Array.isArray(data)) {
          resolve({ data: data, success: true });
        } else if(data && typeof data === 'object') {
          resolve(data);
        } else {
          resolve({ data: [], success: true });
        }
      }, (error) => {
        console.error(`Firebase error loading ${path}:`, error);
        reject(error);
      });
    });
  } catch(e) {
    console.error("Firebase load error:", e);
    return { data: [], success: true };
  }
}

// Get nama list untuk dropdown admin
async function getNameListFromFirebase() {
  try {
    return new Promise((resolve) => {
      // Ambil unique nama dari data absensi
      const ref = db.ref('data/absensi');
      ref.once('value', (snapshot) => {
        const allData = snapshot.val() || {};
        const names = Object.keys(allData);
        resolve(names);
      });
    });
  } catch(e) {
    console.error("Error getting names:", e);
    return [];
  }
}

// Data login dari Sheet (tetap via Apps Script)
async function validateLoginFromSheet(nama, pin) {
  try {
    const res = await fetch(WEBAPP_URL + "?action=login&nama=" + encodeURIComponent(nama) + "&pin=" + encodeURIComponent(pin));
    return await res.json();
  } catch(e) {
    console.error("Login validation error:", e);
    return { success: false, message: "Gagal terhubung ke server" };
  }
}

// Push data ke Firebase (untuk admin upload)
async function pushDataToFirebase(category, nama, dataArray) {
  try {
    const path = `data/${category}/${nama.toUpperCase()}`;
    const ref = db.ref(path);
    await ref.set(dataArray);
    return { success: true, message: `Data ${category} untuk ${nama} berhasil disimpan` };
  } catch(e) {
    console.error("Firebase push error:", e);
    return { success: false, message: e.message };
  }
}

// Check jika data sudah ada di Firebase
async function checkDataExistsInFirebase(category) {
  try {
    return new Promise((resolve) => {
      const ref = db.ref(`data/${category}`);
      ref.once('value', (snapshot) => {
        resolve(snapshot.exists());
      });
    });
  } catch(e) {
    console.error("Check data error:", e);
    return false;
  }
}

// Wrapper untuk backward compatibility
const firebaseDataProvider = {
  getAbsensi: async (nama) => {
    if(!nama) return { data: [] };
    return await loadDataFromFirebase('absensi', nama);
  },
  
  getPenjualan: async (nama) => {
    if(!nama) return { data: [] };
    return await loadDataFromFirebase('penjualan', nama);
  },
  
  getUC: async (nama) => {
    if(!nama) return { data: [] };
    return await loadDataFromFirebase('uc', nama);
  },
  
  getPerolehan: async () => {
    return await loadDataFromFirebase('perolehan');
  },
  
  getPerolehanBrand: async (nama) => {
    if(!nama) return { data: [] };
    return await loadDataFromFirebase('perolehanBrand', nama);
  },
  
  getDendaLate: async (nama) => {
    if(!nama) return { data: [] };
    return await loadDataFromFirebase('dendaLate', nama);
  },
  
  getPromo: async () => {
    return await loadDataFromFirebase('promo');
  },
  
  getReward: async () => {
    return await loadDataFromFirebase('reward');
  },
  
  getRewardSaya: async (nama) => {
    if(!nama) return { data: [] };
    return await loadDataFromFirebase('rewardSaya', nama);
  },
  
  getRules: async () => {
    return await loadDataFromFirebase('rules');
  },
  
  getPunishment: async () => {
    return await loadDataFromFirebase('punishment');
  },
  
  getPelanggaranSaya: async (nama) => {
    if(!nama) return { data: [] };
    return await loadDataFromFirebase('pelanggaranSaya', nama);
  },
  
  getNames: async () => {
    return await getNameListFromFirebase();
  }
};