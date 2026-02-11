/**
 * Página: Configurações > Banners
 */
const ConfigBannersPage = {
  isUploading: false,
  isSubmitting: false,

  init() {
    this.bindEvents();
    this.carregarBanners();
    this.carregarConfigSlider();
  },

  bindEvents() {
    document.getElementById('btnNovoBanner')?.addEventListener('click', () => this.abrirModalBanner());
    document.getElementById('formBanner')?.addEventListener('submit', (e) => this.salvarBanner(e));
    document.getElementById('configSliderForm')?.addEventListener('submit', (e) => this.salvarConfigSlider(e));

    document.getElementById('bannerImagem')?.addEventListener('change', (e) => this.onUploadImagem(e));
  },

  async carregarBanners() {
    const banners = await BannersService.listar();
    this.renderizarListaBanners(banners);
  },

  renderizarListaBanners(banners) {
    const tbody = document.getElementById('bannersTableBody');
    if (!tbody) return;
    DomUtils.clear(tbody);

    if (!Array.isArray(banners) || banners.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 7;
      td.style.textAlign = 'center';
      td.style.padding = '40px';
      td.textContent = 'Nenhum banner cadastrado';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    const frag = document.createDocumentFragment();

    banners.forEach(banner => {
      const tr = document.createElement('tr');

      const tdImg = document.createElement('td');
      const img = document.createElement('img');
      img.src = DomUtils.sanitizeUrl(banner.imagemUrl || '');
      img.alt = banner.titulo || 'Banner';
      img.style.width = '100px';
      img.style.height = '50px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      tdImg.appendChild(img);

      const tdTitulo = document.createElement('td');
      if (banner.titulo) {
        tdTitulo.textContent = banner.titulo;
      } else {
        const em = document.createElement('em');
        em.textContent = 'Sem título';
        tdTitulo.appendChild(em);
      }

      const tdTipo = document.createElement('td');
      tdTipo.textContent = banner.tipo || 'slider';

      const tdOrdem = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = String(banner.ordem || 0);
      tdOrdem.appendChild(badge);

      const tdLink = document.createElement('td');
      const linkSeguro = banner.linkUrl ? DomUtils.sanitizeUrl(banner.linkUrl) : '';
      if (linkSeguro) {
        const a = document.createElement('a');
        a.href = linkSeguro;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.style.fontSize = '12px';
        a.textContent = '🔗 Ver link';
        tdLink.appendChild(a);
      } else {
        const em = document.createElement('em');
        em.textContent = 'Sem link';
        tdLink.appendChild(em);
      }

      const tdStatus = document.createElement('td');
      const status = document.createElement('span');
      status.className = `status-badge ${banner.ativo ? 'ativo' : 'inativo'}`;
      status.textContent = banner.ativo ? 'Ativo' : 'Inativo';
      tdStatus.appendChild(status);

      const tdAcoes = document.createElement('td');
      tdAcoes.className = 'acoes';

      const btnEditar = document.createElement('button');
      btnEditar.className = 'btn-editar';
      btnEditar.title = 'Editar';
      btnEditar.textContent = '✏️';
      btnEditar.addEventListener('click', () => this.abrirModalBanner(banner.id));

      const btnDeletar = document.createElement('button');
      btnDeletar.className = 'btn-deletar';
      btnDeletar.title = 'Deletar';
      btnDeletar.textContent = '🗑️';
      btnDeletar.addEventListener('click', () => this.deletarBanner(banner.id, banner.titulo || 'Banner'));

      tdAcoes.appendChild(btnEditar);
      tdAcoes.appendChild(btnDeletar);

      tr.appendChild(tdImg);
      tr.appendChild(tdTitulo);
      tr.appendChild(tdTipo);
      tr.appendChild(tdOrdem);
      tr.appendChild(tdLink);
      tr.appendChild(tdStatus);
      tr.appendChild(tdAcoes);

      frag.appendChild(tr);
    });

    tbody.appendChild(frag);
  },

  abrirModalBanner(id = null) {
    const modal = document.getElementById('modalBanner');
    const titulo = document.getElementById('modalBannerTitulo');

    document.getElementById('formBanner').reset();
    document.getElementById('bannerId').value = '';
    const preview = document.getElementById('bannerImagemPreview');
    DomUtils.clear(preview);
    preview.style.display = 'none';

    if (id) {
      titulo.textContent = 'Editar Banner';
      this.carregarBannerParaEdicao(id);
    } else {
      titulo.textContent = 'Novo Banner';
    }

    modal.style.display = 'flex';
  },

  fecharModalBanner() {
    document.getElementById('modalBanner').style.display = 'none';
  },

  async carregarBannerParaEdicao(id) {
    const banner = await BannersService.buscarPorId(id);

    if (!banner) {
      alert('Banner não encontrado');
      this.fecharModalBanner();
      return;
    }

    document.getElementById('bannerId').value = banner.id;
    document.getElementById('bannerTitulo').value = banner.titulo || '';
    document.getElementById('bannerTexto').value = banner.texto || '';
    document.getElementById('bannerLinkUrl').value = banner.linkUrl || '';
    document.getElementById('bannerTipo').value = banner.tipo || 'slider';
    document.getElementById('bannerOrdem').value = banner.ordem || 1;
    document.getElementById('bannerImagemUrl').value = banner.imagemUrl;
    document.getElementById('bannerAtivo').checked = banner.ativo !== false;

    const preview = document.getElementById('bannerImagemPreview');
    DomUtils.clear(preview);
    const img = document.createElement('img');
    img.src = DomUtils.sanitizeUrl(banner.imagemUrl);
    img.alt = 'Banner';
    preview.appendChild(img);
    preview.style.display = 'block';
  },

  async onUploadImagem(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione apenas imagens');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Imagem muito grande (máx. 5MB)');
      return;
    }

    const preview = document.getElementById('bannerImagemPreview');
    DomUtils.clear(preview);
    const p = document.createElement('p');
    p.textContent = '📤 Enviando...';
    preview.appendChild(p);
    preview.style.display = 'block';

    this.isUploading = true;

    try {
      const imageUrl = await ProdutosService.uploadImagem(file);
      document.getElementById('bannerImagemUrl').value = imageUrl;
      DomUtils.clear(preview);
      const img = document.createElement('img');
      img.src = DomUtils.sanitizeUrl(imageUrl);
      img.alt = 'Banner';
      preview.appendChild(img);
    } catch (err) {
      console.error('❌ Erro no upload:', err);
      alert('Erro ao enviar imagem');
      DomUtils.clear(preview);
    } finally {
      this.isUploading = false;
    }
  },

  async salvarBanner(e) {
    e.preventDefault();

    if (this.isSubmitting || this.isUploading) {
      alert(this.isUploading ? 'Aguarde o upload da imagem' : 'Aguarde...');
      return;
    }

    if (window.RateLimiter && !RateLimiter.allowBucket('banners:save', 8, 1 / 15)) {
      if (window.AuditService) {
        await AuditService.log({
          action: 'rate_limited',
          entity: 'banner',
          entityId: 'bulk'
        });
      }
      alert('Muitas tentativas. Aguarde alguns segundos.');
      return;
    }

    this.isSubmitting = true;

    const bannerId = document.getElementById('bannerId').value;
    const imagemUrl = document.getElementById('bannerImagemUrl').value;

    if (!imagemUrl) {
      alert('Por favor, faça upload de uma imagem');
      this.isSubmitting = false;
      return;
    }

    const banner = {
      titulo: DomUtils.sanitizeText(document.getElementById('bannerTitulo').value.trim(), 120),
      texto: DomUtils.sanitizeText(document.getElementById('bannerTexto').value.trim(), 500),
      linkUrl: DomUtils.sanitizeUrl(document.getElementById('bannerLinkUrl').value.trim()),
      tipo: document.getElementById('bannerTipo').value || 'slider',
      ordem: parseInt(document.getElementById('bannerOrdem').value) || 1,
      imagemUrl: imagemUrl,
      ativo: document.getElementById('bannerAtivo').checked
    };

    try {
      let result;
      if (bannerId) {
        result = await BannersService.atualizar(bannerId, banner);
      } else {
        result = await BannersService.criar(banner);
      }

      if (result.success) {
        alert('✅ Banner salvo com sucesso!');
        this.fecharModalBanner();
        this.carregarBanners();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('❌ Erro:', err);
      alert('Erro ao salvar banner');
    } finally {
      this.isSubmitting = false;
    }
  },

  async deletarBanner(id, titulo) {
    if (!confirm(`Deletar o banner "${titulo}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    const result = await BannersService.deletar(id);

    if (result.success) {
      alert('✅ Banner deletado!');
      this.carregarBanners();
    } else {
      alert('❌ ' + result.error);
    }
  },

  async carregarConfigSlider() {
    const config = await ConfigService.buscar();

    document.getElementById('sliderAutoPlay').checked = config.sliderAutoPlay !== false;
    document.getElementById('sliderInterval').value = config.sliderInterval || 5;
  },

  async salvarConfigSlider(e) {
    e.preventDefault();

    const config = {
      sliderAutoPlay: document.getElementById('sliderAutoPlay').checked,
      sliderInterval: parseInt(document.getElementById('sliderInterval').value) || 5
    };

    const result = await ConfigService.salvar(config);

    if (result.success) {
      alert('✅ Configurações salvas!');
    } else {
      alert('❌ Erro ao salvar');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ConfigBannersPage.init());

// Funções globais para uso em atributos HTML
window.abrirModalBanner = (id) => ConfigBannersPage.abrirModalBanner(id);
window.fecharModalBanner = () => ConfigBannersPage.fecharModalBanner();
window.editarBanner = (id) => ConfigBannersPage.abrirModalBanner(id);
window.deletarBanner = (id, titulo) => ConfigBannersPage.deletarBanner(id, titulo);

window.ConfigBannersPage = ConfigBannersPage;
