/**
 * Auth Guard - Proteção de Rotas + RBAC
 */

const AuthGuard = {
  publicPages: ['/admin/login.html'],

  async init() {
    if (typeof AuthService === 'undefined') {
      console.error('AuthService não está disponível');
      return;
    }

    const currentPath = window.location.pathname;
    const isPublicPage = this.publicPages.some(page =>
      currentPath === page || currentPath.endsWith(page) || currentPath.includes('login.html')
    );

    if (isPublicPage) {
      await this.checkIfAlreadyLoggedIn();
      return;
    }

    const user = await AuthService.getCurrentUser();
    if (!user) {
      this.redirectToLogin();
      return;
    }

    try {
      await user.getIdTokenResult(true);
    } catch (e) {
      console.warn('Falha ao revalidar token:', e);
      this.redirectToLogin();
      return;
    }

    if (window.RbacService) {
      await RbacService.loadRole();
      RbacService.applyVisibility();

      const requiredPermission = document.body?.dataset?.permission || null;
      if (requiredPermission && !RbacService.has(requiredPermission)) {
        if (window.AuditService) {
          await AuditService.log({
            action: 'access_denied',
            entity: 'page',
            entityId: window.location.pathname,
            userId: user.uid,
            meta: { permission: requiredPermission }
          });
        }
        this.redirectToHome();
        return;
      }
    }

    this.setupLogoutButton();
  },

  async checkIfAlreadyLoggedIn() {
    const user = await AuthService.getCurrentUser();
    if (user) {
      const basePath = (window.AppConfig && AppConfig.app && AppConfig.app.basePath) || '/admin';
      window.location.href = `${basePath}/index.html`;
    }
  },

  redirectToLogin() {
    const currentPath = window.location.pathname;
    const basePath = (window.AppConfig && AppConfig.app && AppConfig.app.basePath) || '/admin';
    window.location.href =
      `${basePath}/login.html?redirect=${encodeURIComponent(currentPath)}`;
  },

  redirectToHome() {
    const basePath = (window.AppConfig && AppConfig.app && AppConfig.app.basePath) || '/admin';
    const currentPath = window.location.pathname;
    const target = `${basePath}/index.html`;
    const onHome = currentPath === target || currentPath.endsWith('/admin/index.html') || currentPath.endsWith('/index.html');

    if (onHome) {
      window.location.href = `${basePath}/login.html?reason=permission_denied`;
      return;
    }

    window.location.href = `${target}?reason=permission_denied`;
  },

  setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      AuthService.logout();
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AuthGuard.init().catch(error => {
    console.error('Erro no AuthGuard:', error);
  });
});


