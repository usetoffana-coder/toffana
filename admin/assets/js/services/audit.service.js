/**
 * Audit Service
 */
const AuditService = {
  collection: 'audit_logs',

  async log({ action, entity, entityId = null, userId = null, ip = null, before = null, after = null, meta = {} }) {
    try {
      const currentUser = userId || (firebase.auth().currentUser && firebase.auth().currentUser.uid) || null;
      const role = window.RbacService ? (RbacService.role || null) : null;
      await firebaseDb.collection(this.collection).add({
        action: String(action || '').slice(0, 80),
        entity: String(entity || '').slice(0, 80),
        entityId: entityId || null,
        userId: currentUser,
        role,
        ip: ip || null,
        before: before || null,
        after: after || null,
        meta: meta || {},
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.warn('Audit log falhou:', error);
    }
  }
};

window.AuditService = AuditService;
