/**
 * Página dinâmica (conteúdo customizado)
 */

const PaginaRender = {
  async init() {
    try {
      ThemeService.init();
      MenuService.init();
      FirebaseCore.init();
      DataService.init();

      const config = await DataService.buscarConfig();
      this.aplicarCustomizacao(config);
      this.renderHeader(config);
      this.renderFooter(config);
      this.renderWhatsappFlutuante(config);

      const slug = this.getSlug();
      const pagina = await DataService.buscarPaginaPorSlug(slug);

      this.renderPagina(pagina, config);
      this.finalizarLoader();
    } catch (error) {
      console.error('Erro ao carregar página:', error);
      this.renderErro('Erro ao carregar a página.');
      this.finalizarLoader();
    }
  },

  getSlug() {
    const params = new URLSearchParams(window.location.search);
    return String(params.get('slug') || '').trim();
  },

  aplicarCustomizacao(config) {
    if (!config?.customizacao) return;
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
    if (custom.corBotaoWhatsappTextoCor) {
      root.style.setProperty('--btn-whatsapp-text', custom.corBotaoWhatsappTextoCor);
      root.style.setProperty('--btn-whatsapp-hover-text', custom.corBotaoWhatsappTextoCor);
    }
  },

  renderHeader(config) {
    document.title = `${config.nomeLoja || 'Catálogo'} - Página`;

    const logoContainer = document.getElementById('logoContainer');
    const logoContainerMobile = document.getElementById('logoContainerMobile');
    const logoUrl = DomUtils.sanitizeUrl(config.logoUrl || '');

    if (logoUrl) {
      const img = document.createElement('img');
      img.src = logoUrl;
      img.alt = config.nomeLoja || 'Logo';
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
      const nomeMobile = document.getElementById('nomeLojaMobile');
      if (nomeEl) nomeEl.textContent = config.nomeLoja || 'Catálogo';
      if (nomeMobile) nomeMobile.textContent = config.nomeLoja || 'Catálogo';
    }

    const menuDesktop = document.getElementById('menuDesktopList');
    if (menuDesktop) {
      const links = (config.menuLinks || []).filter(l => l.ativo !== false);
      const linksHtml = links.map(link => {
        const texto = DomUtils.escapeHtml(link.texto || 'Link');
        const icone = DomUtils.escapeHtml(link.icone || '');
        const url = DomUtils.sanitizeUrl(link.url || '#');
        const target = link.abrirNovaAba ? ' target="_blank" rel="noopener noreferrer"' : '';
        const destaque = link.destacado ? 'destaque' : '';
        return `<li><a href="${url}" class="menu-link ${destaque}"${target}>${icone ? icone + ' ' : ''}${texto}</a></li>`;
      }).join('');

      menuDesktop.innerHTML = `<li><a href="index.html" class="menu-link">Início</a></li>${linksHtml}`;
    }

    const menuMobile = document.getElementById('mobileMenuLinks');
    if (menuMobile) {
      const links = (config.menuLinks || []).filter(l => l.ativo !== false);
      const linksHtml = links.map(link => {
        const texto = DomUtils.escapeHtml(link.texto || 'Link');
        const url = DomUtils.sanitizeUrl(link.url || '#');
        const target = link.abrirNovaAba ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a class="mobile-menu-link" href="${url}"${target}>${texto}</a>`;
      }).join('');
      menuMobile.innerHTML = `<a class="mobile-menu-link" href="index.html">Início</a>${linksHtml}`;
    }

    const themeToggleMobile = document.getElementById('themeToggleMobile');
    if (themeToggleMobile) {
      themeToggleMobile.addEventListener('click', () => ThemeService.toggle());
    }

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => ThemeService.toggle());
    }
  },

  renderFooter(config) {
    document.getElementById('footerNomeLoja').textContent = config.nomeLoja || 'Catálogo';
    document.getElementById('nomeLojaFooter').textContent = config.nomeLoja || 'Catálogo';
    const footerDescricao = document.getElementById('footerDescricao');
    if (footerDescricao) {
      footerDescricao.textContent = config.footerTexto || 'Sua loja de confiança com os melhores produtos e preços.';
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

    const footerLinks = document.getElementById('footerLinksList');
    if (footerLinks) {
      const paginas = (config.paginas || []).filter(p => p.ativo !== false);
      const paginasHtml = paginas.map(p => {
        const titulo = DomUtils.escapeHtml(p.titulo || 'Página');
        const slug = encodeURIComponent(String(p.slug || '').trim());
        return `<li><a href="pagina.html?slug=${slug}">${titulo}</a></li>`;
      }).join('');

      const links = (config.menuLinks || []).filter(l => l.ativo !== false).slice(0, 4);
      const linksHtml = links.map(link => {
        const texto = DomUtils.escapeHtml(link.texto || 'Link');
        const url = DomUtils.sanitizeUrl(link.url || '#');
        const target = link.abrirNovaAba ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<li><a href="${url}"${target}>${texto}</a></li>`;
      }).join('');

      footerLinks.innerHTML = `<li><a href="index.html#produtos">Produtos</a></li>${paginasHtml}${linksHtml}`;
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
  },

  renderWhatsappFlutuante(config) {
    if (config.whatsappFlutuante === false) return;
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
    }

    if (whatsappDiv) whatsappDiv.style.display = 'block';
  },

  renderPagina(pagina, config) {
    const tituloEl = document.getElementById('paginaTitulo');
    const conteudoEl = document.getElementById('paginaConteudo');
    if (!tituloEl || !conteudoEl) return;

    if (!pagina) {
      tituloEl.textContent = 'Página não encontrada';
      conteudoEl.innerHTML = '<p>Não foi possível localizar esta página.</p>';
      return;
    }

    tituloEl.textContent = pagina.titulo || 'Página';
    document.title = `${pagina.titulo || 'Página'} - ${config.nomeLoja || 'Catálogo'}`;

    if (pagina.modoConteudo === 'html' && pagina.conteudoHtml) {
      conteudoEl.innerHTML = this.sanitizeHtml(pagina.conteudoHtml);
      return;
    }

    if (pagina.modoConteudo === 'blocos' && Array.isArray(pagina.conteudoBlocos)) {
      conteudoEl.innerHTML = this.renderBlocos(pagina.conteudoBlocos);
      return;
    }

    const texto = String(pagina.conteudoTexto || '').trim();
    if (!texto) {
      conteudoEl.innerHTML = '<p>Conteúdo indisponível.</p>';
      return;
    }

    const paragrafos = texto.split(/\n\s*\n/).map(p => {
      const escaped = DomUtils.escapeHtml(p).replace(/\n/g, '<br>');
      return `<p>${escaped}</p>`;
    });
    conteudoEl.innerHTML = paragrafos.join('');
  },

  sanitizeHtml(html) {
    const allowedTags = new Set([
      'p','br','strong','b','em','i','u','s','a',
      'h1','h2','h3','h4','h5','h6',
      'ul','ol','li','blockquote','code','pre','span','div'
    ]);

    const parser = new DOMParser();
    const doc = parser.parseFromString(String(html || ''), 'text/html');

    const walk = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        if (!allowedTags.has(tag)) {
          const parent = node.parentNode;
          if (parent) {
            while (node.firstChild) parent.insertBefore(node.firstChild, node);
            parent.removeChild(node);
          }
          return;
        }

        const attrs = Array.from(node.attributes);
        attrs.forEach(attr => {
          const name = attr.name.toLowerCase();
          if (tag === 'a' && (name === 'href' || name === 'target' || name === 'rel')) {
            if (name === 'href') {
              const safe = DomUtils.sanitizeUrl(attr.value);
              if (safe) node.setAttribute('href', safe);
              else node.removeAttribute('href');
            }
            if (name === 'target') node.setAttribute('target', '_blank');
            if (name === 'rel') node.setAttribute('rel', 'noopener noreferrer');
          } else {
            node.removeAttribute(name);
          }
        });
      }

      Array.from(node.childNodes).forEach(child => walk(child));
    };

    walk(doc.body);
    return doc.body.innerHTML;
  },

  renderBlocos(blocos) {
    if (!Array.isArray(blocos) || blocos.length === 0) {
      return '<p>Conteúdo indisponível.</p>';
    }

    const escape = (v) => DomUtils.escapeHtml(v);

    return blocos.map(block => {
      switch (block.tipo) {
        case 'heading': {
          const level = [2, 3, 4].includes(block.level) ? block.level : 2;
          return `<h${level}>${escape(block.texto || '')}</h${level}>`;
        }
        case 'paragraph':
          return `<p>${escape(block.texto || '')}</p>`;
        case 'list': {
          const items = String(block.items || '').split('\n').filter(Boolean);
          if (items.length === 0) return '';
          return `<ul>${items.map(i => `<li>${escape(i)}</li>`).join('')}</ul>`;
        }
        case 'image': {
          const url = DomUtils.sanitizeUrl(block.url || '');
          const alt = escape(block.alt || '');
          if (!url) return '';
          return `<p><img src="${url}" alt="${alt}" style="max-width: 100%; border-radius: 8px;"></p>`;
        }
        case 'button': {
          const url = DomUtils.sanitizeUrl(block.url || '');
          const text = escape(block.texto || 'Saiba mais');
          if (!url) return `<p>${text}</p>`;
          return `<p><a href="${url}" target="_blank" rel="noopener noreferrer" class="btn-hero">${text}</a></p>`;
        }
        case 'quote': {
          const texto = escape(block.texto || '');
          const autor = escape(block.autor || '');
          return `<blockquote>${texto}${autor ? `<br><small>${autor}</small>` : ''}</blockquote>`;
        }
        case 'divider':
          return '<hr>';
        default:
          return '';
      }
    }).join('');
  },

  renderErro(msg) {
    const tituloEl = document.getElementById('paginaTitulo');
    const conteudoEl = document.getElementById('paginaConteudo');
    if (tituloEl) tituloEl.textContent = 'Erro';
    if (conteudoEl) conteudoEl.innerHTML = `<p>${DomUtils.escapeHtml(msg || 'Erro desconhecido')}</p>`;
  },

  finalizarLoader() {
    const loader = document.getElementById('pageLoader');
    if (!loader) return;
    loader.classList.add('fade-out');
    setTimeout(() => {
      loader.style.display = 'none';
    }, 500);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PaginaRender.init());
} else {
  PaginaRender.init();
}
