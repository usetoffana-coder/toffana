/**
 * Firebase bootstrap for public catalog
 */

const FirebaseCore = {
  init() {
    if (!window.AppConfig || !AppConfig.firebase) {
      console.error('Missing AppConfig.firebase');
      return null;
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(AppConfig.firebase);
    }

    window.firebaseDb = firebase.firestore();
    console.info('Firebase initialized');
    return window.firebaseDb;
  }
};

window.FirebaseCore = FirebaseCore;

