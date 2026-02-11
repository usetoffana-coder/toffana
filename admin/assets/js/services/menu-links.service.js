/**
 * Serviço de Menu Links
 * Gerencia links personalizados do menu estilo e-commerce
 */

const MenuLinksService = {
  collection: 'menu_links',

  async listar() {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('ordem')
        .get();

      const links = [];
      snapshot.forEach(doc => {
        links.push({ id: doc.id, ...doc.data() });
      });

      console.info(`✅ ${links.length} links do menu encontrados`);
      return links;
    } catch (error) {
      console.error('❌ Erro ao listar links:', error);
      return [];
    }
  },

  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('❌ Erro ao buscar link:', error);
      return null;
    }
  },

  async criar(link) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'menu_link', entityId: 'create' });
        }
        return { success: false, error: 'Sem permissão para criar link' };
      }

      const novoLink = {
        texto: DomUtils.sanitizeText(link.texto, 120),
        url: DomUtils.sanitizeUrl(link.url),
        icone: link.icone || '',
        ordem: parseInt(link.ordem) || 0,
        abrirNovaAba: link.abrirNovaAba !== false,
        destacado: link.destacado === true,
        ativo: link.ativo !== false,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection(this.collection).add(novoLink);
      console.info('✅ Link criado:', docRef.id);

      if (window.AuditService) {
        await AuditService.log({
          action: 'menu_link_create',
          entity: 'menu_link',
          entityId: docRef.id,
          before: null,
          after: novoLink
        });
      }

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar link:', error);
      return { success: false, error: error.message };
    }
  },

  async atualizar(id, dados) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'menu_link', entityId: id });
        }
        return { success: false, error: 'Sem permissão para atualizar link' };
      }

      const dadosAtualizados = {
        texto: DomUtils.sanitizeText(dados.texto, 120),
        url: DomUtils.sanitizeUrl(dados.url),
        icone: dados.icone || '',
        ordem: parseInt(dados.ordem) || 0,
        abrirNovaAba: dados.abrirNovaAba !== false,
        destacado: dados.destacado === true,
        ativo: dados.ativo !== false,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebaseDb.collection(this.collection).doc(id).update(dadosAtualizados);
      console.info('✅ Link atualizado');

      if (window.AuditService) {
        await AuditService.log({
          action: 'menu_link_update',
          entity: 'menu_link',
          entityId: id,
          before: null,
          after: dadosAtualizados
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar link:', error);
      return { success: false, error: error.message };
    }
  },

  async deletar(id) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'menu_link', entityId: id });
        }
        return { success: false, error: 'Sem permissão para deletar link' };
      }

      await firebaseDb.collection(this.collection).doc(id).delete();
      console.info('✅ Link deletado');

      if (window.AuditService) {
        await AuditService.log({
          action: 'menu_link_delete',
          entity: 'menu_link',
          entityId: id,
          before: null,
          after: null
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar link:', error);
      return { success: false, error: error.message };
    }
  },

  async reordenar(links) {
    try {
      const batch = firebaseDb.batch();

      links.forEach(({ id, ordem }) => {
        const ref = firebaseDb.collection(this.collection).doc(id);
        batch.update(ref, { ordem: parseInt(ordem) });
      });

      await batch.commit();
      console.info('✅ Links reordenados');

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao reordenar links:', error);
      return { success: false, error: error.message };
    }
  },

  validar(link) {
    const erros = [];

    if (!link.texto || link.texto.trim() === '') {
      erros.push('Texto do link é obrigatório');
    }

    if (!link.url || link.url.trim() === '') {
      erros.push('URL é obrigatória');
    }

    if (link.url && !this.validarUrl(link.url)) {
      erros.push('URL inválida');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  },

  validarUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return url.startsWith('/') || url.startsWith('#');
    }
  }
};

window.MenuLinksService = MenuLinksService;
