/**
 * Serviço de Banners
 * Gerencia banners do slider do catálogo
 */

const BannersService = {
  collection: 'banners',

  async listar() {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('ordem')
        .get();

      const banners = [];
      snapshot.forEach(doc => {
        banners.push({ id: doc.id, ...doc.data() });
      });

      console.info(`✅ ${banners.length} banners encontrados`);
      return banners;
    } catch (error) {
      console.error('❌ Erro ao listar banners:', error);
      return [];
    }
  },

  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('❌ Erro ao buscar banner:', error);
      return null;
    }
  },

  async criar(banner) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'banner', entityId: 'create' });
        }
        return { success: false, error: 'Sem permissão para criar banner' };
      }

      console.info('➕ Criando banner...');

      const novoBanner = {
        imagemUrl: banner.imagemUrl,
        titulo: DomUtils.sanitizeText(banner.titulo || '', 120),
        texto: DomUtils.sanitizeText(banner.texto || '', 300),
        linkUrl: DomUtils.sanitizeUrl(banner.linkUrl || ''),
        tipo: banner.tipo || 'slider',
        ordem: parseInt(banner.ordem) || 1,
        ativo: banner.ativo !== false,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection(this.collection).add(novoBanner);
      console.info('✅ Banner criado:', docRef.id);

      if (window.AuditService) {
        await AuditService.log({
          action: 'banner_create',
          entity: 'banner',
          entityId: docRef.id,
          before: null,
          after: novoBanner
        });
      }

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar banner:', error);
      return { success: false, error: error.message };
    }
  },

  async atualizar(id, dados) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'banner', entityId: id });
        }
        return { success: false, error: 'Sem permissão para atualizar banner' };
      }

      console.info('✏️ Atualizando banner:', id);

      const dadosAtualizados = {
        imagemUrl: dados.imagemUrl,
        titulo: DomUtils.sanitizeText(dados.titulo || '', 120),
        texto: DomUtils.sanitizeText(dados.texto || '', 300),
        linkUrl: DomUtils.sanitizeUrl(dados.linkUrl || ''),
        tipo: dados.tipo || 'slider',
        ordem: parseInt(dados.ordem) || 1,
        ativo: dados.ativo !== false,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebaseDb.collection(this.collection).doc(id).update(dadosAtualizados);
      console.info('✅ Banner atualizado');

      if (window.AuditService) {
        await AuditService.log({
          action: 'banner_update',
          entity: 'banner',
          entityId: id,
          before: null,
          after: dadosAtualizados
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar banner:', error);
      return { success: false, error: error.message };
    }
  },

  async deletar(id) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'banner', entityId: id });
        }
        return { success: false, error: 'Sem permissão para deletar banner' };
      }

      console.info('🗑️ Deletando banner:', id);
      await firebaseDb.collection(this.collection).doc(id).delete();
      console.info('✅ Banner deletado');

      if (window.AuditService) {
        await AuditService.log({
          action: 'banner_delete',
          entity: 'banner',
          entityId: id,
          before: null,
          after: null
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar banner:', error);
      return { success: false, error: error.message };
    }
  }
};

window.BannersService = BannersService;
