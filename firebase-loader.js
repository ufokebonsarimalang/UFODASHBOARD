/**
 * Firebase Data Loader - UFO Dashboard (Stable Compatibility)
 */

async function loadDataFromFirebase(category, nama = null) {
  try {
    let path = `data/${category}`;
    if(nama && nama.trim()) {
      path = `data/${category}/${nama.toUpperCase()}`;
    }
    
    return new Promise((resolve) => {
      if (typeof db === 'undefined') {
        resolve({ data: [], success: false });
        return;
      }

      const ref = db.ref(path);
      ref.once('value', (snapshot) => {
        const data = snapshot.val();
        if(Array.isArray(data)) {
          resolve({ data: data, success: true });
        } else if(data && typeof data === 'object') {
          // Jika berupa object (seperti mapping dari Apps Script), ubah ke array atau kembalikan object-nya
          resolve(data);
        } else {
          resolve({ data: [], success: true });
        }
      }, (error) => {
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
          names = allData.map(x => x ? (x.nama || x.NAMA || x.Nama || "") : "").filter(Boolean);
        } else if (typeof allData === 'object') {
          // Jika MASTER_SALES tersimpan sebagai object / list asosiatif
          names = Object.values(allData).map(x => {
            if (typeof x === 'object' && x !== null) {
              return x.nama || x.NAMA || x.Nama || "";
            }
            return String(x);
          }).filter(Boolean);
          
          if (names.length === 0) {
            names = Object.keys(allData);
          }
        }
        resolve([...new Set(names)].sort());
      }, () => {
        resolve([]);
      });
    });
  } catch(e) {
    console.error("Error getting names:", e);
    return [];
  }
}

// Helper untuk fetch data mentah seluruh kategori (Admin Perolehan & Denda)
async function loadRawCategory(category) {
  try {
    return new Promise((resolve) => {
      if (typeof db === 'undefined') {
        resolve(null);
        return;
      }
      db.ref(`data/${category}`).once('value', (snapshot) => {
        resolve(snapshot.val());
      }, () => {
        resolve(null);
      });
    });
  } catch(e) {
    return null;
  }
}

