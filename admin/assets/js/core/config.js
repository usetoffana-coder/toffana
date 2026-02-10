/**
 * Configurações do Projeto Catalogo V3
 * IMPORTANTE: Em produção, use variáveis de ambiente
 */

const AppConfig = {
  firebase: {
  apiKey: "AIzaSyDVeC9IuQdAvog4ddXxyrUS4o5j-4xdby4",
  authDomain: "toffana-catalogo.firebaseapp.com",
  projectId: "toffana-catalogo",
  storageBucket: "toffana-catalogo.firebasestorage.app",
  messagingSenderId: "419274574420",
  appId: "1:419274574420:web:95ea11098657444909fbc1",
  measurementId: "G-PMLY4M8G5P"
  },

  cloudinary: {
   cloudName: 'djcx6aick',
    uploadPreset: 'toffana-catalogo'
  },

  appCheck: {
    siteKey: ''
  },

  session: {
    timeout: 30 * 60 * 1000,
    warningTime: 5 * 60 * 1000,
    checkInterval: 60 * 1000
  },

  security: {
    encryptionKey: "a3f9c2d8e1b47c9f2e8a0c4d9b6e1a7f3d9c2b8a4e0f7d1c9b6a8e3f2c1d",
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000
  },

  app: {
    name: "Catalogo Admin",
    version: "3.0.0",
    basePath: "/admin",
    environment: "production"
  }
};

function validateConfig() {
  if (!AppConfig.firebase.apiKey) {
    console.warn("Configure as credenciais do Firebase!");
  }

  if (AppConfig.security.encryptionKey.length < 32) {
    console.error("Chave de criptografia muito curta!");
  }
}

validateConfig();

window.AppConfig = AppConfig;


