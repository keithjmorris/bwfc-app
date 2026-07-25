import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export async function GET() {
  try {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const app = getApps().length ? getApps()[0] : initializeApp(config);
    const db = getFirestore(app);
    const docRef = doc(db, 'player_stats', 'raw_57');
    const docSnap = await getDoc(docRef);

    return Response.json({
      projectId: config.projectId,
      docExists: docSnap.exists(),
      hasApiKey: !!config.apiKey,
    });
  } catch (err) {
    return Response.json({ error: err.message, code: err.code });
  }
}