const firebaseDataProvider = {
  getAbsensi: async (nama) => {
    if(!nama) return { data: [] };
    const res = await loadDataFromFirebase('ABSENFINGER', nama);
    if (Array.isArray(res)) return { data: res };
    if (res && res.data) return res;
    if (res && typeof res === 'object') {
      const arr = Object.values(res).filter(item => typeof item === 'object');
      let terlambatCount = arr.filter(x => String(x.terlambat || x.TERLAMBAT || "").toUpperCase() === "YA").length;
      return { data: arr, terlambat: terlambatCount };
    }
    return { data: [] };
  },
  
  getPenjualan: async (nama) => {
    if(!nama) return { data: [] };
    const res = await loadDataFromFirebase('PENJUALAN', nama);
    if (res && res.detail) return res;
    if (Array.isArray(res)) {
      let totalU = 0, totalO = 0;
      res.forEach(item => {
        totalU += Number(item.qty || item.Qty || 0);
        totalO += Number(item.omzet || item.Omzet || 0);
      });
      return { nama: nama, tanggalPertama: res[0]?.tanggal || '-', tanggalTerakhir: res[res.length-1]?.tanggal || '-', totalUnit: totalU, totalOmzet: totalO, detail: res };
    }
    if (res && typeof res === 'object') {
      const arr = Object.values(res).filter(item => typeof item === 'object');
      let totalU = 0, totalO = 0;
      arr.forEach(item => {
        totalU += Number(item.qty || item.Qty || 0);
        totalO += Number(item.omzet || item.Omzet || 0);
      });
      return { nama: nama, tanggalPertama: arr[0]?.tanggal || '-', tanggalTerakhir: arr[arr.length-1]?.tanggal || '-', totalUnit: totalU, totalOmzet: totalO, detail: arr };
    }
    return { data: [], totalUnit: 0, totalOmzet: 0, detail: [] };
  },
  
  getUC: async (nama) => {
    if(!nama) return { data: [] };
    const res = await loadDataFromFirebase('UC', nama);
    if (res && res.detail) return res;
    if (Array.isArray(res)) {
      let total = 0;
      res.forEach(x => total += Number(x.uc || x.UC || x.qty || 0));
      return { nama: nama, totalUC: total, detail: res };
    }
    if (res && typeof res === 'object') {
      const arr = Object.values(res).filter(item => typeof item === 'object');
      let total = 0;
      arr.forEach(x => total += Number(x.uc || x.UC || x.qty || 0));
      return { nama: nama, totalUC: total, detail: arr };
    }
    return { data: [], totalUC: 0 };
  },
  
  getPerolehan: async () => {
    const rawData = await loadRawCategory('PENJUALAN');
    if (!rawData) return { list: [] };
    
    let summaryMap = {};
    let allRows = [];
    
    if (Array.isArray(rawData)) {
      allRows = rawData.filter(Boolean);
    } else {
      Object.keys(rawData).forEach(key => {
        let val = rawData[key];
        if (Array.isArray(val)) {
          allRows = allRows.concat(val.filter(Boolean));
        } else if (val && typeof val === 'object') {
          // Bisa jadi berupa object harian atau object list promotor
          Object.values(val.subVal || val).forEach(sub => {
            if (sub && typeof sub === 'object') allRows.push(sub);
          });
        }
      });
    }

    allRows.forEach(item => {
      let nama = String(item.nama || item.NAMA || "UNKNOWN").toUpperCase().trim();
      if (!summaryMap[nama]) {
        summaryMap[nama] = { nama: nama, omzet: 0, uc: 0 };
      }
      summaryMap[nama].omzet += Number(item.omzet || item.Omzet || 0);
      summaryMap[nama].uc += Number(item.uc || item.UC || 0);
    });

    let list = Object.values(summaryMap).sort((a, b) => b.omzet - a.omzet);
    return { list: list };
  },
  
  getPerolehanBrand: async (nama) => {
    return await firebaseDataProvider.getPenjualan(nama);
  },
  
  getDendaLate: async (nama) => {
    const rawAbsen = await loadRawCategory('ABSENFINGER');
    if (!rawAbsen) return { list: [] };

    let summaryLate = {};
    let allRows = [];
    if (Array.isArray(rawAbsen)) {
      allRows = rawAbsen.filter(Boolean);
    } else {
      Object.keys(rawAbsen).forEach(key => {
        let val = rawAbsen[key];
        if (Array.isArray(val)) {
          allRows = allRows.concat(val.filter(Boolean));
        } else if (val && typeof val === 'object') {
          Object.values(val).forEach(sub => {
            if (sub && typeof sub === 'object') allRows.push(sub);
          });
        }
      });
    }

    allRows.forEach(item => {
      let namaPromotor = String(item.nama || item.NAMA || "UNKNOWN").toUpperCase().trim();
      let isLate = String(item.terlambat || item.TERLAMBAT || "").toUpperCase() === "YA";
      if (isLate) {
        summaryLate[namaPromotor] = (summaryLate[namaPromotor] || 0) + 1;
      }
    });

    let list = Object.keys(summaryLate).map(nama => ({
      nama: nama,
      terlambat: summaryLate[nama]
    }));

    return { list: list };
  },
  
  getPromo: async () => {
    const res = await loadDataFromFirebase('PROMO');
    let list = Array.isArray(res) ? res : (res && typeof res === 'object' ? Object.values(res) : []);
    return { data: list.filter(Boolean) };
  },
  
  getReward: async () => {
    const res = await loadDataFromFirebase('REWARD');
    let list = Array.isArray(res) ? res : (res && typeof res === 'object' ? Object.values(res) : []);
    return { data: list.filter(Boolean) };
  },
  
  getRewardSaya: async (nama) => {
    const res = await firebaseDataProvider.getReward();
    let targetKey = nama ? nama.toUpperCase().trim() : "";
    let filtered = res.data.filter(x => String(x.nama || x.NAMA || "").toUpperCase().trim() === targetKey);
    return { data: filtered };
  },
  
  getRules: async () => {
    const res = await loadDataFromFirebase('RULES');
    let list = Array.isArray(res) ? res : (res && typeof res === 'object' ? Object.values(res) : []);
    return { data: list.filter(Boolean) };
  },
  
  getPunishment: async () => {
    const res = await loadDataFromFirebase('PUNISHMENT');
    let list = Array.isArray(res) ? res : (res && typeof res === 'object' ? Object.values(res) : []);
    return { data: list.filter(Boolean) };
  },
  
  getPelanggaranSaya: async (nama) => {
    const res = await firebaseDataProvider.getPunishment();
    let targetKey = nama ? nama.toUpperCase().trim() : "";
    let filtered = res.data.filter(x => String(x.nama || x.NAMA || "").toUpperCase().trim() === targetKey);
    return { data: filtered };
  },
  
  getNames: async () => {
    return await getNameListFromFirebase();
  }
};

console.log("✅ Stable Compatibility Firebase Data Provider loaded");
