/**
 * Catalog App Bootstrap
 */

const InlineAlert = {
  timeoutId: null,

  show(message, type = 'info', duration = 4500) {
    const container = document.getElementById('inlineAlert');
    if (!container) return;

    container.textContent = message;
    container.className = `inline-alert inline-alert--${type} show`;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    if (duration > 0) {
      this.timeoutId = setTimeout(() => {
        this.clear();
      }, duration);
    }
  },

  clear() {
    const container = document.getElementById('inlineAlert');
    if (!container) return;

    container.className = 'inline-alert';
    container.textContent = '';
  }
};

window.InlineAlert = InlineAlert;

const CatalogState = {
  produtos: [],
  carregando: false,
  hasMore: true
};

function atualizarBotaoCarregarMais() {
  const btn = document.getElementById('btnCarregarMais');
  const wrapper = document.getElementById('carregarMaisWrapper');
  if (!btn || !wrapper) return;

  if (CatalogState.hasMore) {
    wrapper.style.display = 'flex';
    btn.disabled = CatalogState.carregando;
    btn.textContent = CatalogState.carregando ? 'Carregando...' : 'Carregar mais produtos';
  } else {
    wrapper.style.display = 'none';
  }
}

function atualizarCatalogo(produtos, config) {
  if (Filters.initialized) {
    Filters.atualizarProdutos(produtos);
    Filters.aplicarFiltros();
  } else {
    Filters.init(produtos, config);
    Filters.atualizarContadores(produtos.length);
    CatalogRender.renderizarPorCategorias(produtos);
  }

  CatalogRender.renderizarMenuMobile(produtos);
}

