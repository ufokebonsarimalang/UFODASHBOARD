/**
 * Firebase Data Loader - UFO Dashboard (Clean & Stable)
 */

async function loadDataFromFirebase(category) {
  try {
    const path = `data/${category}`;
    return new Promise((resolve) => {
      if (typeof db === 'undefined') {
        resolve(null);
        return;
      }
      const ref = db.ref(path);
      ref.once('value', (snapshot) => {
        resolve(snapshot.val());
      }, (error) => {
        console.error(`Firebase error loading ${path}:`, error);
        resolve(null);
      });
    });
  } catch (e) {
    console.error("Firebase load error:", e);
    return null;
  }
}

const firebaseDataProvider = {
  // 1. ABSENSI & LATE
  getAbsensi: async (nama) => {
    const rawData = await loadDataFromFirebase('ABSENFINGER');
    if (!rawData) return { data: [], terlambat: 0 };
    
    let userRecords = [];
    let targetKey = nama ? nama.toUpperCase().trim() : "";
    
    if (rawData[targetKey]) {
      userRecords = rawData[targetKey];
    } else if (Array.isArray(rawData)) {
      userRecords = rawData.filter(x => x && String(x.nama || x.NAMA || "").toUpperCase().trim() === targetKey);
    } else if (typeof rawData === 'object') {
      let foundKey = Object.keys(rawData).find(k => k.toUpperCase().trim() === targetKey);
      if (foundKey) userRecords = rawData[foundKey];
    }

    if (!Array.isArray(userRecords)) {
      userRecords = Object.values(userRecords);
    }

    let terlambatCount = userRecords.filter(x => x && String(x.terlambat || x.TERLAMBAT || "").toUpperCase() === "YA").length;
    return { data: userRecords, terlambat: terlambatCount };
  },
  
  // 2. PENJUALAN
  getPenjualan: async (nama) => {
    const rawData = await loadDataFromFirebase('PENJUALAN');
    if (!rawData) return { data: [], totalUnit: 0, totalOmzet: 0 };

    let userRecords = [];
    let targetKey = nama ? nama.toUpperCase().trim() : "";

    if (rawData[targetKey]) {
      userRecords = rawData[targetKey];
    } else if (Array.isArray(rawData)) {
      userRecords = rawData.filter(x => x && String(x.nama || x.NAMA || "").toUpperCase().trim() === targetKey);
    } else if (typeof rawData === 'object') {
      let foundKey = Object.keys(rawData).find(k => k.toUpperCase().trim() === targetKey);
      if (foundKey) userRecords = rawData[foundKey];
    }

    if (!Array.isArray(userRecords)) {
      userRecords = Object.values(userRecords);
    }

    let totalUnit = 0;
    let totalOmzet = 0;
    let tglPertama = "-";
    let tglTerakhir = "-";

    if (userRecords.length > 0) {
      tglPertama = userRecords[0].tanggal || userRecords[0].Tanggal || "-";
      tglTerakhir = userRecords[userRecords.length - 1].tanggal || userRecords[userRecords.length - 1].Tanggal || "-";
      
      userRecords.forEach(item => {
        if (item) {
          totalUnit += Number(item.qty || item.Qty || 0);
          totalOmzet += Number(item.omzet || item.Omzet || 0);
        }
      });
    }

    return {
      nama: nama,
      tanggalPertama: tglPertama,
      tanggalTerakhir: tglTerakhir,
      totalUnit: totalUnit,
      totalOmzet: totalOmzet,
      detail: userRecords
    };
  },
  
  // 3. UC
  getUC: async (nama) => {
    const rawData = await loadDataFromFirebase('UC');
    if (!rawData) return { data: [], totalUC: 0 };

    let userRecords = [];
    let targetKey = nama ? nama.toUpperCase().trim() : "";

    if (rawData[targetKey]) {
      userRecords = rawData[targetKey];
    } else if (Array.isArray(rawData)) {
      userRecords = rawData.filter(x => x && String(x.nama || x.NAMA || "").toUpperCase().trim() === targetKey);
    } else if (typeof rawData === 'object') {
      let foundKey = Object.keys(rawData).find(k => k.toUpperCase().trim() === targetKey);
      if (foundKey) userRecords = rawData[foundKey];
    }

    if (!Array.isArray(userRecords)) {
      userRecords = Object.values(userRecords);
    }

    let totalUC = 0;
    userRecords.forEach(item => {
      if (item) {
        totalUC += Number(item.uc || item.UC || item.qty || 0);
      }
    });

    return {
      nama: nama,
      totalUC: totalUC,
      detail: userRecords
    };
  },
  
  // 4. PEROLEHAN KESELURUHAN (ADMIN)
  getPerolehan: async () => {
    const rawData = await loadDataFromFirebase('PENJUALAN');
    if (!rawData) return { list: [] };

    let summaryMap = {};
    let allRows = [];

    if (Array.isArray(rawData)) {
      allRows = rawData.filter(Boolean);
    } else {
      Object.keys(rawData).forEach(namaKey => {
        let val = rawData[namaKey];
        if (Array.isArray(val)) {
          allRows = allRows.concat(val.filter(Boolean));
        } else if (val && typeof val === 'object') {
          allRows = allRows.concat(Object.values(val).filter(Boolean));
        }
      });
    }

    allRows.forEach(item => {
      if (item) {
        let nama = String(item.nama || item.NAMA || "UNKNOWN").toUpperCase().trim();
        if (!summaryMap[nama]) {
          summaryMap[nama] = { nama: nama, omzet: 0, uc: 0 };
        }
        summaryMap[nama].omzet += Number(item.omzet || item.Omzet || 0);
        summaryMap[nama].uc += Number(item.uc || item.UC || 0);
      }
    });

    let list = Object.values(summaryMap).sort((a, b) => b.omzet - a.omzet);
    return { list: list };
  },
  
  // 5. PEROLEHAN BRAND SAYA
  getPerolehanBrand: async (nama) => {
    const resJual = await firebaseDataProvider.getPenjualan(nama);
    return {
      nama: nama,
      totalUnit: resJual.totalUnit,
      totalOmzet: resJual.totalOmzet,
      detail: resJual.detail
    };
  },
  
  // 6. DENDA & LATE
  getDendaLate: async () => {
    const rawAbsen = await loadDataFromFirebase('ABSENFINGER');
    if (!rawAbsen) return { list: [] };

    let summaryLate = {};
    let allRows = [];

    if (Array.isArray(rawAbsen)) {
      allRows = rawAbsen.filter(Boolean);
    } else {
      Object.keys(rawAbsen).forEach(namaKey => {
        let val = rawAbsen[namaKey];
        if (Array.isArray(val)) {
          allRows = allRows.concat(val.filter(Boolean));
        } else if (val && typeof val === 'object') {
          allRows = allRows.concat(Object.values(val).filter(Boolean));
        }
      });
    }

    allRows.forEach(item => {
      if (item) {
        let namaPromotor = String(item.nama || item.NAMA || "UNKNOWN").toUpperCase().trim();
        let isLate = String(item.terlambat || item.TERLAMBAT || "").toUpperCase() === "YA";
        if (isLate) {
          summaryLate[namaPromotor] = (summaryLate[namaPromotor] || 0) + 1;
        }
      }
    });

    let list = Object.keys(summaryLate).map(nama => ({
      nama: nama,
      terlambat: summaryLate[nama]
    }));

    return { list: list };
  },
  
  // 7. PROMO
  getPromo: async () => {
    const rawData = await loadDataFromFirebase('PROMO');
    let list = Array.isArray(rawData) ? rawData.filter(Boolean) : (rawData ? Object.values(rawData).filter(Boolean) : []);
    return { data: list };
  },
  
  // 8. REWARD
  getReward: async () => {
    const rawData = await loadDataFromFirebase('REWARD');
    let list = Array.isArray(rawData) ? rawData.filter(Boolean) : (rawData ? Object.values(rawData).filter(Boolean) : []);
    return { data: list };
  },
  
  // 9. REWARD SAYA
  getRewardSaya: async (nama) => {
    const rawData = await loadDataFromFirebase('REWARD');
    let list = Array.isArray(rawData) ? rawData.filter(Boolean) : (rawData ? Object.values(rawData).filter(Boolean) : []);
    let targetKey = nama ? nama.toUpperCase().trim() : "";
    let filtered = list.filter(x => x && String(x.nama || x.NAMA || "").toUpperCase().trim() === targetKey);
    return { data: filtered };
  },
  
  // 10. RULES / SOP
  getRules: async () => {
    const rawData = await loadDataFromFirebase('RULES');
    let list = Array.isArray(rawData) ? rawData.filter(Boolean) : (rawData ? Object.values(rawData).filter(Boolean) : []);
    return { data: list };
  },
  
  // 11. PUNISHMENT
  getPunishment: async () => {
    const rawData = await loadDataFromFirebase('PUNISHMENT');
    let list = Array.isArray(rawData) ? rawData.filter(Boolean) : (rawData ? Object.values(rawData).filter(Boolean) : []);
    return { data: list };
  },
  
  // 12. PELANGGARAN SAYA
  getPelanggaranSaya: async (nama) => {
    const rawData = await loadDataFromFirebase('PUNISHMENT');
    let list = Array.isArray(rawData) ? rawData.filter(Boolean) : (rawData ? Object.values(rawData).filter(Boolean) : []);
    let targetKey = nama ? nama.toUpperCase().trim() : "";
    let filtered = list.filter(x => x && String(x.nama || x.NAMA || "").toUpperCase().trim() === targetKey);
    return { data: filtered };
  },
  
  // 13. GET NAMES (DROPDOWN MASTER_SALES)
  getNames: async () => {
    const rawData = await loadDataFromFirebase('MASTER_SALES');
    if (!rawData) return [];
    
    let names = [];
    if (Array.isArray(rawData)) {
      names = rawData.map(x => x ? (x.nama || x.NAMA || x.Nama || "") : "").filter(Boolean);
    } else if (typeof rawData === 'object') {
      names = Object.keys(rawData).map(k => {
        let item = rawData[k];
        if (typeof item === 'object' && item !== null) {
          return item.nama || item.NAMA || item.Nama || k;
        }
        return k;
      });
    }
    
    return [...new Set(names)].sort();
  }
};

console.log("✅ Clean & Stable Firebase Data Provider loaded");
