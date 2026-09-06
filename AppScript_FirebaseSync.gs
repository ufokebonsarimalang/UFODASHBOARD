/**
 * Google Apps Script: Firebase Data Sync & Import
 * Letakkan di Google Apps Script Project
 * 
 * Fungsi:
 * 1. Import data dari Google Sheet ke Firebase (one-time setup)
 * 2. Sync data setiap kali ada perubahan di Sheet
 */

// SETUP: Ganti dengan Firebase Realtime DB URL Anda
const FIREBASE_DB_URL = "https://ufodashboard-xxxxx-default-rtdb.firebaseio.com";
const FIREBASE_SECRET = "YOUR_FIREBASE_DATABASE_SECRET"; // Dari Firebase > Database Rules

// Import semua data dari Sheet ke Firebase (one-time)
function importAllSheetDataToFirebase() {
  try {
    Logger.log("🔄 Starting data import from Sheet to Firebase...");
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dataSheets = ['Absensi', 'Penjualan', 'UC', 'Perolehan', 'DendaLate', 'Promo', 'Reward', 'Rules', 'Punishment'];
    
    for(let sheetName of dataSheets) {
      try {
        const sheet = ss.getSheetByName(sheetName);
        if(!sheet) {
          Logger.log(`⚠️  Sheet "${sheetName}" not found, skipping...`);
          continue;
        }
        
        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        const rows = data.slice(1);
        
        // Convert rows to objects
        const dataArray = rows.map(row => {
          const obj = {};
          headers.forEach((header, idx) => {
            obj[header.trim()] = row[idx] || '';
          });
          return obj;
        }).filter(obj => Object.values(obj).some(v => v !== ''));
        
        // Group by nama jika ada kolom nama
        let firebaseData = {};
        const hasNamaColumn = headers.some(h => h.toLowerCase() === 'nama');
        
        if(hasNamaColumn) {
          // Group by nama
          dataArray.forEach(item => {
            const nama = item.nama ? item.nama.toUpperCase().trim() : 'UNKNOWN';
            if(!firebaseData[nama]) firebaseData[nama] = [];
            firebaseData[nama].push(item);
          });
        } else {
          // Array langsung
          firebaseData = dataArray;
        }
        
        // Push ke Firebase
        const success = pushToFirebase(`data/${sheetName}`, firebaseData);
        
        if(success) {
          Logger.log(`✅ Imported: ${sheetName} (${Object.keys(firebaseData).length} records/groups)`);
        } else {
          Logger.log(`❌ Failed to import: ${sheetName}`);
        }
      } catch(e) {
        Logger.log(`❌ Error importing ${sheetName}: ${e.message}`);
      }
    }
    
    Logger.log("✅ Import process completed!");
    
  } catch(e) {
    Logger.log(`❌ Critical error: ${e.message}`);
  }
}

// Push data ke Firebase
function pushToFirebase(path, data) {
  try {
    const url = `${FIREBASE_DB_URL}/${path}.json?auth=${FIREBASE_SECRET}`;
    
    const options = {
      method: 'put',
      contentType: 'application/json',
      payload: JSON.stringify(data),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    return response.getResponseCode() === 200;
  } catch(e) {
    Logger.log(`Firebase push error: ${e.message}`);
    return false;
  }
}

// Get data dari Firebase
function getFromFirebase(path) {
  try {
    const url = `${FIREBASE_DB_URL}/${path}.json?auth=${FIREBASE_SECRET}`;
    
    const options = {
      method: 'get',
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
  } catch(e) {
    Logger.log(`Firebase get error: ${e.message}`);
    return null;
  }
}

// Test Firebase Connection
function testFirebaseConnection() {
  try {
    const result = getFromFirebase('data/absensi');
    if(result) {
      Logger.log("✅ Firebase connection OK");
      Logger.log(`Found ${Object.keys(result).length} records`);
    } else {
      Logger.log("❌ Firebase connection failed");
    }
  } catch(e) {
    Logger.log(`❌ Test error: ${e.message}`);
  }
}