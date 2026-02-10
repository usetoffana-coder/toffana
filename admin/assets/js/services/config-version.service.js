/**
 * Config Versioning Service
 */
const ConfigVersionService = {
  collection: 'config_versions',

  async criarSnapshot(configAtual, motivo = 'update') {
    try {
      const user = firebase.auth().currentUser;
      await firebaseDb.collection(this.collection).add({
        config: configAtual || {},
        motivo,
        userId: user ? user.uid : null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.warn('Erro ao criar snapshot de configuração:', error);
    }
  },

  async listar(limit = 10) {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const versions = [];
      snapshot.forEach(doc => versions.push({ id: doc.id, ...doc.data() }));
      return versions;
    } catch (error) {
      // Silencia erro de permissão para perfis sem acesso
      return [];
    }
  },

  async restaurar(versionId) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(versionId).get();
      if (!doc.exists) return { success: false, error: 'Versão não encontrada' };

      const data = doc.data();
      await firebaseDb.collection('config').doc('loja').set({
        ...(data.config || {}),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: false });

      await AuditService.log({
        action: 'config_restore',
        entity: 'config',
        entityId: 'loja',
        before: null,
        after: data.config || {},
        meta: { versionId }
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao restaurar versão:', error);
      return { success: false, error: error.message };
    }
  }
};

window.ConfigVersionService = ConfigVersionService;
