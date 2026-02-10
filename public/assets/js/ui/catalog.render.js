/**
 * Catalog Render
 */

const CatalogRender = {
  config: null,
  produtosTodos: [],
  categoriaAtual: 'todas',
  tipoFiltro: 'todos',

  renderizarPorCategorias(produtos) {
    this.produtosTodos = produtos;
    const container = document.getElementById('produtosPorCategoria');

    if (!container) return;

    if (produtos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Nenhum produto encontrado</p>
        </div>
      `;
      return;
    }

    let produtosFiltrados = produtos;
    if (this.tipoFiltro !== 'todos') {
      produtosFiltrados = this.filtrarPorTipo(produtos, this.tipoFiltro);
    }

    const produtosPorCategoria = this.agruparPorCategoria(produtosFiltrados);

    this.renderizarMenuTipos();
    this.renderizarMenuCategorias(produtosPorCategoria);

    let html = '';

    if (this.categoriaAtual === 'todas') {
      for (const [categoria, prods] of Object.entries(produtosPorCategoria)) {
        html += this.criarSecaoCategoria(categoria, prods);
      }
    } else {
      const prods = produtosPorCategoria[this.categoriaAtual];
      if (prods && prods.length > 0) {
        html += this.criarSecaoCategoria(this.categoriaAtual, prods);
      }
    }

    container.innerHTML = html || '<div class="empty-state"><p>Nenhum produto nesta categoria</p></div>';
    if (window.CartService && typeof CartService.renderDeliveryOptions === 'function') {
      CartService.renderDeliveryOptions();
    }
    this.configurarEventListeners();
  },

  getTiposMenu() {
    const tiposConfig = (this.config?.tiposProduto || []).filter(t => t.ativo !== false);
    if (tiposConfig.length > 0) {
      return tiposConfig.map(t => ({ id: t.id, nome: t.nome }));
    }

    const nomes = [...new Set(this.produtosTodos.map(p => p.tipoProdutoNome).filter(Boolean))];
    return nomes.map(nome => ({ id: nome, nome }));
  },

  filtrarPorTipo(produtos, tipo) {
    if (tipo === 'todos') return produtos;

    const tiposConfig = (this.config?.tiposProduto || []).reduce((acc, t) => {
      acc[t.id] = t;
      return acc;
    }, {});

    if (tiposConfig[tipo]) {
      const tipoNome = String(tiposConfig[tipo].nome || '').toLowerCase();
      return produtos.filter(p =>
        p.tipoProdutoId === tipo ||
        (p.tipoProdutoNome && String(p.tipoProdutoNome).toLowerCase() === tipoNome)
      );
    }

    const tipoLower = String(tipo).toLowerCase();
    return produtos.filter(p =>
      p.tipoProdutoNome && String(p.tipoProdutoNome).toLowerCase() === tipoLower
    );
  },

  renderizarMenuTipos() {
    const tiposMenu = this.getTiposMenu();
    if (tiposMenu.length === 0) return;

    let menuTipos = document.getElementById('menuTipos');
    if (!menuTipos) {
      const header = document.querySelector('.header');
      if (!header) return;

      const menuContainer = document.createElement('div');
      menuContainer.className = 'menu-tipos-container';
      menuContainer.id = 'menuTipos';
      header.appendChild(menuContainer);
      menuTipos = menuContainer;
    }

    const buttons = [
      `<button class="tipo-btn ${this.tipoFiltro === 'todos' ? 'active' : ''}" data-tipo="todos">Todos</button>`,
      ...tiposMenu.map(tipo => {
        const nome = DomUtils.escapeHtml(tipo.nome);
        const ativo = this.tipoFiltro === tipo.id ? 'active' : '';
        return `<button class="tipo-btn ${ativo}" data-tipo="${tipo.id}">${nome}</button>`;
      })
    ];

    menuTipos.innerHTML = buttons.join('');
    this.configurarMenuTipos();
  },

  configurarMenuTipos() {
    const menuTipos = document.getElementById('menuTipos');
    if (!menuTipos) return;

    menuTipos.querySelectorAll('.tipo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.tipoFiltro = btn.dataset.tipo;
        this.categoriaAtual = 'todas';
        this.renderizarPorCategorias(this.produtosTodos);
      });
    });
  },

  agruparPorCategoria(produtos) {
    const agrupados = {};

    produtos.forEach(produto => {
      const categoria = produto.categoria || 'Sem Categoria';
      if (!agrupados[categoria]) {
        agrupados[categoria] = [];
      }
      agrupados[categoria].push(produto);
    });

    return agrupados;
  },

  renderizarMenuCategorias(produtosPorCategoria) {
    const categoriasProdutos = Object.keys(produtosPorCategoria);

    let categoriasMenu = [];
    const categoriasConfig = (this.config?.categorias || []).filter(c => c.ativo !== false);

    if (categoriasConfig.length > 0) {
      categoriasMenu = categoriasConfig
        .map(c => c.nome)
        .filter(nome => categoriasProdutos.includes(nome));
    } else if (this.config?.menuCategorias && this.config.menuCategorias.length > 0) {
      categoriasMenu = this.config.menuCategorias.filter(cat => categoriasProdutos.includes(cat));
    } else {
      categoriasMenu = categoriasProdutos;
    }

    const menuDesktopNav = document.getElementById('menuDesktopList');
    if (menuDesktopNav) {
      const categoriasHtmlNav = categoriasMenu.map(cat => {
        const texto = DomUtils.escapeHtml(cat);
        return `<li><a href="#" class="menu-link" data-categoria="${texto}">${texto}</a></li>`;
      }).join('');

      const linksHtml = this.renderizarMenuLinksDesktop();

      menuDesktopNav.innerHTML = `
        <li><a href="#" class="menu-link active" data-categoria="todas">Início</a></li>
        ${categoriasHtmlNav}
        ${linksHtml}
      `;

      menuDesktopNav.querySelectorAll('.menu-link[data-categoria]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          menuDesktopNav.querySelectorAll('.menu-link[data-categoria]').forEach(l => l.classList.remove('active'));
          link.classList.add('active');

          this.categoriaAtual = link.dataset.categoria;
          this.renderizarPorCategorias(this.produtosTodos);
          document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }
  },

  renderizarMenuLinksDesktop() {
    const menuLinks = (this.config?.menuLinks || []).filter(link => link.ativo !== false);
    if (menuLinks.length === 0) return '';

    return menuLinks.map(link => {
      const texto = DomUtils.escapeHtml(link.texto || 'Link');
      const icone = DomUtils.escapeHtml(link.icone || '');
      const url = DomUtils.sanitizeUrl(link.url || '#');
      const target = link.abrirNovaAba ? 'target="_blank" rel="noopener noreferrer"' : '';
      const destaque = link.destacado ? 'destaque' : '';

      return `<li><a href="${url}" class="menu-link ${destaque}">${icone ? icone + ' ' : ''}${texto}</a></li>`;
    }).join('');
  },

  renderizarMenuMobile(produtos) {
    const menuMobile = document.getElementById('mobileMenuCategorias');
    if (!menuMobile) return;

    const produtosPorCategoria = this.agruparPorCategoria(produtos);
    const categoriasProdutos = Object.keys(produtosPorCategoria);

    let categoriasMenu = [];
    const categoriasConfig = (this.config?.categorias || []).filter(c => c.ativo !== false);

    if (categoriasConfig.length > 0) {
      categoriasMenu = categoriasConfig
        .map(c => c.nome)
        .filter(nome => categoriasProdutos.includes(nome));
    } else if (this.config?.menuCategorias && this.config.menuCategorias.length > 0) {
      categoriasMenu = this.config.menuCategorias.filter(cat => categoriasProdutos.includes(cat));
    } else {
      categoriasMenu = categoriasProdutos;
    }

    const categoriasHtml = categoriasMenu.map(cat => {
      const texto = DomUtils.escapeHtml(cat);
      return `
        <button class="mobile-categoria-item" data-categoria="${texto}">
          <span class="categoria-nome">${texto}</span>
          <span class="categoria-count">${produtosPorCategoria[cat].length}</span>
        </button>
      `;
    }).join('');

    const btnTodas = `
      <button class="mobile-categoria-item active" data-categoria="todas">
        <span class="categoria-nome">Todas</span>
        <span class="categoria-count">${produtos.length}</span>
      </button>
    `;

    const menuLinks = (this.config?.menuLinks || []).filter(link => link.ativo !== false);
    const linksHtml = menuLinks.length > 0
      ? `
        <div class="mobile-menu-links">
          ${menuLinks.map(link => {
            const texto = DomUtils.escapeHtml(link.texto || 'Link');
            const icone = DomUtils.escapeHtml(link.icone || '');
            const url = DomUtils.sanitizeUrl(link.url || '#');
            const target = link.abrirNovaAba ? 'target="_blank" rel="noopener noreferrer"' : '';
            return `<a class="mobile-menu-link" href="${url}" ${target}>${icone ? icone + ' ' : ''}${texto}</a>`;
          }).join('')}
        </div>
      `
      : '';

    menuMobile.innerHTML = btnTodas + categoriasHtml + linksHtml;

    menuMobile.querySelectorAll('.mobile-categoria-item').forEach(btn => {
      btn.addEventListener('click', () => {
        menuMobile.querySelectorAll('.mobile-categoria-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.categoriaAtual = btn.dataset.categoria;
        this.renderizarPorCategorias(this.produtosTodos);

        if (window.MenuService) {
          MenuService.close();
        }
      });
    });
  },

  criarSecaoCategoria(categoria, produtos) {
    const titulo = DomUtils.escapeHtml(categoria);
    return `
      <div class="categoria-secao">
        <h3 class="categoria-titulo">${titulo}</h3>
        <div class="produtos-grid">
          ${produtos.map(p => this.criarCardProduto(p)).join('')}
        </div>
      </div>
    `;
  },

  criarCardProduto(produto) {
    const parcelasSemJuros = this.config.parcelasSemJuros || 3;
    const valorMinParcela = this.config.valorMinimoParcela || 0;

    const precoCartao = Number(produto.precoCartao || 0);
    const precoPix = Number(produto.precoPix || 0);

    const descontoReal = precoCartao > 0
      ? Math.round(((precoCartao - precoPix) / precoCartao) * 100)
      : 0;

    let parcelasValidas = parcelasSemJuros;
    if (valorMinParcela > 0) {
      parcelasValidas = Math.min(parcelasSemJuros, Math.floor(precoCartao / valorMinParcela));
    }

    const parcelasTexto = this.config.exibirParcelas !== false && parcelasValidas > 1
      ? `até ${parcelasValidas}x de R$ ${this.formatarPreco(precoCartao / parcelasValidas)} Sem juros`
      : '';

    const tipoBadge = produto.tipoProdutoNome
      ? `<span class="tipo-badge">${DomUtils.escapeHtml(produto.tipoProdutoNome)}</span>`
      : '';

    const tipoConfig = (this.config?.tiposProduto || []).find(t => t.id === produto.tipoProdutoId);
    const tipoNomeLower = String(produto.tipoProdutoNome || '').toLowerCase();
    const labelTamanhoBase = tipoNomeLower.includes('tenis') ? 'Numeração' : 'Tamanho';
    const labelTamanho = DomUtils.escapeHtml(tipoConfig?.nomePropriedade || labelTamanhoBase);

    const tamanhos = Array.isArray(produto.tamanhos) && produto.tamanhos.length > 0
      ? produto.tamanhos
      : (tipoConfig?.opcoesTamanho || []);

    const tamanhosHtml = tamanhos.map(tamanho => `
      <label class="tamanho-radio">
        <input type="radio" name="tamanho-${produto.id}" value="${DomUtils.escapeHtml(tamanho)}">
        <span>${DomUtils.escapeHtml(tamanho)}</span>
      </label>
    `).join('');

    const pagamentos = [
      {
        key: 'pix',
        label: `PIX - R$ ${this.formatarPreco(precoPix)}`,
        preco: precoPix,
        checked: true
      },
      {
        key: 'cartao',
        label: `Cartão - R$ ${this.formatarPreco(precoCartao)}`,
        preco: precoCartao,
        checked: false
      }
    ];

    if (this.config.aceitaDinheiro) {
      pagamentos.push({
        key: 'dinheiro',
        label: `Dinheiro - R$ ${this.formatarPreco(precoPix)}`,
        preco: precoPix,
        checked: false
      });
    }

    if (this.config.aceitaBoleto) {
      pagamentos.push({
        key: 'boleto',
        label: `Boleto - R$ ${this.formatarPreco(precoCartao)}`,
        preco: precoCartao,
        checked: false
      });
    }

    const pagamentosHtml = pagamentos.map(p => `
      <label class="pagamento-radio">
        <input type="radio" name="pagamento-${produto.id}" value="${p.key}" data-preco="${p.preco}" ${p.checked ? 'checked' : ''}>
        <span>${p.label}</span>
      </label>
    `).join('');

    const observacoesPagamento = this.config.observacoesPagamento
      ? `<small class="parcelas-info">${DomUtils.escapeHtml(this.config.observacoesPagamento)}</small>`
      : '';

    const imagem = DomUtils.sanitizeUrl(produto.imagemUrl || '');
    const nome = DomUtils.escapeHtml(produto.nome || '');
    const marca = DomUtils.escapeHtml(produto.marca || '');
    const entregaSelecionada = window.CartService && CartService.getDeliveryLabel
      ? CartService.getDeliveryLabel()
      : '';
    let entregaLabel = entregaSelecionada;
    if (!entregaLabel) {
      if (this.config?.entregaRetiradaAtivo === false && this.config?.entregaMotoboyAtivo !== false) {
        entregaLabel = 'Entrega via Motoboy';
      } else if (this.config?.entregaMotoboyAtivo === false && this.config?.entregaRetiradaAtivo !== false) {
        entregaLabel = 'Retirar na Loja';
      } else {
        entregaLabel = 'Selecione no topo';
      }
    }

    return `
      <div class="produto-card" data-produto-id="${produto.id}">
        <div class="produto-imagem">
          <img src="${imagem}" alt="${nome}" loading="lazy">
          ${tipoBadge}
        </div>
        <div class="produto-info">
          <span class="produto-marca">${marca}</span>
          <h3 class="produto-nome">${nome}</h3>

          <div class="produto-precos">
            <div class="preco-item">
              <span class="preco-label">Cartão</span>
              <span class="preco-valor">R$ ${this.formatarPreco(precoCartao)}</span>
              ${parcelasTexto ? `<small class="parcelas-info">${parcelasTexto}</small>` : ''}
            </div>
            <div class="preco-item destaque">
              ${this.config.exibirDescontoPix !== false && descontoReal > 0 ? `<span class="desconto-badge">${descontoReal}% OFF</span>` : ''}
              <span class="preco-label">PIX</span>
              <span class="preco-valor">R$ ${this.formatarPreco(precoPix)}</span>
            </div>
          </div>

          <div class="produto-tamanhos">
            <label>${labelTamanho}:</label>
            <div class="tamanhos-opcoes">
              ${tamanhosHtml}
            </div>
          </div>

          <div class="produto-pagamento">
            <label>Forma de Pagamento:</label>
            <div class="pagamento-opcoes">
              ${pagamentosHtml}
              ${observacoesPagamento}
            </div>
          </div>

          <div class="produto-entrega" data-entrega-info>
            <label>Tipo de entrega:</label>
            <div class="produto-entrega-opcoes" data-entrega-options></div>
          </div>

          <div class="produto-actions">
            <button class="btn-add-cart" onclick="CatalogRender.adicionarAoCarrinho('${produto.id}')">
              Adicionar ao Carrinho
            </button>
            <button class="btn-whatsapp" onclick="CatalogRender.enviarWhatsApp('${produto.id}')">
              Comprar no WhatsApp
            </button>
          </div>
        </div>
      </div>
    `;
  },

  adicionarAoCarrinho(produtoId) {
    const card = document.querySelector(`[data-produto-id="${produtoId}"]`);
    if (!card) return;

    const tamanhoRadio = card.querySelector(`input[name="tamanho-${produtoId}"]:checked`);
    if (!tamanhoRadio) {
      if (window.InlineAlert) {
        InlineAlert.show('Por favor, selecione um tamanho.', 'warning');
      }
      return;
    }

    const pagamentoRadio = card.querySelector(`input[name="pagamento-${produtoId}"]:checked`);
    if (!pagamentoRadio) {
      if (window.InlineAlert) {
        InlineAlert.show('Selecione a forma de pagamento.', 'warning');
      }
      return;
    }

    const formaPagamento = pagamentoRadio.value.toUpperCase();
    const preco = Number(pagamentoRadio.dataset.preco || 0);

    const produto = this.produtosTodos.find(p => p.id === produtoId);

    if (window.CartService) {
      const added = CartService.addItem(produto, tamanhoRadio.value, formaPagamento, preco);
      if (added) {
        if (window.TrackingService) {
          TrackingService.trackAddToCart({
            nome: produto.nome,
            marca: produto.marca,
            tamanho: tamanhoRadio.value,
            pagamento: formaPagamento,
            valor: preco
          });
        }
        if (window.DataService) {
          DataService.registrarEvento('add_to_cart', {
            produtoId,
            produtoNome: produto.nome,
            valor: preco
          });
        }
      }
    } else if (window.InlineAlert) {
      InlineAlert.show('Carrinho não disponível no momento.', 'error');
    }
  },

  formatarPreco(preco) {
    return Number(preco || 0).toFixed(2).replace('.', ',');
  },

  configurarEventListeners() {
    const btnFiltros = document.getElementById('btnFiltrosMobile');
    const sidebar = document.getElementById('filtrosSidebar');
    const overlay = document.getElementById('filtrosOverlay');
    const btnFechar = document.getElementById('btnFecharFiltros');

    if (btnFiltros) {
      btnFiltros.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
      });
    }

    if (btnFechar) {
      btnFechar.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      });
    }
  },

  async enviarWhatsApp(produtoId) {
    const card = document.querySelector(`[data-produto-id="${produtoId}"]`);
    if (!card) return;

    if (!this.podeAtenderAgora()) {
      return;
    }

    const tamanhoRadio = card.querySelector(`input[name="tamanho-${produtoId}"]:checked`);
    if (!tamanhoRadio) {
      if (window.InlineAlert) {
        InlineAlert.show('Por favor, selecione um tamanho.', 'warning');
      }
      return;
    }

    const pagamentoRadio = card.querySelector(`input[name="pagamento-${produtoId}"]:checked`);
    if (!pagamentoRadio) {
      if (window.InlineAlert) {
        InlineAlert.show('Selecione a forma de pagamento.', 'warning');
      }
      return;
    }

    const formaPagamento = pagamentoRadio.value.toUpperCase();

    const nome = card.querySelector('.produto-nome').textContent;
    const marca = card.querySelector('.produto-marca').textContent;
    const tamanho = tamanhoRadio.value;

    const precoText = pagamentoRadio.parentElement.querySelector('span').textContent;
    const preco = precoText.match(/R\$ ([\d,]+)/)[1];
    const valorNumerico = parseFloat(preco.replace(',', '.'));

    let mensagem = this.config.mensagemPadrao || '';
    const entregaTexto = window.CartService && CartService.getDeliveryLabel
      ? CartService.getDeliveryLabel()
      : '';
    const freteValor = entregaTexto === 'Entrega via Motoboy'
      ? Number(this.config.taxaMotoboy || 0)
      : 0;
    const freteTexto = Number(freteValor || 0).toFixed(2).replace('.', ',');

    mensagem = mensagem
      .replace(/{produto}/g, nome)
      .replace(/{marca}/g, marca)
      .replace(/{tamanho}/g, tamanho)
      .replace(/{pagamento}/g, formaPagamento)
      .replace(/{entrega}/g, entregaTexto || 'Retirar na Loja')
      .replace(/{frete}/g, freteTexto)
      .replace(/{valor}/g, preco);

    await DataService.registrarCliqueWhatsApp({
      produtoId,
      produtoNome: nome
    });

    if (window.TrackingService) {
      TrackingService.trackWhatsAppClick({
        nome: nome,
        marca: marca,
        tamanho: tamanho,
        pagamento: formaPagamento,
        valor: valorNumerico
      });
    }

    const numeroWhatsapp = String(this.config.whatsapp || '').replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');
  },

  podeAtenderAgora() {
    if (!this.config.exibirHorario) return true;

    const agora = new Date();
    const dia = agora.getDay();

    if (dia === 0 && !this.config.atendeDOM) {
      if (window.InlineAlert) {
        InlineAlert.show(this.config.mensagemForaHorario || 'Fora do horário de atendimento.', 'warning');
      }
      return this.config.permitirForaHorario === true;
    }

    let inicio = this.config.horarioSegSexInicio;
    let fim = this.config.horarioSegSexFim;

    if (dia === 6) {
      inicio = this.config.horarioSabInicio;
      fim = this.config.horarioSabFim;
    }

    if (!inicio || !fim) return true;

    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    const [hInicio, mInicio] = inicio.split(':').map(Number);
    const [hFim, mFim] = fim.split(':').map(Number);

    const minutosInicio = hInicio * 60 + mInicio;
    const minutosFim = hFim * 60 + mFim;

    if (minutosAgora < minutosInicio || minutosAgora > minutosFim) {
      if (window.InlineAlert) {
        InlineAlert.show(this.config.mensagemForaHorario || 'Fora do horário de atendimento.', 'warning');
      }
      return this.config.permitirForaHorario === true;
    }

    return true;
  },

  setConfig(config) {
    this.config = config;
    this.aplicarCustomizacao(config);
  },

  aplicarCustomizacao(config) {
    if (!config.customizacao) return;

    const root = document.documentElement;
    const custom = config.customizacao;

    if (custom.corPrimaria) root.style.setProperty('--primary', custom.corPrimaria);
    if (custom.corSecundaria) root.style.setProperty('--success', custom.corSecundaria);
    if (custom.corFundo) root.style.setProperty('--bg-dark', custom.corFundo);
    if (custom.corTexto) root.style.setProperty('--text-primary', custom.corTexto);
    if (custom.corHeaderBg) root.style.setProperty('--header-bg', custom.corHeaderBg);
    if (custom.corMenuTexto) root.style.setProperty('--menu-text', custom.corMenuTexto);
    if (custom.corCardBg) root.style.setProperty('--card-bg', custom.corCardBg);
    if (custom.corCardBorda) root.style.setProperty('--card-border', custom.corCardBorda);
    if (custom.corFooterBg) root.style.setProperty('--footer-bg', custom.corFooterBg);
    if (custom.corFooterTexto) root.style.setProperty('--footer-text', custom.corFooterTexto);
    if (custom.corBotaoPrimario) root.style.setProperty('--btn-primary-bg', custom.corBotaoPrimario);
    if (custom.corBotaoPrimarioHover) root.style.setProperty('--btn-primary-hover-bg', custom.corBotaoPrimarioHover);
    if (custom.corBotaoPrimarioTextoCor) root.style.setProperty('--btn-primary-text', custom.corBotaoPrimarioTextoCor);
    if (custom.corBotaoOutline) {
      root.style.setProperty('--btn-outline-border', custom.corBotaoOutline);
      root.style.setProperty('--btn-outline-text', custom.corBotaoOutline);
    }
    if (custom.corBotaoOutlineHover) {
      root.style.setProperty('--btn-outline-hover-bg', custom.corBotaoOutlineHover);
      root.style.setProperty('--btn-outline-hover-border', custom.corBotaoOutlineHover);
    }
    if (custom.corBotaoOutlineHoverTextoCor) root.style.setProperty('--btn-outline-hover-text', custom.corBotaoOutlineHoverTextoCor);
    if (custom.corBotaoWhatsapp) root.style.setProperty('--btn-whatsapp-bg', custom.corBotaoWhatsapp);
    if (custom.corBotaoWhatsappHover) root.style.setProperty('--btn-whatsapp-hover-bg', custom.corBotaoWhatsappHover);
    if (custom.corBotaoWhatsappTextoCor) root.style.setProperty('--btn-whatsapp-text', custom.corBotaoWhatsappTextoCor);
    if (custom.corBotaoWhatsappTextoCor) root.style.setProperty('--btn-whatsapp-hover-text', custom.corBotaoWhatsappTextoCor);
  },

  mostrarLoading() {
    const container = document.getElementById('produtosPorCategoria');
    if (container) {
      container.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Carregando produtos...</p>
        </div>
      `;
    }
  }
};

window.CatalogRender = CatalogRender;

