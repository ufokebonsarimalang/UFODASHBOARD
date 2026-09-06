/**
 * Firebase Data Loader - UFO Dashboard (Synced with GAS Structure)
 */

async function loadDataFromFirebase(category, nama = null) {
  try {
    let path = `data/${category}`;
    return new Promise((resolve) => {
      if (typeof db === 'undefined') {
        resolve({ data: [], success: false });
        return;
      }

      const ref = db.ref(path);
      ref.once('value', (snapshot) => {
        const rawData = snapshot.val();
        if (!rawData) {
          resolve({ data: [], success: true });
          return;
        }

        // Jika fungsi meminta data spesifik berdasarkan nama
        if (nama && nama.trim()) {
          const targetKey = nama.toUpperCase().trim();
          let userRecords = [];

          if (rawData[targetKey]) {
            // Jika data tersimpan langsung berdasarkan key nama (struktur GAS)
            userRecords = rawData[targetKey];
          } else if (Array.isArray(rawData)) {
            // Jika data berupa array
            userRecords = rawData.filter(x => x && String(x.nama || x.NAMA || "").toUpperCase().trim() === targetKey);
          } else if (typeof rawData === 'object') {
            // Pencarian fleksibel dalam object
            let foundKey = Object.keys(rawData).find(k => k.toUpperCase().trim() === targetKey);
            if (foundKey) userRecords = rawData[foundKey];
          }

          if (!Array.isArray(userRecords)) {
            userRecords = userRecords ? Object.values(userRecords) : [];
          }

          // Hitung total atau atribut khusus jika absensi
          let terlambatCount = userRecords.filter(x => x && String(x.terlambat || x.TERLAMBAT || "").toUpperCase() === "YA").length;
          
          let totalUnit = 0;
          let totalOmzet = 0;
          userRecords.forEach(item => {
            if (item) {
              totalUnit += Number(item.qty || item.Qty || 0);
              totalOmzet += Number(item.omzet || item.Omzet || 0);
            }
          });

          resolve({
            nama: nama,
            tanggalPertama: userRecords[0]?.tanggal || userRecords[0]?.Tanggal || '-',
            tanggalTerakhir: userRecords[userRecords.length - 1]?.tanggal || userRecords[userRecords.length - 1]?.Tanggal || '-',
            totalUnit: totalUnit,
            totalOmzet: totalOmzet,
            terlambat: terlambatCount,
            data: userRecords,
            detail: userRecords,
            success: true
          });
        } else {
          // Jika mengambil seluruh data (untuk Admin/Perolehan)
          let allRows = [];
          if (Array.isArray(rawData)) {
            allRows = rawData.filter(Boolean);
          } else {
            Object.keys(rawData).forEach(k => {
              let val = rawData[k];
              if (Array.isArray(val)) allRows = allRows.concat(val.filter(Boolean));
              else if (val && typeof val === 'object') {
                // Jika val berisi sub-array atau objek row
                let subValues = Object.values(val);
                subValues.forEach(sub => {
                  if (sub && typeof sub === 'object') allRows.push(sub);
                });
              }
            });
          }

          // Khusus untuk perolehan rekap admin
          if (category === 'PENJUALAN') {
            let summaryMap = {};
            allRows.forEach(item => {
              let promotorName = String(item.nama || item.NAMA || "UNKNOWN").toUpperCase().trim();
              if (!summaryMap[promotorName]) {
                summaryMap[promotorName] = { nama: promotorName, omzet: 0, uc: 0 };
              }
              summaryMap[promotorName].omzet += Number(item.omzet || item.Omzet || 0);
              summaryMap[promotorName].uc += Number(item.uc || item.UC || 0);
            });
            let list = Object.values(summaryMap).sort((a, b) => b.omzet - a.omzet);
            resolve({ list: list, success: true });
          } else {
            resolve({ data: allRows, success: true });
          }
        }
      }, (error) => {
        console.error(`Firebase error loading ${path}:`, error);
        resolve({ data: [], success: false });
      });
    });
  } catch (e) {
    console.error("Firebase load error:", e);
    return { data: [], success: true };
  }
}

// Mengambil daftar nama promotor dari MASTER_SALES / struktur GAS
async function getNameListFromFirebase() {
  return new Promise((resolve) => {
    if (typeof db === 'undefined') {
      resolve([]);
      return;
    }
    
    // Cek MASTER_SALES atau fallback ke ABSENFINGER/PENJUALAN
    db.ref('data/MASTER_SALES').once('value', (snapshot) => {
      const rawData = snapshot.val();
      let names = [];

      if (rawData) {
        if (Array.isArray(rawData)) {
          names = rawData.map(x => x ? (x.nama || x.NAMA || x.Nama || "") : "").filter(Boolean);
        } else if (typeof rawData === 'object') {
          // Karena GAS melakukan grouping, key dari object adalah Nama Promotor
          names = Object.keys(rawData).filter(k => k && k !== "length" && !isFinite(k));
          if (names.length === 0) {
            names = Object.values(rawData).map(x => x && typeof x === 'object' ? (x.nama || x.NAMA || "") : "").filter(Boolean);
          }
        }
      }

      // Jika MASTER_SALES kosong, ambil dari key ABSENFINGER
      if (names.length === 0) {
        db.ref('data/ABSENFINGER').once('value', (snapAbsen) => {
          const absData = snapAbsen.val();
          if (absData && typeof absData === 'object') {
            names = Object.keys(absData).filter(k => k && k !== "length" && !isFinite(k));
          }
          resolve([...new Set(names)].map(n => String(n).toUpperCase().trim()).sort());
        }, () => resolve([]));
      } else {
        resolve([...new Set(names)].map(n => String(n).toUpperCase().trim()).sort());
      }
    }, () => {
      resolve([]);
    });
  });
}

const firebaseDataProvider = {
  getAbsensi: async (nama) => { return await loadDataFromFirebase('ABSENFINGER', nama); },
  getPenjualan: async (nama) => { return await loadDataFromFirebase('PENJUALAN', nama); },
  getUC: async (nama) => { return await loadDataFromFirebase('UC', nama); },
  getPerolehan: async () => { return await loadDataFromFirebase('PENJUALAN'); },
  getPerolehanBrand: async (nama) => { return await loadDataFromFirebase('PENJUALAN', nama); },
  getDendaLate: async (nama) => { return await loadDataFromFirebase('ABSENFINGER', nama); },
  getPromo: async () => { return await loadDataFromFirebase('PROMO'); },
  getReward: async () => { return await loadDataFromFirebase('REWARD'); },
  getRewardSaya: async (nama) => { return await loadDataFromFirebase('REWARD', nama); },
  getRules: async () => { return await loadDataFromFirebase('RULES'); },
  getPunishment: async () => { return await loadDataFromFirebase('PUNISHMENT'); },
  getPelanggaranSaya: async (nama) => { return await loadDataFromFirebase('PUNISHMENT', nama); },
  getNames: async () => { return await getNameListFromFirebase(); }
};

console.log("✅ Synced Firebase Data Provider loaded");
