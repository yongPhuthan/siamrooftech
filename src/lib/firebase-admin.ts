import admin from 'firebase-admin';
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore() 
export { db as adminDb };
export const auth = admin.auth();
export const storage = admin.storage();
export const messaging = admin.messaging();
export default admin;