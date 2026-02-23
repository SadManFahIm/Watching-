import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import config from '@/config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

export const initializeFirebase = (): void => {
  if (!app) {
    app = initializeApp(config.firebase);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
};

export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
};

export const getFirebaseDb = (): Firestore => {
  if (!db) {
    initializeFirebase();
  }
  return db;
};

export const getFirebaseStorage = (): FirebaseStorage => {
  if (!storage) {
    initializeFirebase();
  }
  return storage;
};

export { app, auth, db, storage };
