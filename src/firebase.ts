import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics'
import { getApps, initializeApp } from 'firebase/app'
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCbzU5o-Gy8LOjnRVJ1LMFB7PF6dY_haQc',
  authDomain: 'e-slam-book-9006c.firebaseapp.com',
  projectId: 'e-slam-book-9006c',
  storageBucket: 'e-slam-book-9006c.firebasestorage.app',
  messagingSenderId: '950573952951',
  appId: '1:950573952951:web:2fae3a71927aaa79988232',
  measurementId: 'G-2DK29KN688',
}

export const app = getApps()[0] ?? initializeApp(firebaseConfig)

function createDb() {
  try {
    return initializeFirestore(app, { localCache: persistentLocalCache() })
  } catch {
    return getFirestore(app)
  }
}

export const db = createDb()

let analytics: Analytics | null = null

void isSupported()
  .then((supported) => {
    if (supported) analytics = getAnalytics(app)
  })
  .catch(() => {
    analytics = null
  })

export function track(name: string) {
  if (!analytics) return
  logEvent(analytics, name)
}
