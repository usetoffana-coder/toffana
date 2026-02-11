/**
 * Serviço de Categorias
 * Gerencia categorias do menu do catálogo
 */

const CategoriasService = {
  collection: 'categorias',

  async listar() {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('ordem')
        .get();

      const categorias = [];
      snapshot.forEach(doc => {
        categorias.push({ id: doc.id, ...doc.data() });
      });

      console.info(`✅ ${categorias.length} categorias encontradas`);
      return categorias;
    } catch (error) {
      console.error('❌ Erro ao listar categorias:', error);
      return [];
    }
  },

  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('❌ Erro ao buscar categoria:', error);
      return null;
    }
  },

  async criar(categoria) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'categoria', entityId: 'create' });
        }
        return { success: false, error: 'Sem permissão para criar categoria' };
      }

      const novaCategoria = {
        nome: DomUtils.sanitizeText(categoria.nome, 120),
        slug: this.gerarSlug(categoria.nome),
        ordem: parseInt(categoria.ordem) || 0,
        ativo: categoria.ativo !== false,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection(this.collection).add(novaCategoria);
      console.info('✅ Categoria criada:', docRef.id);

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar categoria:', error);
      return { success: false, error: error.message };
    }
  },

  async atualizar(id, dados) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'categoria', entityId: id });
        }
        return { success: false, error: 'Sem permissão para atualizar categoria' };
      }

      const dadosAtualizados = {
        nome: DomUtils.sanitizeText(dados.nome, 120),
        slug: this.gerarSlug(dados.nome),
        ordem: parseInt(dados.ordem) || 0,
        ativo: dados.ativo !== false,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebaseDb.collection(this.collection).doc(id).update(dadosAtualizados);
      console.info('✅ Categoria atualizada');

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar categoria:', error);
      return { success: false, error: error.message };
    }
  },

  async deletar(id) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({ action: 'forbidden', entity: 'categoria', entityId: id });
        }
        return { success: false, error: 'Sem permissão para deletar categoria' };
      }

      const produtosSnapshot = await firebaseDb
        .collection('produtos')
        .where('categoria', '==', id)
        .limit(1)
        .get();

      if (!produtosSnapshot.empty) {
        return {
          success: false,
          error: 'Não é possível deletar. Existem produtos nesta categoria.'
        };
      }

      await firebaseDb.collection(this.collection).doc(id).delete();
      console.info('✅ Categoria deletada');

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar categoria:', error);
      return { success: false, error: error.message };
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

  validar(categoria) {
    const erros = [];

    if (!categoria.nome || categoria.nome.trim() === '') {
      erros.push('Nome da categoria é obrigatório');
    }

    if (categoria.nome && categoria.nome.length > 100) {
      erros.push('Nome muito longo (máx. 100 caracteres)');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  },

  async reordenar(categorias) {
    try {
      const batch = firebaseDb.batch();

      categorias.forEach(({ id, ordem }) => {
        const ref = firebaseDb.collection(this.collection).doc(id);
        batch.update(ref, { ordem: parseInt(ordem) });
      });

      await batch.commit();
      console.info('✅ Categorias reordenadas');

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao reordenar categorias:', error);
      return { success: false, error: error.message };
    }
  }
};

window.CategoriasService = CategoriasService;
