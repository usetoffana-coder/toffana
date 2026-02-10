/**
 * Public App Config
 * Keep sensitive data in server env when possible.
 */

const AppConfig = {
  firebase: {
     apiKey: "AIzaSyDXhM8CntfcjNL2sH3vv7DPKDLh3y_Cc4U",
  authDomain: "toffana-catalogo-97b4d.firebaseapp.com",
  projectId: "toffana-catalogo-97b4d",
  storageBucket: "toffana-catalogo-97b4d.firebasestorage.app",
  messagingSenderId: "919713222744",
  appId: "1:919713222744:web:07cdbda97e04385cc87a2d",
  measurementId: "G-W8PKZFEZGR"
  },
  app: {
    name: "Catalogo",
    version: "3.0.0",
    environment: "production"
  }
};

window.AppConfig = AppConfig;