async function inicializarCatalogo() {
  try {
    ThemeService.init();
    MenuService.init();
    CartService.init();
    FirebaseCore.init();
    DataService.init();

    const config = await DataService.buscarConfig();

    document.getElementById('nomeLojaFooter').textContent = config.nomeLoja;
    document.title = `${config.nomeLoja} - Catálogo`;

    const logoContainer = document.getElementById('logoContainer');
    const logoContainerMobile = document.getElementById('logoContainerMobile');
    const logoUrl = DomUtils.sanitizeUrl(config.logoUrl || '');

    if (logoUrl) {
      const img = document.createElement('img');
      img.src = logoUrl;
      img.alt = config.nomeLoja;
      img.className = 'logo-img';

      if (logoContainer) {
        logoContainer.innerHTML = '';
        logoContainer.appendChild(img.cloneNode(true));
      }
      if (logoContainerMobile) {
        logoContainerMobile.innerHTML = '';
        logoContainerMobile.appendChild(img);
      }
    } else {
      const nomeEl = document.getElementById('nomeLoja');
      if (nomeEl) nomeEl.textContent = config.nomeLoja;
      const nomeMobile = document.getElementById('nomeLojaMobile');
      if (nomeMobile) nomeMobile.textContent = config.nomeLoja;
    }

    CatalogRender.setConfig(config);

    const avisoDiv = document.getElementById('avisoEntrega');
    if (config.exibirTaxaEntrega !== false && config.entregaMotoboyAtivo !== false) {
      const avisoTextoEl = document.querySelector('#avisoEntrega .aviso-texto');
      const avisoIcon = document.querySelector('#avisoEntrega .aviso-icon');
      const taxa = Number(config.taxaMotoboy || 0);
      const taxaTexto = `R$ ${taxa.toFixed(2).replace('.', ',')}`;
      const template = String(config.avisoEntregaTexto || 'Taxa de Entrega via Motoboy: {taxa}');
      if (avisoIcon) {
        avisoIcon.style.display = template.includes('🏍️') || template.includes('🛵')
          ? 'none'
          : 'inline-flex';
      }
      if (avisoTextoEl) {
        DomUtils.clear(avisoTextoEl);
        const parts = template.split('{taxa}');
        if (parts.length === 1) {
          avisoTextoEl.textContent = template;
        } else {
          avisoTextoEl.appendChild(document.createTextNode(parts[0]));
          const strong = document.createElement('strong');
          strong.textContent = taxaTexto;
          avisoTextoEl.appendChild(strong);
          avisoTextoEl.appendChild(document.createTextNode(parts.slice(1).join('{taxa}')));
        }
      }
      if (avisoDiv) avisoDiv.style.display = 'block';
    } else if (avisoDiv) {
      avisoDiv.style.display = 'none';
    }

    const heroSection = document.getElementById('heroSection');
    if (config.heroTitulo && config.heroTitulo.trim() !== '') {
      const heroTitle = document.getElementById('heroTitle');
      const heroSubtitle = document.getElementById('heroSubtitle');
      if (heroTitle) heroTitle.textContent = config.heroTitulo;
      if (heroSubtitle) heroSubtitle.textContent = config.heroSubtitulo || 'Os melhores produtos com os melhores preços';
      if (heroSection) heroSection.style.display = 'block';
    }

    BannerSlider.init(config.banners || [], config);

    if (config.avisoTexto && config.avisoTexto.trim() !== '') {
      const popupOverlay = document.getElementById('popupOverlay');
      const popupText = document.getElementById('popupText');
      const popupTitle = document.getElementById('popupTitle');
      const btnPopup = document.getElementById('btnPopup');
      const btnPopupClose = document.getElementById('btnPopupClose');
      const popupClose = document.getElementById('popupClose');

      if (popupTitle) popupTitle.textContent = config.avisoTitulo || 'Aviso Importante';
      if (popupText) popupText.textContent = config.avisoTexto;

      if (btnPopup && config.avisoBotaoTexto && config.avisoBotaoUrl) {
        btnPopup.textContent = config.avisoBotaoTexto;
        btnPopup.href = DomUtils.sanitizeUrl(config.avisoBotaoUrl);
        btnPopup.style.display = 'inline-block';
      } else if (btnPopup) {
        btnPopup.style.display = 'none';
      }

      if (popupOverlay) {
        popupOverlay.style.display = 'flex';
      }

      const fecharPopup = () => {
        if (popupOverlay) popupOverlay.style.display = 'none';
        localStorage.setItem('popupFechadoAt', String(Date.now()));
      };

      if (btnPopupClose) btnPopupClose.addEventListener('click', fecharPopup);
      if (popupClose) popupClose.addEventListener('click', fecharPopup);
      if (popupOverlay) {
        popupOverlay.addEventListener('click', (e) => {
          if (e.target === popupOverlay) fecharPopup();
        });
      }

      const cachedAt = Number(localStorage.getItem('popupFechadoAt') || 0);
      const cacheWindow = 24 * 60 * 60 * 1000;
      if (cachedAt && Date.now() - cachedAt < cacheWindow) {
        if (popupOverlay) popupOverlay.style.display = 'none';
      }
    }

    if (config.telefone) {
      document.getElementById('footerTelefone').style.display = 'flex';
      document.getElementById('footerTelefoneText').textContent = config.telefone;
    }
    if (config.email) {
      document.getElementById('footerEmail').style.display = 'flex';
      document.getElementById('footerEmailText').textContent = config.email;
    }
    if (config.endereco) {
      document.getElementById('footerEndereco').style.display = 'flex';
      document.getElementById('footerEnderecoText').textContent = config.endereco;
    }
    if (config.whatsapp) {
      const numeroWhatsapp = String(config.whatsapp || '').replace(/\D/g, '');
      document.getElementById('footerWhatsApp').style.display = 'flex';
      document.getElementById('footerWhatsAppText').textContent = numeroWhatsapp.replace(/^55/, '');
    }

    document.getElementById('footerNomeLoja').textContent = config.nomeLoja;
    const footerDescricao = document.getElementById('footerDescricao');
    if (footerDescricao) {
      footerDescricao.textContent = config.footerTexto || 'Sua loja de confiança com os melhores produtos e preços.';
    }

    const footerLinks = document.getElementById('footerLinksList');
    if (footerLinks) {
      const links = (config.menuLinks || []).filter(l => l.ativo !== false).slice(0, 4);
      const paginas = (config.paginas || []).filter(p => p.ativo !== false);
      const paginasHtml = paginas.map(p => {
        const titulo = DomUtils.escapeHtml(p.titulo || 'Página');
        const slug = encodeURIComponent(String(p.slug || '').trim());
        return `<li><a href="pagina.html?slug=${slug}">${titulo}</a></li>`;
      }).join('');
      const linksHtml = links.map(link => {
        const texto = DomUtils.escapeHtml(link.texto || 'Link');
        const url = DomUtils.sanitizeUrl(link.url || '#');
        const target = link.abrirNovaAba ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<li><a href="${url}"${target}>${texto}</a></li>`;
      }).join('');

      footerLinks.innerHTML = `<li><a href="#produtos">Produtos</a></li>${paginasHtml}${linksHtml}`;
    }

    const footerSocial = document.getElementById('footerSocial');
    if (footerSocial) {
      const redes = (config.redesSociais || []).filter(r => r.ativo !== false);
      footerSocial.innerHTML = redes.map(rede => {
        const nome = DomUtils.escapeHtml(rede.nome || rede.tipo || 'Rede');
        const icone = DomUtils.escapeHtml(rede.icone || '');
        const url = DomUtils.sanitizeUrl(rede.url || '#');
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${nome}">${icone || nome}</a>`;
      }).join('');
    }

    if (config.whatsappFlutuante !== false) {
      const whatsappDiv = document.getElementById('whatsappFlutuante');
      const tooltip = document.getElementById('whatsappTooltip');
      const btn = document.getElementById('whatsappBtnFlutuante');
      const numeroWhatsapp = String(config.whatsapp || '').replace(/\D/g, '');

      if (tooltip) {
        tooltip.textContent = config.whatsappMensagemFlutuante || 'Precisa de Ajuda?';
      }

      if (btn) {
        const mensagemInicial = config.whatsappMensagemInicial
          ? `?text=${encodeURIComponent(config.whatsappMensagemInicial)}`
          : '';
        btn.href = `https://wa.me/${numeroWhatsapp}${mensagemInicial}`;
        btn.addEventListener('click', () => {
          TrackingService.trackGTMEvent('whatsapp_floating_click', { source: 'floating_button' });
          TrackingService.trackGAEvent('contact', { event_category: 'WhatsApp', event_label: 'floating_button' });
          DataService.registrarEvento('whatsapp_floating_click', { source: 'floating_button' });
        });
      }

      if (whatsappDiv) whatsappDiv.style.display = 'block';
    }

    TrackingService.init(config);

    CatalogRender.mostrarLoading();

    if (window.CartService) {
      CartService.setDeliveryOptions(config);
    }

    const cached = DataService.getCachedProdutos();
    if (cached && cached.length > 0) {
      CatalogState.produtos = cached;
      atualizarCatalogo(cached, config);
    }

    DataService.resetProdutosPaginacao();
    const primeiraPagina = await DataService.buscarProdutosPaginados();
    if (primeiraPagina.items.length > 0) {
      CatalogState.produtos = primeiraPagina.items;
      DataService.setCachedProdutos(primeiraPagina.items);
      atualizarCatalogo(primeiraPagina.items, config);
    } else if (!cached || cached.length === 0) {
      CatalogRender.renderizarPorCategorias([]);
      Filters.init([], config);
      Filters.atualizarContadores(0);
    }

    CatalogState.hasMore = primeiraPagina.hasMore;
    atualizarBotaoCarregarMais();

    const themeToggleMobile = document.getElementById('themeToggleMobile');
    if (themeToggleMobile) {
      themeToggleMobile.addEventListener('click', () => {
        ThemeService.toggle();
      });
    }

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        ThemeService.toggle();
      });
    }

    const btnCart = document.getElementById('btnCart');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartClose = document.getElementById('cartClose');
    const btnCartCheckout = document.getElementById('btnCartCheckout');

    const abrirCarrinho = () => {
      cartSidebar.classList.add('active');
      cartOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const fecharCarrinho = () => {
      cartSidebar.classList.remove('active');
      cartOverlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (btnCart) btnCart.addEventListener('click', abrirCarrinho);
    if (cartClose) cartClose.addEventListener('click', fecharCarrinho);
    if (cartOverlay) cartOverlay.addEventListener('click', fecharCarrinho);

    if (btnCartCheckout) {
      btnCartCheckout.addEventListener('click', () => {
        if (CartService.items.length === 0) {
          InlineAlert.show('Seu carrinho está vazio.', 'warning');
          return;
        }

        if (!CatalogRender.podeAtenderAgora()) {
          return;
        }

        const numeroWhatsapp = String(config.whatsapp || '').replace(/\D/g, '');
        const mensagem = CartService.generateWhatsAppMessage(config);
        const whatsappUrl = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensagem)}`;
        window.open(whatsappUrl, '_blank');

        TrackingService.trackBeginCheckout({
          total: CartService.getTotalValue(),
          items: CartService.items.length
        });

        DataService.registrarEvento('checkout_whatsapp', {
          total: CartService.getTotalValue(),
          items: CartService.items.length
        });
      });
    }

    const headerSearch = document.getElementById('headerSearch');
    if (headerSearch) {
      headerSearch.addEventListener('input', (e) => {
        Filters.termoBusca = e.target.value.toLowerCase();
        Filters.aplicarFiltros();
      });
    }

    const viewToggles = document.querySelectorAll('.btn-view-toggle');
    viewToggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        const container = document.getElementById('produtosPorCategoria');

        viewToggles.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (view === 'list') {
          container.classList.add('view-list');
          container.querySelectorAll('.produtos-grid').forEach(grid => {
            grid.classList.add('list-view');
          });
        } else {
          container.classList.remove('view-list');
          container.querySelectorAll('.produtos-grid').forEach(grid => {
            grid.classList.remove('list-view');
          });
        }
      });
    });

    await DataService.registrarVisualizacao();

    const btnCarregarMais = document.getElementById('btnCarregarMais');
    if (btnCarregarMais) {
      btnCarregarMais.addEventListener('click', async () => {
        if (CatalogState.carregando || !CatalogState.hasMore) return;

        CatalogState.carregando = true;
        atualizarBotaoCarregarMais();

        const resposta = await DataService.buscarProdutosPaginados();
        if (resposta.items.length > 0) {
          CatalogState.produtos = CatalogState.produtos.concat(resposta.items);
          DataService.setCachedProdutos(CatalogState.produtos);
          if (Filters.initialized) {
            Filters.atualizarProdutos(CatalogState.produtos);
            Filters.aplicarFiltros();
          } else {
            Filters.init(CatalogState.produtos, config);
          }
        }

        CatalogState.hasMore = resposta.hasMore;
        CatalogState.carregando = false;
        atualizarBotaoCarregarMais();
      });
    }

    setTimeout(() => {
      document.getElementById('pageLoader').classList.add('fade-out');
      setTimeout(() => {
        document.getElementById('pageLoader').style.display = 'none';
      }, 500);
    }, 800);
  } catch (error) {
    console.error('Erro ao inicializar catálogo:', error);
    const loader = document.getElementById('pageLoader');
    if (loader) {
      loader.innerHTML = `
        <div class="error-state">
          <p>❌ Erro ao carregar. Recarregue a página.</p>
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarCatalogo);
} else {
  inicializarCatalogo();
}

