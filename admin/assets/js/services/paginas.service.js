/**
 * Serviço de Páginas Customizadas
 */

const PaginasService = {
  collection: 'paginas',

  async listar() {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('titulo')
        .get();

      const paginas = [];
      snapshot.forEach(doc => {
        paginas.push({ id: doc.id, ...doc.data() });
      });

      return paginas;
    } catch (error) {
      console.error('❌ Erro ao listar páginas:', error);
      return [];
    }
  },

  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('❌ Erro ao buscar página:', error);
      return null;
    }
  },

  async criar(pagina) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'pagina', entityId: 'create' });
        }
        return { success: false, error: 'Sem permissão para criar página' };
      }

      const payload = {
        titulo: DomUtils.sanitizeText(pagina.titulo, 120),
        slug: DomUtils.sanitizeText(pagina.slug, 120),
        modoConteudo: pagina.modoConteudo === 'html' ? 'html' : pagina.modoConteudo === 'blocos' ? 'blocos' : 'texto',
        conteudoTexto: pagina.conteudoTexto || '',
        conteudoHtml: pagina.conteudoHtml || '',
        conteudoBlocos: Array.isArray(pagina.conteudoBlocos) ? pagina.conteudoBlocos : [],
        ativo: pagina.ativo !== false,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection(this.collection).add(payload);

      if (window.AuditService) {
        await AuditService.log({
          action: 'pagina_create',
          entity: 'pagina',
          entityId: docRef.id,
          before: null,
          after: payload
        });
      }

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar página:', error);
      return { success: false, error: error.message };
    }
  },

  async atualizar(id, pagina) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'pagina', entityId: id });
        }
        return { success: false, error: 'Sem permissão para atualizar página' };
      }

      const payload = {
        titulo: DomUtils.sanitizeText(pagina.titulo, 120),
        slug: DomUtils.sanitizeText(pagina.slug, 120),
        modoConteudo: pagina.modoConteudo === 'html' ? 'html' : pagina.modoConteudo === 'blocos' ? 'blocos' : 'texto',
        conteudoTexto: pagina.conteudoTexto || '',
        conteudoHtml: pagina.conteudoHtml || '',
        conteudoBlocos: Array.isArray(pagina.conteudoBlocos) ? pagina.conteudoBlocos : [],
        ativo: pagina.ativo !== false,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebaseDb.collection(this.collection).doc(id).update(payload);

      if (window.AuditService) {
        await AuditService.log({
          action: 'pagina_update',
          entity: 'pagina',
          entityId: id,
          before: null,
          after: payload
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar página:', error);
      return { success: false, error: error.message };
    }
  },

  async deletar(id) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'pagina', entityId: id });
        }
        return { success: false, error: 'Sem permissão para deletar página' };
      }

      await firebaseDb.collection(this.collection).doc(id).delete();

      if (window.AuditService) {
        await AuditService.log({
          action: 'pagina_delete',
          entity: 'pagina',
          entityId: id,
          before: null,
          after: null
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar página:', error);
      return { success: false, error: error.message };
    }
  },

  validar(pagina) {
    const erros = [];
    const titulo = String(pagina.titulo || '').trim();
    const slug = String(pagina.slug || '').trim();
    const modo = pagina.modoConteudo === 'html' ? 'html' : pagina.modoConteudo === 'blocos' ? 'blocos' : 'texto';
    const conteudoTexto = String(pagina.conteudoTexto || '').trim();
    const conteudoHtml = String(pagina.conteudoHtml || '').trim();
    const conteudoBlocos = Array.isArray(pagina.conteudoBlocos) ? pagina.conteudoBlocos : [];

    if (!titulo) erros.push('Título é obrigatório');
    if (!slug) erros.push('Slug é obrigatório');
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      erros.push('Slug inválido (use letras minúsculas, números e hífen)');
    }

    if (modo === 'texto' && !conteudoTexto) {
      erros.push('Conteúdo em texto é obrigatório');
    }
    if (modo === 'html' && !conteudoHtml) {
      erros.push('Conteúdo HTML é obrigatório');
    }
    if (modo === 'blocos' && conteudoBlocos.length === 0) {
      erros.push('Adicione ao menos um bloco');
    }

    if (conteudoTexto.length > 20000 || conteudoHtml.length > 20000) {
      erros.push('Conteúdo muito longo (máx. 20000 caracteres)');
    }
    if (conteudoBlocos.length > 200) {
      erros.push('Muitos blocos (máx. 200)');
    }

    return { valido: erros.length === 0, erros };
  }
};

window.PaginasService = PaginasService;
