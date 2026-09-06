/**
 * Firebase Data Loader - UFO Dashboard
 * Wrapper untuk backward compatibility dengan kode existing
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
      const timeout = setTimeout(() => {
        reject(new Error(`Firebase timeout loading ${path}`));
      }, 10000); // 10 detik timeout
      
      ref.once('value', (snapshot) => {
        clearTimeout(timeout);
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
        clearTimeout(timeout);
        console.error(`Firebase error loading ${path}:`, error);
        resolve({ data: [], success: false }); // Fallback, jangan reject
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
      const ref = db.ref('data/absensi');
      ref.once('value', (snapshot) => {
        const allData = snapshot.val() || {};
        const names = Object.keys(allData).sort();
        resolve(names);
      }, () => {
        resolve([]);
      });
    });
  } catch(e) {
    console.error("Error getting names:", e);
    return [];
  }
}

// Push data ke Firebase (untuk admin upload)
async function pushDataToFirebase(category, nama, dataArray) {
  try {
    const path = `data/${category}/${nama.toUpperCase()}`;
    const ref = db.ref(path);
    await ref.set(dataArray);
    return { success: true, message: `Data ${category} berhasil disimpan ke Firebase` };
  } catch(e) {
    console.error("Firebase push error:", e);
    return { success: false, message: e.message };
  }
}

// Wrapper untuk backward compatibility - semua data fetch calls
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

console.log("✅ Firebase Data Provider loaded");
