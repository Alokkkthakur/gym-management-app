const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function exportCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const data = {};
  snapshot.forEach(doc => {
    data[doc.id] = doc.data();
  });
  return data;
}

async function exportAll() {
  const collections = await db.listCollections();
  const allData = {};

  for (const collection of collections) {
    console.log(`Exporting: ${collection.id}...`);
    allData[collection.id] = await exportCollection(collection.id);
  }

  fs.writeFileSync('firestore_export.json', JSON.stringify(allData, null, 2));
  console.log('✅ Export complete! File: firestore_export.json');
  process.exit(0);
}

exportAll().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});