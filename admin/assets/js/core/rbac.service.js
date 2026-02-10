/**
 * RBAC Service
 */
const RbacService = {
  role: null,
  permissions: {
    admin: ['*'],
    editor: ['dashboard.read', 'produtos.read', 'produtos.write', 'config.read', 'config.write'],
    analista: ['dashboard.read', 'metricas.read', 'config.read', 'audit.read']
  },

  normalizeRole(role) {
    if (!role) return null;
    const normalized = String(role).trim().toLowerCase();
    if (!normalized) return null;
    if (['administrator', 'administrador', 'adm', 'superadmin', 'super-admin', 'root'].includes(normalized)) {
      return 'admin';
    }
    if (normalized === 'analyst') return 'analista';
    return normalized;
  },

  async loadRole() {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) return null;
      const token = await user.getIdTokenResult(true);
      const claimRole = token && token.claims ? token.claims.role : null;
      if (claimRole) {
        this.role = this.normalizeRole(claimRole);
        return this.role;
      }

      if (window.UsersService) {
        await UsersService.ensureProfile(user);
        const profile = await UsersService.getProfile(user.uid);
        if (profile && profile.role) {
          this.role = this.normalizeRole(profile.role);
          return this.role;
        }
      }
      
      if (typeof firebaseDb !== 'undefined') {
        try {
          const doc = await firebaseDb.collection('usuarios').doc(user.uid).get();
          if (doc.exists) {
            const data = doc.data();
            if (data && data.role) {
              this.role = this.normalizeRole(data.role);
              return this.role;
            }
          }
          if (user.email) {
            const snapshot = await firebaseDb
              .collection('usuarios')
              .where('email', '==', user.email)
              .limit(1)
              .get();
            if (!snapshot.empty) {
              const data = snapshot.docs[0].data();
              if (data && data.role) {
                this.role = this.normalizeRole(data.role);
                return this.role;
              }
            }
          }
        } catch (e) {
          console.warn('RBAC: falha ao buscar role no Firestore', e);
        }
      }
    } catch (error) {
      console.warn('RBAC: erro ao carregar role', error);
    }
    this.role = null;
    return null;
  },

  has(permission) {
    if (!permission) return true;
    if (!this.role) return false;
    const rolePerms = this.permissions[this.role] || [];
    if (rolePerms.includes('*')) return true;
    return rolePerms.includes(permission);
  },

  applyVisibility(root = document) {
    if (!this.role) return;
    const nodes = root.querySelectorAll('[data-permission]');
    nodes.forEach(node => {
      const perm = node.getAttribute('data-permission');
      if (!this.has(perm)) {
        node.style.display = 'none';
      }
    });
  }
};

window.RbacService = RbacService;
