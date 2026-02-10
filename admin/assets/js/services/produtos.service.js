/**
 * Serviço de Produtos V3
 * Gerencia CRUD com tipos dinâmicos
 */

const ProdutosService = {
  collection: 'produtos',

  cloudinary: {
    cloudName: AppConfig.cloudinary.cloudName,
    uploadPreset: AppConfig.cloudinary.uploadPreset
  },

  async listar() {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('nome')
        .get();

      const produtos = [];
      snapshot.forEach(doc => {
        produtos.push({ id: doc.id, ...doc.data() });
      });

      return produtos;
    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      return [];
    }
  },

  async listarPaginado(pageSize = 25, lastDoc = null) {
    try {
      let query = firebaseDb.collection(this.collection).orderBy('nome').limit(pageSize);
      if (lastDoc) query = query.startAfter(lastDoc);
      const snapshot = await query.get();
      const produtos = [];
      snapshot.forEach(doc => produtos.push({ id: doc.id, ...doc.data() }));
      const last = snapshot.docs[snapshot.docs.length - 1] || null;
      return { items: produtos, lastDoc: last };
    } catch (error) {
      console.error('Erro ao listar produtos paginado:', error);
      return { items: [], lastDoc: null };
    }
  },

  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return null;
    }
  },

  async criar(produto) {
    try {
      if (window.RbacService && !RbacService.has('produtos.write')) {
        if (window.AuditService) {
          await AuditService.log({
            action: 'forbidden',
            entity: 'produto',
            entityId: 'create'
          });
        }
        return { success: false, error: 'Sem permissão para criar produto' };
      }
      const status = produto.status || 'draft';
      const slugGerado = produto.slug && produto.slug.trim()
        ? produto.slug
        : this.gerarSlug(produto.nome);

      const novoProduto = {
        nome: DomUtils.sanitizeText(produto.nome),
        marca: DomUtils.sanitizeText(produto.marca),
        categoria: DomUtils.sanitizeText(produto.categoria),
        tipoProdutoId: produto.tipoProdutoId,
        tipoProdutoNome: produto.tipoProdutoNome,
        slug: DomUtils.sanitizeText(slugGerado, 120),
        seoTitle: DomUtils.sanitizeText(produto.seoTitle, 120),
        seoDescription: DomUtils.sanitizeText(produto.seoDescription, 200),
        relacionados: Array.isArray(produto.relacionados) ? produto.relacionados.slice(0, 20) : [],
        featured: produto.featured === true,
        precoPix: parseFloat(produto.precoPix),
        precoCartao: parseFloat(produto.precoCartao),
        tamanhos: produto.tamanhos || [],
        imagemUrl: DomUtils.sanitizeUrl(produto.imagemUrl),
        ativo: produto.ativo !== false,
        status,
        priceHistory: [
          {
            precoPix: parseFloat(produto.precoPix),
            precoCartao: parseFloat(produto.precoCartao),
            changedAt: firebase.firestore.Timestamp.now()
          }
        ],
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (status === 'published') {
        novoProduto.publishedAt = firebase.firestore.FieldValue.serverTimestamp();
      }

      const docRef = await firebaseDb.collection(this.collection).add(novoProduto);

      if (window.AuditService) {
        await AuditService.log({
          action: 'product_create',
          entity: 'produto',
          entityId: docRef.id,
          before: null,
          after: novoProduto
        });
      }

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      return { success: false, error: error.message };
    }
  },

  async atualizar(id, dados) {
    try {
      if (window.RbacService && !RbacService.has('produtos.write')) {
        if (window.AuditService) {
          await AuditService.log({
            action: 'forbidden',
            entity: 'produto',
            entityId: id
          });
        }
        return { success: false, error: 'Sem permissão para atualizar produto' };
      }
      const before = await this.buscarPorId(id);

      const status = dados.status || 'draft';
      const slugGerado = dados.slug && dados.slug.trim()
        ? dados.slug
        : this.gerarSlug(dados.nome);

      const dadosAtualizados = {
        nome: DomUtils.sanitizeText(dados.nome),
        marca: DomUtils.sanitizeText(dados.marca),
        categoria: DomUtils.sanitizeText(dados.categoria),
        tipoProdutoId: dados.tipoProdutoId,
        tipoProdutoNome: dados.tipoProdutoNome,
        slug: DomUtils.sanitizeText(slugGerado, 120),
        seoTitle: DomUtils.sanitizeText(dados.seoTitle, 120),
        seoDescription: DomUtils.sanitizeText(dados.seoDescription, 200),
        relacionados: Array.isArray(dados.relacionados) ? dados.relacionados.slice(0, 20) : [],
        featured: dados.featured === true,
        precoPix: parseFloat(dados.precoPix),
        precoCartao: parseFloat(dados.precoCartao),
        tamanhos: dados.tamanhos || [],
        imagemUrl: DomUtils.sanitizeUrl(dados.imagemUrl),
        ativo: dados.ativo !== false,
        status,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (status === 'published' && (!before || !before.publishedAt)) {
        dadosAtualizados.publishedAt = firebase.firestore.FieldValue.serverTimestamp();
      }

      if (status !== 'published') {
        dadosAtualizados.publishedAt = null;
      }

      if (before && (before.precoPix !== dadosAtualizados.precoPix || before.precoCartao !== dadosAtualizados.precoCartao)) {
        const history = Array.isArray(before.priceHistory) ? before.priceHistory.slice(0, 29) : [];
        history.unshift({
          precoPix: dadosAtualizados.precoPix,
          precoCartao: dadosAtualizados.precoCartao,
          changedAt: firebase.firestore.Timestamp.now()
        });
        dadosAtualizados.priceHistory = history;
      }

      await firebaseDb.collection(this.collection).doc(id).update(dadosAtualizados);

      if (window.AuditService) {
        await AuditService.log({
          action: 'product_update',
          entity: 'produto',
          entityId: id,
          before,
          after: dadosAtualizados
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return { success: false, error: error.message };
    }
  },

  async deletar(id) {
    try {
      if (window.RbacService && !RbacService.has('produtos.write')) {
        if (window.AuditService) {
          await AuditService.log({
            action: 'forbidden',
            entity: 'produto',
            entityId: id
          });
        }
        return { success: false, error: 'Sem permissão para excluir produto' };
      }
      const before = await this.buscarPorId(id);
      await firebaseDb.collection(this.collection).doc(id).delete();

      if (window.AuditService) {
        await AuditService.log({
          action: 'product_delete',
          entity: 'produto',
          entityId: id,
          before,
          after: null
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      return { success: false, error: error.message };
    }
  },

  async clonar(id) {
    try {
      const produto = await this.buscarPorId(id);
      if (!produto) return { success: false, error: 'Produto não encontrado' };

      const novo = {
        ...produto,
        nome: `Cópia - ${produto.nome}`,
        slug: '',
        ativo: false,
        status: 'draft'
      };
      delete novo.id;
      delete novo.criadoEm;
      delete novo.atualizadoEm;

      return await this.criar(novo);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async uploadImagem(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.cloudinary.uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudinary.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();

      if (!data.secure_url) {
        throw new Error('URL não retornada pelo Cloudinary');
      }

      return data.secure_url;
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    }
  },

  validar(produto) {
    const erros = [];

    if (!produto.nome?.trim()) {
      erros.push('Nome é obrigatório');
    }

    if (!produto.marca?.trim()) {
      erros.push('Marca é obrigatória');
    }

    if (!produto.tipoProdutoId) {
      erros.push('Tipo de produto é obrigatório');
    }

    if (!produto.precoPix || produto.precoPix <= 0) {
      erros.push('Preço PIX inválido');
    }

    if (!produto.precoCartao || produto.precoCartao <= 0) {
      erros.push('Preço Cartão inválido');
    }

    if (!Array.isArray(produto.tamanhos) || produto.tamanhos.length === 0) {
      erros.push('Selecione pelo menos um tamanho');
    }

    if (!produto.imagemUrl) {
      erros.push('Imagem é obrigatória');
    }

    if (!produto.status || !['draft', 'published', 'archived'].includes(produto.status)) {
      erros.push('Status inválido');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  },

  gerarSlug(nome) {
    return String(nome || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  },

  async buscarPorTipo(tipoId) {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .where('tipoProdutoId', '==', tipoId)
        .where('ativo', '==', true)
        .get();

      const produtos = [];
      snapshot.forEach(doc => {
        produtos.push({ id: doc.id, ...doc.data() });
      });

      return produtos;
    } catch (error) {
      console.error('Erro ao buscar por tipo:', error);
      return [];
    }
  },

  async buscarPorCategoria(categoria) {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .where('categoria', '==', categoria)
        .where('ativo', '==', true)
        .get();

      const produtos = [];
      snapshot.forEach(doc => {
        produtos.push({ id: doc.id, ...doc.data() });
      });

      return produtos;
    } catch (error) {
      console.error('Erro ao buscar por categoria:', error);
      return [];
    }
  },

  async estatisticas() {
    try {
      const produtos = await this.listar();

      const stats = {
        total: produtos.length,
        ativos: produtos.filter(p => p.ativo).length,
        inativos: produtos.filter(p => !p.ativo).length,
        porTipo: {},
        porMarca: {},
        porCategoria: {}
      };

      produtos.forEach(p => {
        if (p.tipoProdutoNome) {
          stats.porTipo[p.tipoProdutoNome] = (stats.porTipo[p.tipoProdutoNome] || 0) + 1;
        }

        if (p.marca) {
          stats.porMarca[p.marca] = (stats.porMarca[p.marca] || 0) + 1;
        }

        if (p.categoria) {
          stats.porCategoria[p.categoria] = (stats.porCategoria[p.categoria] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return {
        total: 0,
        ativos: 0,
        inativos: 0,
        porTipo: {},
        porMarca: {},
        porCategoria: {}
      };
    }
  }
};

window.ProdutosService = ProdutosService;


