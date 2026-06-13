import admin from 'firebase-admin';

let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;
let storage: admin.storage.Storage | null = null;
let messaging: admin.messaging.Messaging | null = null;

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (serviceAccountKey) {
  try {
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }
    db = admin.firestore();
    auth = admin.auth();
    storage = admin.storage();
    messaging = admin.messaging();
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
} else {
  console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY is not defined. Firebase Admin is disabled/fallback mode.');
}

export { db as adminDb, auth, storage, messaging };
export default admin;