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
      // Pastikan objek db sudah siap
      if (typeof db === 'undefined') {
        resolve({ data: [], success: false });
        return;
      }

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
        resolve({ data: [], success: false }); 
      });
    });
  } catch(e) {
    console.error("Firebase load error:", e);
    return { data: [], success: true };
  }
}

// Get nama list untuk dropdown admin dari MASTER_SALES
async function getNameListFromFirebase() {
  try {
    return new Promise((resolve) => {
      if (typeof db === 'undefined') {
        resolve([]);
        return;
      }
      const ref = db.ref('data/MASTER_SALES');
      ref.once('value', (snapshot) => {
        const allData = snapshot.val() || {};
        let names = [];
        if (Array.isArray(allData)) {
          names = [...new Set(allData.map(x => x.nama || x.NAMA))].filter(Boolean);
        } else {
          names = Object.keys(allData);
        }
        resolve(names.sort());
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

// Wrapper untuk backward compatibility - disesuaikan dengan nama folder di Firebase
const firebaseDataProvider = {
  getAbsensi: async (nama) => {
    if(!nama) return { data: [] };
    return await loadDataFromFirebase('ABSENFINGER', nama);
  },
  
  getPenjualan: async (nama) => {
    if(!nama) return { data: [] };
    return await loadDataFromFirebase('PENJUALAN', nama);
  },
  
  getUC: async (nama) => {
    if(!nama) return { data: [] };
    return await loadDataFromFirebase('UC', nama);
  },
  
  getPerolehan: async () => {
    return await loadDataFromFirebase('PENJUALAN');
  },
  
  getPerolehanBrand: async (nama) => {
    if(!nama) return { data: [] };
    return await loadDataFromFirebase('PENJUALAN', nama);
  },
  
  getDendaLate: async (nama) => {
    if(!nama) return { data: [] };
    return await loadDataFromFirebase('ABSENFINGER', nama);
  },
  
  getPromo: async () => {
    return await loadDataFromFirebase('PROMO');
  },
  
  getReward: async () => {
    return await loadDataFromFirebase('REWARD');
  },
  
  getRewardSaya: async (nama) => {
    if(!nama) return { data: [] };
    return await loadDataFromFirebase('REWARD', nama);
  },
  
  getRules: async () => {
    return await loadDataFromFirebase('RULES');
  },
  
  getPunishment: async () => {
    return await loadDataFromFirebase('PUNISHMENT');
  },
  
  getPelanggaranSaya: async (nama) => {
    if(!nama) return { data: [] };
    return await loadDataFromFirebase('PUNISHMENT', nama);
  },
  
  getNames: async () => {
    return await getNameListFromFirebase();
  }
};

console.log("✅ Firebase Data Provider loaded");
