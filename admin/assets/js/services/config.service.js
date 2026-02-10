/**
 * Serviço de Configurações
 * Gerencia configurações da loja
 */

const ConfigService = {
  collection: 'config',
  docId: 'loja',
  cacheKey: 'config_cache_v1',
  cacheTtl: 5 * 60 * 1000,
  memoryCache: null,
  memoryCacheAt: 0,
  lastReadAt: null,
  lastError: null,

  /**
   * Busca configurações
   * @returns {Promise<object>}
   */
  async buscar() {
    try {
      const now = Date.now();
      if (this.memoryCache && now - this.memoryCacheAt < this.cacheTtl) {
        return this.memoryCache;
      }

      const cached = this.getCache();
      if (cached) {
        this.memoryCache = cached;
        this.memoryCacheAt = now;
      }

      const doc = await firebaseDb.collection(this.collection).doc(this.docId).get();

      if (doc.exists) {
        const data = doc.data();
        this.setCache(data);
        this.lastReadAt = new Date();
        this.lastError = null;
        return data;
      }

      // Retorna configuração padrão se não existir
      const padrao = this.getConfigPadrao();
      this.setCache(padrao);
      this.lastReadAt = new Date();
      this.lastError = null;
      return padrao;
    } catch (error) {
      console.error('❌ Erro ao buscar configurações:', error);
      this.lastError = error;
      const padrao = this.getConfigPadrao();
      this.setCache(padrao);
      return padrao;
    }
  },

  /**
   * Salva configurações
   * @param {object} config 
   * @returns {Promise<object>}
   */
  async salvar(config) {
    try {
      if (window.RbacService && !RbacService.has('config.write')) {
        if (window.AuditService) {
          await AuditService.log({
            action: 'forbidden',
            entity: 'config',
            entityId: this.docId
          });
        }
        return { success: false, error: 'Sem permissão para alterar configurações' };
      }
      const docRef = firebaseDb.collection(this.collection).doc(this.docId);
      const currentDoc = await docRef.get();
      const before = currentDoc.exists ? currentDoc.data() : null;

      const current = before || this.getConfigPadrao();
      const next = { ...current, ...(config || {}) };
      if (!next.nomeLoja) {
        next.nomeLoja = current.nomeLoja || 'Minha Loja';
      }
      if (!next.whatsapp) {
        next.whatsapp = current.whatsapp || '5511999999999';
      }
      next.whatsapp = String(next.whatsapp || '').replace(/\D/g, '');

      const allowedFields = [
        'nomeLoja','whatsapp','mensagemPadrao','mensagemCarrinho',
        'taxaMotoboy','parcelasSemJuros','descontoPix','pixelFacebook',
        'gtmGoogle','googleAnalytics','menuCategorias','marcasCadastradas',
        'categoriasCadastradas','avisoTexto','avisoBotaoTexto','avisoBotaoUrl','avisoMotoboy','avisoEntregaTexto',
        'logoUrl','whatsappFlutuante','whatsappMensagemFlutuante',
        'whatsappMensagemInicial','exibirHorario','horarioSegSexInicio',
        'horarioSegSexFim','horarioSabInicio','horarioSabFim','atendeDOM',
        'mensagemForaHorario','permitirForaHorario','telefone','email','endereco',
        'customizacao','exibirTaxaEntrega','sliderAutoPlay','sliderInterval',
        'exibirDescontoPix','exibirParcelas','valorMinimoParcela',
        'aceitaDinheiro','aceitaBoleto','observacoesPagamento','mensagemCarrinhoItem','footerTexto',
        'pixelAtivo','gtmAtivo','gaAtivo',
        'entregaRetiradaAtivo','entregaMotoboyAtivo'
      ];

      const payload = {};
      allowedFields.forEach((key) => {
        if (key in next) payload[key] = next[key];
      });
      payload.nomeLoja = payload.nomeLoja || 'Minha Loja';
      payload.whatsapp = String(payload.whatsapp || '').replace(/\D/g, '');

      if (window.ConfigVersionService && before) {
        await ConfigVersionService.criarSnapshot(before, 'update');
      }

      await firebaseDb.collection(this.collection).doc(this.docId).set({
        ...payload,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      if (window.AuditService) {
        await AuditService.log({
          action: 'config_update',
          entity: 'config',
          entityId: this.docId,
          before,
          after: config
        });
      }

      this.setCache({ ...(before || {}), ...payload });
      this.lastReadAt = new Date();
      this.lastError = null;

      console.info('✅ Configurações salvas');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      this.lastError = error;
      return { success: false, error: error.message };
    }
  },

  /**
   * Configuração padrão
   * @returns {object}
   */
  getConfigPadrao() {
      return {
        nomeLoja: 'Minha Loja',
        whatsapp: '5511999999999',
        mensagemPadrao: 'Olá! Gostaria de fazer um pedido:\n\n*Produto:* {produto}\n*Marca:* {marca}\n*Tamanho:* {tamanho}\n*Pagamento:* {pagamento}\n*Entrega:* {entrega}\n*Valor:* R$ {valor}',
        mensagemCarrinho: 'Olá! Gostaria de finalizar meu pedido:\n\n{produtos}\n\nResumo: {quantidade} item(ns) | Pagamento: {pagamento}\nEntrega: {entrega} | Frete: R$ {frete}\nTotal: R$ {total}',
        mensagemCarrinhoItem: '{numero}. *{produto}* - {marca}\n   Tamanho: {tamanho} | Pagamento: {pagamento}\n   Qtd: {quantidade} | Valor unit.: R$ {valor} | Subtotal: R$ {subtotal}',
        permitirForaHorario: false,
        taxaMotoboy: 8.00,
        parcelasSemJuros: 3,
        descontoPix: 10,
      pixelFacebook: '',
      gtmGoogle: '',
      googleAnalytics: '',
      menuCategorias: [],
      marcasCadastradas: [],
      categoriasCadastradas: [],
        avisoTexto: 'Todos os produtos exibidos aqui são de pronta entrega na loja física em Leme-SP. Produtos sob encomenda você encontra em nossa loja online.',
        avisoBotaoTexto: 'Visitar Loja Online',
        avisoBotaoUrl: 'https://sualojaonline.com.br',
        avisoEntregaTexto: 'Taxa de Entrega via Motoboy: {taxa}',
        logoUrl: '',
        footerTexto: 'Sua loja de confiança com os melhores produtos e preços.',
        whatsappFlutuante: true,
        whatsappMensagemFlutuante: 'Precisa de Ajuda?',
        entregaRetiradaAtivo: true,
        entregaMotoboyAtivo: true
      };
    },

  /**
   * Valida número de WhatsApp
   * @param {string} numero 
   * @returns {boolean}
   */
  validarWhatsApp(numero) {
    // Remove caracteres não numéricos
    const apenasNumeros = numero.replace(/\D/g, '');

    // Valida se tem entre 10 e 15 dígitos
    return apenasNumeros.length >= 10 && apenasNumeros.length <= 15;
  },

  /**
   * Formata número de WhatsApp para display
   * @param {string} numero 
   * @returns {string}
   */
  formatarWhatsApp(numero) {
    const apenasNumeros = numero.replace(/\D/g, '');

    if (apenasNumeros.length === 13) {
      // +55 11 99999-9999
      return `+${apenasNumeros.slice(0, 2)} ${apenasNumeros.slice(2, 4)} ${apenasNumeros.slice(4, 9)}-${apenasNumeros.slice(9)}`;
    }

    return numero;
  },

  setCache(data) {
    this.memoryCache = data;
    this.memoryCacheAt = Date.now();
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({ data, at: this.memoryCacheAt }));
    } catch (e) {
      // ignore
    }
  },

  getCache() {
    try {
      const raw = localStorage.getItem(this.cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.data || !parsed.at) return null;
      if (Date.now() - parsed.at > this.cacheTtl) return null;
      return parsed.data;
    } catch (e) {
      return null;
    }
  }
};

// Exportar
window.ConfigService = ConfigService;


