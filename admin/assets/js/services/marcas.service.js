/**
 * Serviço de Marcas
 * Gerencia marcas de produtos
 */

const MarcasService = {
  collection: 'marcas',

  async listar() {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('nome')
        .get();

      const marcas = [];
      snapshot.forEach(doc => {
        marcas.push({ id: doc.id, ...doc.data() });
      });

      console.info(`✅ ${marcas.length} marcas encontradas`);
      return marcas;
    } catch (error) {
      console.error('❌ Erro ao listar marcas:', error);
      return [];
    }
  },

  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('❌ Erro ao buscar marca:', error);
      return null;
    }
  },

  async criar(marca) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'marca', entityId: 'create' });
        }
        return { success: false, error: 'Sem permissão para criar marca' };
      }

      const novaMarca = {
        nome: DomUtils.sanitizeText(marca.nome, 120),
        slug: this.gerarSlug(marca.nome),
        logoUrl: DomUtils.sanitizeUrl(marca.logoUrl || ''),
        descricao: DomUtils.sanitizeText(marca.descricao || '', 500),
        ativo: marca.ativo !== false,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection(this.collection).add(novaMarca);
      console.info('✅ Marca criada:', docRef.id);

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar marca:', error);
      return { success: false, error: error.message };
    }
  },

  async atualizar(id, dados) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'marca', entityId: id });
        }
        return { success: false, error: 'Sem permissão para atualizar marca' };
      }

      const dadosAtualizados = {
        nome: DomUtils.sanitizeText(dados.nome, 120),
        slug: this.gerarSlug(dados.nome),
        logoUrl: DomUtils.sanitizeUrl(dados.logoUrl || ''),
        descricao: DomUtils.sanitizeText(dados.descricao || '', 500),
        ativo: dados.ativo !== false,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebaseDb.collection(this.collection).doc(id).update(dadosAtualizados);
      console.info('✅ Marca atualizada');

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar marca:', error);
      return { success: false, error: error.message };
    }
  },

  async deletar(id) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'marca', entityId: id });
        }
        return { success: false, error: 'Sem permissão para deletar marca' };
      }

      const produtosSnapshot = await firebaseDb
        .collection('produtos')
        .where('marca', '==', id)
        .limit(1)
        .get();

      if (!produtosSnapshot.empty) {
        return {
          success: false,
          error: 'Não é possível deletar. Existem produtos desta marca.'
        };
      }

      await firebaseDb.collection(this.collection).doc(id).delete();
      console.info('✅ Marca deletada');

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar marca:', error);
      return { success: false, error: error.message };
    }
  },

  async contarProdutos(marcaId) {
    try {
      const snapshot = await firebaseDb
        .collection('produtos')
        .where('marca', '==', marcaId)
        .get();

      return snapshot.size;
    } catch (error) {
      console.error('❌ Erro ao contar produtos:', error);
      return 0;
    }
  },

  gerarSlug(nome) {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  },

  validar(marca) {
    const erros = [];

    if (!marca.nome || marca.nome.trim() === '') {
      erros.push('Nome da marca é obrigatório');
    }

    if (marca.nome && marca.nome.length > 100) {
      erros.push('Nome muito longo (máx. 100 caracteres)');
    }

    if (marca.descricao && marca.descricao.length > 500) {
      erros.push('Descrição muito longa (máx. 500 caracteres)');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  }
};

window.MarcasService = MarcasService;
