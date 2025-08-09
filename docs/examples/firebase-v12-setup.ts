// Example: Firebase v12 setup with Next.js 15
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Your config
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Example Firestore query with v12
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export async function getPortfolioItems() {
  const q = query(
    collection(db, 'portfolio'),
    where('isPublished', '==', true),
    orderBy('completedDate', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
