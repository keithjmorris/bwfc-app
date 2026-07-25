import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "football-tracker-c9dae.firebaseapp.com",
  projectId: "football-tracker-c9dae",
  storageBucket: "football-tracker-c9dae.firebasestorage.app",
  messagingSenderId: "512352975737",
  appId: "YOUR_FIREBASE_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TEAMS = [57, 61, 60, 65, 66, 64, 341, 67, 73, 58, 1044, 402, 397, 1076, 354, 62, 63, 322, 349, 351, 71];

async function main() {
  console.log('Renaming stats documents from raw_{id} to raw_{id}_2025...');
  
  for (const teamId of TEAMS) {
    const oldKey = `raw_${teamId}`;
    const newKey = `raw_${teamId}_2025`;
    
    try {
      const oldDoc = await getDoc(doc(db, 'player_stats', oldKey));
      if (oldDoc.exists()) {
        await setDoc(doc(db, 'player_stats', newKey), oldDoc.data());
        await deleteDoc(doc(db, 'player_stats', oldKey));
        console.log(`✅ Renamed ${oldKey} → ${newKey}`);
      } else {
        console.log(`⏭ Skipped ${oldKey} (not found)`);
      }
    } catch (err) {
      console.error(`❌ Error with ${oldKey}:`, err.message);
    }
  }
  
  console.log('\n✅ All done!');
  process.exit(0);
}

main().catch(console.error);