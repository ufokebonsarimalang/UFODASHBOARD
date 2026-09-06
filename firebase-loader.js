/**
 * Firebase Data Loader - UFO Dashboard (Fixed Final Bridge)
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
          resolve({ data: [], detail: [], success: true });
          return;
        }

        // Jika user memilih nama spesifik (Mode Mandiri / Filter Admin)
        if (nama && nama.trim()) {
          const targetKey = nama.toUpperCase().trim();
          let userRecords = [];

          // 1. Cek apakah data dikelompokkan berdasarkan key Nama langsung (Struktur GAS)
          if (rawData[targetKey] && Array.isArray(rawData[targetKey])) {
            userRecords = rawData[targetKey];
          } 
          // 2. Cek jika data berupa Array murni
          else if (Array.isArray(rawData)) {
            userRecords = rawData.filter(x => x && String(x.nama || x.NAMA || "").toUpperCase().trim() === targetKey);
          } 
          // 3. Pencarian fleksibel dalam Objek
          else if (typeof rawData === 'object') {
            let foundKey = Object.keys(rawData).find(k => k.toUpperCase().trim() === targetKey);
            if (foundKey && Array.isArray(rawData[foundKey])) {
              userRecords = rawData[foundKey];
            } else {
              // Cari manual di dalam semua isi objek
              Object.values(rawData).forEach(val => {
                if (Array.isArray(val)) {
                  let match = val.filter(x => x && String(x.nama || x.NAMA || "").toUpperCase().trim() === targetKey);
                  userRecords = userRecords.concat(match);
                }
              });
            }
          }

          // Hitung statistik ringkasan pendukung
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
            data: userRecords,     // Sangat penting untuk render absensi
            detail: userRecords,   // Sangat penting untuk render penjualan
            success: true
          });
        } 
        // Jika mode Global / Admin (Tanpa filter nama spesifik)
        else {
          let allRows = [];
          if (Array.isArray(rawData)) {
            allRows = rawData.filter(Boolean);
          } else if (typeof rawData === 'object') {
            Object.keys(rawData).forEach(k => {
              let val = rawData[k];
              if (Array.isArray(val)) {
                allRows = allRows.concat(val.filter(Boolean));
              } else if (val && typeof val === 'object') {
                Object.values(val).forEach(sub => {
                  if (sub && typeof sub === 'object') allRows.push(sub);
                });
              }
            });
          }

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
            resolve({ list: list, data: allRows, success: true });
          } else {
            resolve({ data: allRows, success: true });
          }
        }
      }, (error) => {
        console.error(`Firebase error loading ${path}:`, error);
        resolve({ data: [], detail: [], success: false });
      });
    });
  } catch (e) {
    console.error("Firebase load error:", e);
    return { data: [], detail: [], success: true };
  }
}

async function getNameListFromFirebase() {
  return new Promise((resolve) => {
    if (typeof db === 'undefined') {
      resolve([]);
      return;
    }
    
    db.ref('data/MASTER_SALES').once('value', (snapshot) => {
      const rawData = snapshot.val();
      let names = [];

      if (rawData) {
        if (Array.isArray(rawData)) {
          names = rawData.map(x => x ? (x.nama || x.NAMA || x.Nama || "") : "").filter(Boolean);
        } else if (typeof rawData === 'object') {
          names = Object.keys(rawData).filter(k => k && k !== "length" && !isFinite(k));
          if (names.length === 0) {
            names = Object.values(rawData).map(x => x && typeof x === 'object' ? (x.nama || x.NAMA || "") : "").filter(Boolean);
          }
        }
      }

      // Fallback jika MASTER_SALES kosong
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

console.log("✅ Fixed Firebase Data Provider loaded");
