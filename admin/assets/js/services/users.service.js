/**
 * Users Service (Admin)
 */
const UsersService = {
  collection: 'usuarios',

  async getProfile(uid) {
    if (!uid) return null;
    try {
      const doc = await firebaseDb.collection(this.collection).doc(uid).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  },

  async ensureProfile(user) {
    if (!user) return;
    try {
      const ref = firebaseDb.collection(this.collection).doc(user.uid);
      const doc = await ref.get();
      if (!doc.exists) {
        let base = {
          email: user.email || '',
          role: 'editor',
          ativo: true,
          displayName: user.displayName || ''
        };

        if (user.email) {
          const snap = await firebaseDb
            .collection(this.collection)
            .where('email', '==', user.email)
            .limit(1)
            .get();
          if (!snap.empty) {
            const existing = snap.docs[0];
            const data = existing.data() || {};
            base = {
              email: user.email || data.email || '',
              role: data.role || base.role,
              ativo: typeof data.ativo === 'boolean' ? data.ativo : base.ativo,
              displayName: data.displayName || base.displayName || ''
            };
            if (existing.id !== user.uid) {
              await firebaseDb.collection(this.collection).doc(existing.id).delete();
            }
          }
        }

        await ref.set({
          ...base,
          criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
          atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.warn('Não foi possível garantir perfil:', error);
    }
  },

  async listar() {
    try {
      const snapshot = await firebaseDb.collection(this.collection).orderBy('email').get();
      const users = [];
      snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
      return users;
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return [];
    }
  },

  async atualizarRole(userId, role) {
    try {
      await firebaseDb.collection(this.collection).doc(userId).set({
        role,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      return { success: false, error: error.message };
    }
  },

  async atualizarAtivo(userId, ativo) {
    try {
      await firebaseDb.collection(this.collection).doc(userId).set({
        ativo: !!ativo,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return { success: false, error: error.message };
    }
  },

  async criar({ email, role = 'editor', ativo = true, displayName = '' }) {
    try {
      if (window.RbacService && !RbacService.has('admin.users')) {
        return { success: false, error: 'Sem permissão para cadastrar usuários' };
      }

      const emailClean = String(email || '').trim().toLowerCase();
      if (!emailClean) {
        return { success: false, error: 'Email é obrigatório' };
      }

      const allowedRoles = ['admin', 'editor', 'analista'];
      const roleClean = allowedRoles.includes(role) ? role : 'editor';

      const docRef = firebaseDb.collection(this.collection).doc(emailClean);
      const snapshot = await docRef.get();
      if (snapshot.exists) {
        return { success: false, error: 'Usuário já cadastrado' };
      }

      await docRef.set({
        email: emailClean,
        role: roleClean,
        ativo: !!ativo,
        displayName: String(displayName || '').trim(),
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return { success: true };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return { success: false, error: error.message };
    }
  }
};

window.UsersService = UsersService;
