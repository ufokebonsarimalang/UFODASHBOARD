/**
 * Firebase Data Loader - UFO Dashboard (Ultimate Robust Fix)
 */

async function loadDataFromFirebaseRaw(path) {
  return new Promise((resolve) => {
    if (typeof db === 'undefined') {
      resolve(null);
      return;
    }
    db.ref(path).once('value', (snapshot) => {
      resolve(snapshot.val());
    }, (error) => {
      console.error(`Firebase error loading ${path}:`, error);
      resolve(null);
    });
  });
}

const firebaseDataProvider = {
  getNames: async () => {
    // Coba beberapa kemungkinan path umum di Firebase Anda
    let rawData = await loadDataFromFirebaseRaw('data/MASTER_SALES');
    if (!rawData) rawData = await loadDataFromFirebaseRaw('MASTER_SALES');
    if (!rawData) rawData = await loadDataFromFirebaseRaw('data/sales');
    if (!rawData) rawData = await loadDataFromFirebaseRaw('sales');

    if (!rawData) return [];

    let names = [];
    if (Array.isArray(rawData)) {
      names = rawData.map(x => x ? (x.nama || x.NAMA || x.Nama || String(x)) : "").filter(Boolean);
    } else if (typeof rawData === 'object') {
      names = Object.values(rawData).map(x => {
        if (typeof x === 'object' && x !== null) {
          return x.nama || x.NAMA || x.Nama || "";
        }
        return String(x);
      }).filter(Boolean);

      if (names.length === 0) {
        names = Object.keys(rawData);
      }
    }

    return [...new Set(names)].sort();
  },

  getAbsensi: async (nama) => {
    let path = nama ? `data/ABSENFINGER/${nama.toUpperCase()}` : 'data/ABSENFINGER';
    let res = await loadDataFromFirebaseRaw(path);
    if (!res) res = await loadDataFromFirebaseRaw(`ABSENFINGER/${nama ? nama.toUpperCase() : ''}`);
    
    let arr = [];
    if (Array.isArray(res)) arr = res.filter(Boolean);
    else if (res && typeof res === 'object') arr = Object.values(res).filter(Boolean);

    let terlambatCount = arr.filter(x => String(x.terlambat || x.TERLAMBAT || "").toUpperCase() === "YA").length;
    return { data: arr, terlambat: terlambatCount };
  },

  getPenjualan: async (nama) => {
    let path = nama ? `data/PENJUALAN/${nama.toUpperCase()}` : 'data/PENJUALAN';
    let res = await loadDataFromFirebaseRaw(path);
    if (!res) res = await loadDataFromFirebaseRaw(`PENJUALAN/${nama ? nama.toUpperCase() : ''}`);

    let arr = [];
    if (Array.isArray(res)) arr = res.filter(Boolean);
    else if (res && typeof res === 'object') arr = Object.values(res).filter(Boolean);

    let totalUnit = 0;
    let totalOmzet = 0;
    arr.forEach(item => {
      totalUnit += Number(item.qty || item.Qty || 0);
      totalOmzet += Number(item.omzet || item.Omzet || 0);
    });

    return {
      nama: nama || "ALL",
      tanggalPertama: arr[0]?.tanggal || arr[0]?.Tanggal || '-',
      tanggalTerakhir: arr[arr.length - 1]?.tanggal || arr[arr.length - 1]?.Tanggal || '-',
      totalUnit: totalUnit,
      totalOmzet: totalOmzet,
      detail: arr
    };
  },

  getUC: async (nama) => {
    let path = nama ? `data/UC/${nama.toUpperCase()}` : 'data/UC';
    let res = await loadDataFromFirebaseRaw(path);
    if (!res) res = await loadDataFromFirebaseRaw(`UC/${nama ? nama.toUpperCase() : ''}`);

    let arr = [];
    if (Array.isArray(res)) arr = res.filter(Boolean);
    else if (res && typeof res === 'object') arr = Object.values(res).filter(Boolean);

    let totalUC = 0;
    arr.forEach(item => {
      totalUC += Number(item.uc || item.UC || item.qty || 0);
    });

    return { nama: nama, totalUC: totalUC, detail: arr };
  },

  getPerolehan: async () => {
    let rawData = await loadDataFromFirebaseRaw('data/PENJUALAN');
    if (!rawData) rawData = await loadDataFromFirebaseRaw('PENJUALAN');
    if (!rawData) return { list: [] };

    let summaryMap = {};
    let allRows = [];

    if (Array.isArray(rawData)) {
      allRows = rawData.filter(Boolean);
    } else {
      Object.keys(rawData).forEach(key => {
        let val = rawData[key];
        if (Array.isArray(val)) allRows = allRows.concat(val.filter(Boolean));
        else if (val && typeof val === 'object') {
          Object.values(val).forEach(sub => { if (sub && typeof sub === 'object') allRows.push(sub); });
        }
      });
    }

    allRows.forEach(item => {
      let nama = String(item.nama || item.NAMA || "UNKNOWN").toUpperCase().trim();
      if (!summaryMap[nama]) summaryMap[nama] = { nama: nama, omzet: 0, uc: 0 };
      summaryMap[nama].omzet += Number(item.omzet || item.Omzet || 0);
      summaryMap[nama].uc += Number(item.uc || item.UC || 0);
    });

    let list = Object.values(summaryMap).sort((a, b) => b.omzet - a.omzet);
    return { list: list };
  },

  getPerolehanBrand: async (nama) => {
    return await firebaseDataProvider.getPenjualan(nama);
  },

  getDendaLate: async () => {
    let rawAbsen = await loadDataFromFirebaseRaw('data/ABSENFINGER');
    if (!rawAbsen) rawAbsen = await loadDataFromFirebaseRaw('ABSENFINGER');
    if (!rawAbsen) return { list: [] };

    let summaryLate = {};
    let allRows = [];
    if (Array.isArray(rawAbsen)) allRows = rawAbsen.filter(Boolean);
    else {
      Object.keys(rawAbsen).forEach(key => {
        let val = rawAbsen[key];
        if (Array.isArray(val)) allRows = allRows.concat(val.filter(Boolean));
        else if (val && typeof val === 'object') {
          Object.values(val).forEach(sub => { if (sub && typeof sub === 'object') allRows.push(sub); });
        }
      });
    }

    allRows.forEach(item => {
      let namaPromotor = String(item.nama || item.NAMA || "UNKNOWN").toUpperCase().trim();
      let isLate = String(item.terlambat || item.TERLAMBAT || "").toUpperCase() === "YA";
      if (isLate) summaryLate[namaPromotor] = (summaryLate[namaPromotor] || 0) + 1;
    });

    let list = Object.keys(summaryLate).map(nama => ({ nama: nama, terlambat: summaryLate[nama] }));
    return { list: list };
  },

  getPromo: async () => {
    let res = await loadDataFromFirebaseRaw('data/PROMO');
    if (!res) res = await loadDataFromFirebaseRaw('PROMO');
    let list = Array.isArray(res) ? res : (res && typeof res === 'object' ? Object.values(res) : []);
    return { data: list.filter(Boolean) };
  },

  getReward: async () => {
    let res = await loadDataFromFirebaseRaw('data/REWARD');
    if (!res) res = await loadDataFromFirebaseRaw('REWARD');
    let list = Array.isArray(res) ? res : (res && typeof res === 'object' ? Object.values(res) : []);
    return { data: list.filter(Boolean) };
  },

  getRewardSaya: async (nama) => {
    let res = await firebaseDataProvider.getReward();
    let targetKey = nama ? nama.toUpperCase().trim() : "";
    let filtered = res.data.filter(x => String(x.nama || x.NAMA || "").toUpperCase().trim() === targetKey);
    return { data: filtered };
  },

  getRules: async () => {
    let res = await loadDataFromFirebaseRaw('data/RULES');
    if (!res) res = await loadDataFromFirebaseRaw('RULES');
    let list = Array.isArray(res) ? res : (res && typeof res === 'object' ? Object.values(res) : []);
    return { data: list.filter(Boolean) };
  },

  getPunishment: async () => {
    let res = await loadDataFromFirebaseRaw('data/PUNISHMENT');
    if (!res) res = await loadDataFromFirebaseRaw('PUNISHMENT');
    let list = Array.isArray(res) ? res : (res && typeof res === 'object' ? Object.values(res) : []);
    return { data: list.filter(Boolean) };
  },

  getPelanggaranSaya: async (nama) => {
    let res = await firebaseDataProvider.getPunishment();
    let targetKey = nama ? nama.toUpperCase().trim() : "";
    let filtered = res.data.filter(x => String(x.nama || x.NAMA || "").toUpperCase().trim() === targetKey);
    return { data: filtered };
  }
};

console.log("✅ Ultimate Robust Firebase Data Provider loaded");
