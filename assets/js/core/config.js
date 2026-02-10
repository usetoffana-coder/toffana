/**
 * Public App Config
 * Keep sensitive data in server env when possible.
 */

const AppConfig = {
  firebase: {
    apiKey: "AIzaSyAZ90xAptvBeRDFl52FI7-WJJD14I6YKk4",
    authDomain: "drak-feet-admin.firebaseapp.com",
    projectId: "drak-feet-admin",
    storageBucket: "drak-feet-admin.firebasestorage.app",
    messagingSenderId: "525123704162",
    appId: "1:525123704162:web:ea0a3bc86663334a79c83b",
    measurementId: "G-EFERT7RZZ5"
  },
  app: {
    name: "Catalogo",
    version: "3.0.0",
    environment: "production"
  }
};

window.AppConfig = AppConfig;

