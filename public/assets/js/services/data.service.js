/**
 * Catalog Data Service
 * Fetches products and configuration from Firestore
 */

const DataService = {
  db: null,
  configCache: null,
  configCacheAt: 0,
  configCacheTtl: 5 * 60 * 1000,
  produtosCache: null,
  produtosCacheAt: 0,
  produtosCacheTtl: 4 * 60 * 1000,
  produtosCacheKey: 'catalogo_produtos_cache_v1',
  produtosCacheMax: 200,
  produtosPageSize: 24,
  produtosCursor: null,
  produtosExausto: false,
  metricsDisabled: false,

  init() {
    this.db = window.firebaseDb || firebase.firestore();
    console.info('DataService ready');
  },

  async buscarProdutos() {
    try {
      console.info('Fetching products...');

      this.resetProdutosPaginacao();
      const resultado = await this.buscarProdutosPaginados({ limite: 500 });
      return resultado.items;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  },

  resetProdutosPaginacao() {
    this.produtosCursor = null;
    this.produtosExausto = false;
  },

  getCachedProdutos() {
    try {
      if (this.produtosCache && Date.now() - this.produtosCacheAt < this.produtosCacheTtl) {
        return this.produtosCache;
      }

      const raw = localStorage.getItem(this.produtosCacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.items || !parsed?.at) return null;
      if (Date.now() - parsed.at > this.produtosCacheTtl) return null;
      this.produtosCache = parsed.items;
      this.produtosCacheAt = parsed.at;
      return parsed.items;
    } catch (error) {
      return null;
    }
  },

  setCachedProdutos(items) {
    try {
      const payload = {
        items: items.slice(0, this.produtosCacheMax),
        at: Date.now()
      };
      localStorage.setItem(this.produtosCacheKey, JSON.stringify(payload));
      this.produtosCache = payload.items;
      this.produtosCacheAt = payload.at;
    } catch (error) {
      // localStorage pode falhar em modo privado ou quota cheia
    }
  },

  async buscarProdutosPaginados({ limite } = {}) {
    try {
      const pageSize = Number(limite || this.produtosPageSize);
      if (this.produtosExausto) {
        return { items: [], hasMore: false };
      }

      let query = this.db
        .collection('produtos')
        .where('ativo', '==', true)
        .orderBy('nome')
        .limit(pageSize);

      if (this.produtosCursor) {
        query = query.startAfter(this.produtosCursor);
      }

      const snapshot = await query.get();
      const items = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });

      if (snapshot.docs.length > 0) {
        this.produtosCursor = snapshot.docs[snapshot.docs.length - 1];
      }
      if (snapshot.docs.length < pageSize) {
        this.produtosExausto = true;
      }

      return { items, hasMore: !this.produtosExausto };
    } catch (error) {
      console.error('Failed to fetch products page:', error);
      return { items: [], hasMore: false, error };
    }
  },

  async buscarConfig() {
    try {
      const now = Date.now();
      if (this.configCache && now - this.configCacheAt < this.configCacheTtl) {
        return this.configCache;
      }

      const doc = await this.db.collection('config').doc('loja').get();
      let config = doc.exists ? doc.data() : this.getConfigPadrao();

      const [banners, menuLinks, redesSociais, categorias, tiposProduto, marcas, paginas] = await Promise.all([
        this.buscarBanners(config),
        this.buscarMenuLinks(),
        this.buscarRedesSociais(),
        this.buscarCategorias(),
        this.buscarTiposProduto(),
        this.buscarMarcas(),
        this.buscarPaginas()
      ]);

      config = {
        ...this.getConfigPadrao(),
        ...config,
        banners,
        menuLinks,
        redesSociais,
        categorias,
        tiposProduto,
        marcas,
        paginas
      };

      this.configCache = config;
      this.configCacheAt = now;
      return config;
    } catch (error) {
      console.error('Failed to fetch config:', error);
      const fallback = this.getConfigPadrao();
      this.configCache = fallback;
      this.configCacheAt = Date.now();
      return fallback;
    }
  },

  async buscarBanners(config) {
    if (config && Array.isArray(config.banners) && config.banners.length > 0) {
      return config.banners;
    }

    try {
      const snapshot = await this.db
        .collection('banners')
        .where('ativo', '==', true)
        .orderBy('ordem', 'asc')
        .get();

      const banners = [];
      snapshot.forEach(doc => {
        banners.push({ id: doc.id, ...doc.data() });
      });

      return banners;
    } catch (error) {
      console.warn('Failed to fetch banners:', error);
      return [];
    }
  },

  async buscarMenuLinks() {
    try {
      try {
        const snapshot = await this.db
          .collection('menu_links')
          .where('ativo', '==', true)
          .orderBy('ordem', 'asc')
          .get();

        const links = [];
        snapshot.forEach(doc => {
          links.push({ id: doc.id, ...doc.data() });
        });

        return links;
      } catch (error) {
        if (error?.code === 'failed-precondition') {
          const snapshot = await this.db
            .collection('menu_links')
            .where('ativo', '==', true)
            .get();

          const links = [];
          snapshot.forEach(doc => {
            links.push({ id: doc.id, ...doc.data() });
          });

          return links.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        }
        throw error;
      }
    } catch (error) {
      console.warn('Failed to fetch menu links:', error);
      return [];
    }
  },

  async buscarRedesSociais() {
    try {
      try {
        const snapshot = await this.db
          .collection('redes_sociais')
          .where('ativo', '==', true)
          .orderBy('ordem', 'asc')
          .get();

        const redes = [];
        snapshot.forEach(doc => {
          redes.push({ id: doc.id, ...doc.data() });
        });

        return redes;
      } catch (error) {
        if (error?.code === 'failed-precondition') {
          const snapshot = await this.db
            .collection('redes_sociais')
            .where('ativo', '==', true)
            .get();

          const redes = [];
          snapshot.forEach(doc => {
            redes.push({ id: doc.id, ...doc.data() });
          });

          return redes.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        }
        throw error;
      }
    } catch (error) {
      console.warn('Failed to fetch social links:', error);
      return [];
    }
  },

  async buscarCategorias() {
    try {
      try {
        const snapshot = await this.db
          .collection('categorias')
          .where('ativo', '==', true)
          .orderBy('ordem', 'asc')
          .get();

        const categorias = [];
        snapshot.forEach(doc => {
          categorias.push({ id: doc.id, ...doc.data() });
        });

        return categorias;
      } catch (error) {
        if (error?.code === 'failed-precondition') {
          const snapshot = await this.db
            .collection('categorias')
            .where('ativo', '==', true)
            .get();

          const categorias = [];
          snapshot.forEach(doc => {
            categorias.push({ id: doc.id, ...doc.data() });
          });

          return categorias.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        }
        throw error;
      }
    } catch (error) {
      console.warn('Failed to fetch categories:', error);
      return [];
    }
  },

  async buscarTiposProduto() {
    try {
      try {
        const snapshot = await this.db
          .collection('tipos_produto')
          .where('ativo', '==', true)
          .orderBy('nome', 'asc')
          .get();

        const tipos = [];
        snapshot.forEach(doc => {
          tipos.push({ id: doc.id, ...doc.data() });
        });

        return tipos;
      } catch (error) {
        if (error?.code === 'failed-precondition') {
          const snapshot = await this.db
            .collection('tipos_produto')
            .where('ativo', '==', true)
            .get();

          const tipos = [];
          snapshot.forEach(doc => {
            tipos.push({ id: doc.id, ...doc.data() });
          });

          return tipos.sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')));
        }
        throw error;
      }
    } catch (error) {
      console.warn('Failed to fetch product types:', error);
      return [];
    }
  },

  async buscarMarcas() {
    try {
      try {
        const snapshot = await this.db
          .collection('marcas')
          .where('ativo', '==', true)
          .orderBy('nome', 'asc')
          .get();

        const marcas = [];
        snapshot.forEach(doc => {
          marcas.push({ id: doc.id, ...doc.data() });
        });

        return marcas;
      } catch (error) {
        if (error?.code === 'failed-precondition') {
          const snapshot = await this.db
            .collection('marcas')
            .where('ativo', '==', true)
            .get();

          const marcas = [];
          snapshot.forEach(doc => {
            marcas.push({ id: doc.id, ...doc.data() });
          });

          return marcas.sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')));
        }
        throw error;
      }
    } catch (error) {
      console.warn('Failed to fetch brands:', error);
      return [];
    }
  },

  async buscarPaginas() {
    try {
      try {
        const snapshot = await this.db
          .collection('paginas')
          .where('ativo', '==', true)
          .orderBy('titulo', 'asc')
          .get();

        const paginas = [];
        snapshot.forEach(doc => {
          paginas.push({ id: doc.id, ...doc.data() });
        });

        return paginas;
      } catch (error) {
        if (error?.code === 'failed-precondition') {
          const snapshot = await this.db
            .collection('paginas')
            .where('ativo', '==', true)
            .get();

          const paginas = [];
          snapshot.forEach(doc => {
            paginas.push({ id: doc.id, ...doc.data() });
          });

          return paginas.sort((a, b) => String(a.titulo || '').localeCompare(String(b.titulo || '')));
        }
        throw error;
      }
    } catch (error) {
      console.warn('Failed to fetch pages:', error);
      return [];
    }
  },

  async buscarPaginaPorSlug(slug) {
    const safeSlug = String(slug || '').trim();
    if (!safeSlug) return null;
    try {
      const snapshot = await this.db
        .collection('paginas')
        .where('ativo', '==', true)
        .where('slug', '==', safeSlug)
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      if (error?.code === 'failed-precondition') {
        const paginas = await this.buscarPaginas();
        return paginas.find(p => String(p.slug || '') === safeSlug) || null;
      }
      console.warn('Failed to fetch page by slug:', error);
      return null;
    }
  },

  async registrarCliqueWhatsApp(dados) {
    try {
      await this.registrarEvento('whatsapp_click', {
        produtoId: dados.produtoId || null,
        produtoNome: dados.produtoNome || null
      });
    } catch (error) {
      console.warn('Failed to track metric:', error);
    }
  },

  async registrarVisualizacao() {
    try {
      await this.registrarEvento('page_view', {
        url: window.location.href
      });
    } catch (error) {
      console.warn('Failed to track page view:', error);
    }
  },

  async registrarEvento(tipo, dados = {}) {
    if (this.metricsDisabled) return;
    try {
      await this.db.collection('metricas').add({
        tipo,
        ...dados,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent
      });
      console.info('Evento registrado:', tipo);
    } catch (error) {
      if (error?.code === 'permission-denied') {
        this.metricsDisabled = true;
        return;
      }
      console.warn('Falha ao registrar evento:', error);
    }
  },

  extrairMarcas(produtos) {
    const marcas = [...new Set(produtos.map(p => p.marca).filter(Boolean))];
    return marcas.sort();
  },

  extrairTamanhos(produtos) {
    const tamanhos = new Set();
    produtos.forEach(p => {
      if (Array.isArray(p.tamanhos)) {
        p.tamanhos.forEach(t => tamanhos.add(t));
      }
    });

    const ordem = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
    return Array.from(tamanhos).sort((a, b) => {
      const ia = ordem.indexOf(a);
      const ib = ordem.indexOf(b);
      if (ia === -1 && ib === -1) return String(a).localeCompare(String(b));
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  },

  getConfigPadrao() {
    return {
      nomeLoja: 'Catalogo',
      whatsapp: '5511999999999',
      mensagemPadrao: 'Olá! Gostaria de fazer um pedido:\n\n*Produto:* {produto}\n*Marca:* {marca}\n*Tamanho:* {tamanho}\n*Pagamento:* {pagamento}\n*Entrega:* {entrega}\n*Valor:* R$ {valor}',
      mensagemCarrinho: 'Olá! Gostaria de finalizar meu pedido:\n\n{produtos}\n\nResumo: {quantidade} item(ns) | Pagamento: {pagamento}\nEntrega: {entrega} | Frete: R$ {frete}\nTotal: R$ {total}',
      mensagemCarrinhoItem: '{numero}. *{produto}* - {marca}\n   Tamanho: {tamanho} | Pagamento: {pagamento}\n   Qtd: {quantidade} | Valor unit.: R$ {valor} | Subtotal: R$ {subtotal}',
      taxaMotoboy: 0,
      exibirTaxaEntrega: true,
      parcelasSemJuros: 1,
      valorMinimoParcela: 0,
      descontoPix: 0,
      exibirDescontoPix: true,
      exibirParcelas: true,
      aceitaDinheiro: false,
      aceitaBoleto: false,
      observacoesPagamento: '',
      entregaRetiradaAtivo: true,
      entregaMotoboyAtivo: true,
      pixelFacebook: '',
      pixelAtivo: false,
      gtmGoogle: '',
      gtmAtivo: false,
      googleAnalytics: '',
      gaAtivo: false,
      rastrearScrollDepth: false,
      rastrearTempoNaPagina: false,
      rastrearCliquesOutbound: false,
      menuCategorias: [],
      categoriasCadastradas: [],
      marcasCadastradas: [],
      avisoTexto: '',
      avisoBotaoTexto: '',
      avisoBotaoUrl: '',
      avisoEntregaTexto: 'Taxa de Entrega via Motoboy: {taxa}',
      avisoMotoboy: '',
      logoUrl: '',
      whatsappFlutuante: true,
      whatsappMensagemFlutuante: 'Precisa de Ajuda?',
      whatsappMensagemInicial: '',
      exibirHorario: false,
      permitirForaHorario: false,
      horarioSegSexInicio: '09:00',
      horarioSegSexFim: '18:00',
      horarioSabInicio: '09:00',
      horarioSabFim: '13:00',
      atendeDOM: false,
      mensagemForaHorario: '',
      footerTexto: 'Sua loja de confiança com os melhores produtos e preços.',
      telefone: '',
      email: '',
      endereco: '',
      customizacao: {},
      sliderAutoPlay: true,
      sliderInterval: 5000,
      banners: [],
      menuLinks: [],
      redesSociais: [],
      categorias: [],
      tiposProduto: [],
      marcas: [],
      paginas: []
    };
  }
};

window.DataService = DataService;

