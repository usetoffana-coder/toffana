/**
 * Configuração do Firebase
 */

const firebaseConfig = (typeof AppConfig !== 'undefined' && AppConfig.firebase)
  ? AppConfig.firebase
  : null;

let app;
let auth;
let db;
let appCheck;

try {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error('Configuração do Firebase ausente ou inválida');
  }
  app = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();

  if (window.AppConfig && AppConfig.appCheck && AppConfig.appCheck.siteKey) {
    appCheck = firebase.appCheck();
    appCheck.activate(AppConfig.appCheck.siteKey, true);
  }

  console.info('Firebase inicializado com sucesso');
} catch (error) {
  console.error('Erro ao inicializar Firebase:', error.message);
}

window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseAppCheck = appCheck;
