/**
 * AuthService - Serviço de Autenticação
 * Gerencia login, logout e estado de autenticação
 */

const AuthService = {
  loginAttempts: {},
  securityConfig: {
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000
  },

  async login(email, password) {
    try {
      if (this.isAccountLocked(email)) {
        const remainingTime = this.getRemainingLockTime(email);
        await this.logAuditEvent('login_lockout', null, { email });
        return {
          success: false,
          error: `Conta bloqueada temporariamente. Tente novamente em ${Math.ceil(remainingTime / 60000)} minutos.`
        };
      }

      if (window.RateLimiter && !RateLimiter.allowBucket(`login:${email}`, 5, 1 / 120)) {
        await this.logAuditEvent('login_rate_limited', null, { email });
        return {
          success: false,
          error: 'Muitas tentativas. Aguarde alguns minutos.'
        };
      }

      const result = await firebase
        .auth()
        .signInWithEmailAndPassword(email, password);

      this.clearLoginAttempts(email);

      if (window.UsersService) {
        await UsersService.ensureProfile(result.user);
        const profile = await UsersService.getProfile(result.user.uid);
        if (profile && profile.ativo === false) {
          await firebase.auth().signOut();
          return {
            success: false,
            error: 'Usuário desativado. Contate o administrador.'
          };
        }
      }

      await this.logAuditEvent('login', result.user.uid);

      return {
        success: true,
        user: result.user
      };

    } catch (error) {
      this.registerFailedAttempt(email);
      await this.logAuditEvent('login_failed', null, { email });

      let message = 'Erro ao fazer login';

      switch (error.code) {
        case 'auth/user-not-found':
          message = 'Usuário não encontrado';
          break;
        case 'auth/wrong-password':
          message = 'Senha incorreta';
          break;
        case 'auth/invalid-email':
          message = 'Email inválido';
          break;
        case 'auth/too-many-requests':
          message = 'Muitas tentativas. Tente novamente mais tarde';
          break;
        case 'auth/network-request-failed':
          message = 'Erro de conexão. Verifique sua internet';
          break;
        case 'auth/invalid-credential':
          message = 'Credenciais inválidas';
          break;
        default:
          message = error.message || 'Erro desconhecido';
      }

      return {
        success: false,
        error: message
      };
    }
  },

  getCurrentUser() {
    return new Promise((resolve) => {
      const unsubscribe = firebase.auth().onAuthStateChanged(user => {
        unsubscribe();
        resolve(user || null);
      });
    });
  },

  async isAuthenticated() {
    const user = await this.getCurrentUser();
    return user !== null;
  },

  async logout() {
    try {
      const user = await this.getCurrentUser();
      if (user) {
        await this.logAuditEvent('logout', user.uid);
      }

      await firebase.auth().signOut();
      this.clearLocalData();

      const basePath = (window.AppConfig && AppConfig.app && AppConfig.app.basePath) || '/admin';
      window.location.href = `${basePath}/login.html`;

    } catch (error) {
      const basePath = (window.AppConfig && AppConfig.app && AppConfig.app.basePath) || '/admin';
      window.location.href = `${basePath}/login.html`;
    }
  },

  registerFailedAttempt(email) {
    if (!this.loginAttempts[email]) {
      this.loginAttempts[email] = {
        count: 0,
        lastAttempt: Date.now()
      };
    }

    this.loginAttempts[email].count++;
    this.loginAttempts[email].lastAttempt = Date.now();

    try {
      localStorage.setItem('loginAttempts', JSON.stringify(this.loginAttempts));
    } catch (e) {
      // ignore
    }
  },

  clearLoginAttempts(email) {
    delete this.loginAttempts[email];
    try {
      localStorage.setItem('loginAttempts', JSON.stringify(this.loginAttempts));
    } catch (e) {
      // ignore
    }
  },

  isAccountLocked(email) {
    const attempts = this.loginAttempts[email];
    if (!attempts) return false;

    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    if (timeSinceLastAttempt > this.securityConfig.lockoutDuration) {
      this.clearLoginAttempts(email);
      return false;
    }

    return attempts.count >= this.securityConfig.maxAttempts;
  },

  getRemainingLockTime(email) {
    const attempts = this.loginAttempts[email];
    if (!attempts) return 0;

    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    const remaining = this.securityConfig.lockoutDuration - timeSinceLastAttempt;

    return remaining > 0 ? remaining : 0;
  },

  clearLocalData() {
    try {
      const loginAttempts = localStorage.getItem('loginAttempts');
      const theme = localStorage.getItem('theme');

      localStorage.clear();
      sessionStorage.clear();

      if (loginAttempts) {
        localStorage.setItem('loginAttempts', loginAttempts);
      }
      if (theme) {
        localStorage.setItem('theme', theme);
      }
    } catch (e) {
      // ignore
    }
  },

  async logAuditEvent(tipo, userId, meta = {}) {
    if (window.AuditService) {
      await AuditService.log({
        action: tipo,
        entity: 'auth',
        entityId: userId || null,
        userId: userId || null,
        meta
      });
      return;
    }

    try {
      await firebaseDb.collection('audit_logs').add({
        tipo,
        userId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent,
        ip: null
      });
    } catch (error) {
      // ignore
    }
  },

  async resetPassword(email) {
    try {
      await firebase.auth().sendPasswordResetEmail(email);

      return {
        success: true,
        message: 'Email de recuperação enviado com sucesso!'
      };
    } catch (error) {
      let message = 'Erro ao enviar email de recuperação';

      switch (error.code) {
        case 'auth/user-not-found':
          message = 'Email não encontrado';
          break;
        case 'auth/invalid-email':
          message = 'Email inválido';
          break;
        default:
          message = error.message;
      }

      return {
        success: false,
        error: message
      };
    }
  },

  async updateProfile(data) {
    try {
      const user = firebase.auth().currentUser;

      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado'
        };
      }

      await user.updateProfile(data);

      return {
        success: true,
        message: 'Perfil atualizado com sucesso!'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  async updateEmail(newEmail) {
    try {
      const user = firebase.auth().currentUser;

      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado'
        };
      }

      await user.updateEmail(newEmail);

      return {
        success: true,
        message: 'Email atualizado com sucesso!'
      };
    } catch (error) {
      let message = 'Erro ao atualizar email';

      if (error.code === 'auth/requires-recent-login') {
        message = 'Faça login novamente para atualizar o email';
      }

      return {
        success: false,
        error: message
      };
    }
  },

  async updatePassword(newPassword) {
    try {
      const user = firebase.auth().currentUser;

      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado'
        };
      }

      await user.updatePassword(newPassword);

      return {
        success: true,
        message: 'Senha atualizada com sucesso!'
      };
    } catch (error) {
      let message = 'Erro ao atualizar senha';

      if (error.code === 'auth/requires-recent-login') {
        message = 'Faça login novamente para atualizar a senha';
      } else if (error.code === 'auth/weak-password') {
        message = 'Senha muito fraca. Use no mínimo 6 caracteres';
      }

      return {
        success: false,
        error: message
      };
    }
  },

  async reauthenticate(password) {
    try {
      const user = firebase.auth().currentUser;
      if (!user || !user.email) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
      await user.reauthenticateWithCredential(credential);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Falha na reautenticação' };
    }
  },

  getSafeRedirect(redirectParam) {
    const basePath = (window.AppConfig && AppConfig.app && AppConfig.app.basePath) || '/admin';
    const defaultPath = `${basePath}/index.html`;

    if (!redirectParam) return defaultPath;

    let candidate = String(redirectParam).trim();
    if (!candidate) return defaultPath;

    if (!candidate.startsWith('/')) {
      candidate = `${basePath}/${candidate}`.replace(/\/+/g, '/');
    }

    try {
      const url = new URL(candidate, window.location.origin);
      if (url.origin !== window.location.origin) return defaultPath;
      if (!url.pathname.startsWith(basePath)) return defaultPath;
      return `${url.pathname}${url.search}${url.hash}`;
    } catch (e) {
      return defaultPath;
    }
  },

  init() {
    try {
      const stored = localStorage.getItem('loginAttempts');
      if (stored) {
        this.loginAttempts = JSON.parse(stored);
      }
    } catch (e) {
      // ignore
    }

    if (window.AppConfig && AppConfig.security) {
      this.securityConfig.maxAttempts = AppConfig.security.maxLoginAttempts || this.securityConfig.maxAttempts;
      this.securityConfig.lockoutDuration = AppConfig.security.lockoutDuration || this.securityConfig.lockoutDuration;
    }
  }
};

AuthService.init();
window.AuthService = AuthService;


