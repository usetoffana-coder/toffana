/**
 * Página: Configurações > Visual
 */
const ConfigVisualPage = {
  init() {
    this.bindEvents();
    this.setupColorSyncs();
    this.carregarConfiguracoes();
  },

  bindEvents() {
    document.getElementById('configVisualForm')?.addEventListener('submit', (e) => this.salvarConfiguracoes(e));
    document.getElementById('logoUpload')?.addEventListener('change', (e) => this.onLogoUpload(e));
    document.getElementById('footerTexto')?.addEventListener('input', () => this.atualizarPreview());
  },

  setupColorSyncs() {
    const pairs = [
      ['corPrimaria', 'corPrimariaTexto'],
      ['corSecundaria', 'corSecundariaTexto'],
      ['corFundo', 'corFundoTexto'],
      ['corTexto', 'corTextoTexto'],
      ['corHeaderBg', 'corHeaderBgTexto'],
      ['corMenuTexto', 'corMenuTextoTexto'],
      ['corCardBg', 'corCardBgTexto'],
      ['corCardBorda', 'corCardBordaTexto'],
      ['corBotaoPrimario', 'corBotaoPrimarioTexto'],
      ['corBotaoPrimarioHover', 'corBotaoPrimarioHoverTexto'],
      ['corBotaoPrimarioTextoCor', 'corBotaoPrimarioTextoCorTexto'],
      ['corBotaoOutline', 'corBotaoOutlineTexto'],
      ['corBotaoOutlineHover', 'corBotaoOutlineHoverTexto'],
      ['corBotaoOutlineHoverTextoCor', 'corBotaoOutlineHoverTextoCorTexto'],
      ['corBotaoWhatsapp', 'corBotaoWhatsappTexto'],
      ['corBotaoWhatsappHover', 'corBotaoWhatsappHoverTexto'],
      ['corBotaoWhatsappTextoCor', 'corBotaoWhatsappTextoCorTexto'],
      ['corFooterBg', 'corFooterBgTexto'],
      ['corFooterTexto', 'corFooterTextoTexto']
    ];

    pairs.forEach(([colorId, textId]) => {
      const colorInput = document.getElementById(colorId);
      const textInput = document.getElementById(textId);
      if (!colorInput || !textInput) return;

      colorInput.addEventListener('input', (e) => {
        textInput.value = e.target.value;
        this.atualizarPreview();
      });
    });
  },

  atualizarPreview() {
    const preview = document.getElementById('previewCatalogo');
    const header = document.getElementById('previewHeader');
    const btn = document.getElementById('previewBtn');
    const card = document.getElementById('previewCard');
    const whatsapp = document.getElementById('previewWhatsapp');
    const texto = document.getElementById('previewTexto');
    const footer = document.getElementById('previewFooter');
    const footerText = document.getElementById('previewFooterText');
    const footerTextoInput = document.getElementById('footerTexto');

    const corPrimaria = document.getElementById('corPrimaria').value;
    const corSecundaria = document.getElementById('corSecundaria').value;
    const corFundo = document.getElementById('corFundo').value;
    const corTexto = document.getElementById('corTexto').value;
    const corHeaderBg = document.getElementById('corHeaderBg').value;
    const corMenuTexto = document.getElementById('corMenuTexto').value;
    const corCardBg = document.getElementById('corCardBg').value;
    const corCardBorda = document.getElementById('corCardBorda').value;
    const corBotaoPrimario = document.getElementById('corBotaoPrimario').value;
    const corBotaoPrimarioHover = document.getElementById('corBotaoPrimarioHover').value;
    const corBotaoPrimarioTextoCor = document.getElementById('corBotaoPrimarioTextoCor').value;
    const corBotaoOutline = document.getElementById('corBotaoOutline').value;
    const corBotaoOutlineHover = document.getElementById('corBotaoOutlineHover').value;
    const corBotaoOutlineHoverTextoCor = document.getElementById('corBotaoOutlineHoverTextoCor').value;
    const corBotaoWhatsapp = document.getElementById('corBotaoWhatsapp').value;
    const corBotaoWhatsappHover = document.getElementById('corBotaoWhatsappHover').value;
    const corBotaoWhatsappTextoCor = document.getElementById('corBotaoWhatsappTextoCor').value;
    const corFooterBg = document.getElementById('corFooterBg').value;
    const corFooterTexto = document.getElementById('corFooterTexto').value;

    preview.style.background = corFundo;
    header.style.background = corHeaderBg;
    header.style.borderBottom = `2px solid ${corPrimaria}`;
    btn.style.background = corBotaoPrimario;
    btn.style.color = corBotaoPrimarioTextoCor || 'white';
    card.style.background = corCardBg;
    card.style.border = `1px solid ${corCardBorda}`;
    whatsapp.style.background = corBotaoWhatsapp;
    whatsapp.style.color = corBotaoWhatsappTextoCor;
    texto.style.color = corTexto;
    footer.style.background = corFooterBg;
    footerText.style.color = corFooterTexto;
    if (footerTextoInput && footerTextoInput.value.trim() !== '') {
      footerText.textContent = footerTextoInput.value.trim();
    }
    btn.dataset.hoverBg = corBotaoPrimarioHover;
    btn.dataset.hoverColor = corBotaoPrimarioTextoCor;
    whatsapp.dataset.hoverBg = corBotaoWhatsappHover;
    whatsapp.dataset.hoverColor = corBotaoWhatsappTextoCor;
    card.dataset.outlineBg = corBotaoOutlineHover;
    card.dataset.outlineText = corBotaoOutlineHoverTextoCor;
  },

  resetarCores() {
    if (!confirm('Restaurar TODAS as cores padrão? Esta ação não pode ser desfeita.')) return;

    const padroes = {
      corPrimaria: '#6366f1',
      corSecundaria: '#10b981',
      corFundo: '#0f172a',
      corTexto: '#f1f5f9',
      corHeaderBg: '#1e293b',
      corMenuTexto: '#94a3b8',
      corCardBg: '#1e293b',
      corCardBorda: '#334155',
      corBotaoPrimario: '#6366f1',
      corBotaoPrimarioHover: '#4f46e5',
      corBotaoPrimarioTextoCor: '#ffffff',
      corBotaoOutline: '#6366f1',
      corBotaoOutlineHover: '#6366f1',
      corBotaoOutlineHoverTextoCor: '#ffffff',
      corBotaoWhatsapp: '#10b981',
      corBotaoWhatsappHover: '#059669',
      corBotaoWhatsappTextoCor: '#ffffff',
      corFooterBg: '#0f172a',
      corFooterTexto: '#94a3b8'
    };

    Object.entries(padroes).forEach(([key, value]) => {
      document.getElementById(key).value = value;
      document.getElementById(key + 'Texto').value = value;
    });

    this.atualizarPreview();
    alert('Cores restauradas para os valores padrão!');
  },

  async onLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione apenas imagens');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande (máx. 2MB)');
      return;
    }

    try {
      const loadingEl = document.getElementById('logoPreview');
      DomUtils.clear(loadingEl);
      const p = document.createElement('p');
      p.textContent = 'Enviando logo...';
      loadingEl.appendChild(p);
      loadingEl.style.display = 'block';

      const url = await ProdutosService.uploadImagem(file);

      document.getElementById('logoUrl').value = url;
      DomUtils.clear(loadingEl);
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Logo';
      loadingEl.appendChild(img);

      const previewLogo = document.getElementById('previewLogo');
      DomUtils.clear(previewLogo);
      const imgPreview = document.createElement('img');
      imgPreview.src = url;
      imgPreview.style.height = '40px';
      previewLogo.appendChild(imgPreview);
    } catch (error) {
      alert('Erro ao enviar logo');
    }
  },

  async carregarConfiguracoes() {
    const config = await ConfigService.buscar();

    document.getElementById('nomeLoja').value = config.nomeLoja || '';
    document.getElementById('logoUrl').value = config.logoUrl || '';
    document.getElementById('avisoTexto').value = config.avisoTexto || '';
    document.getElementById('avisoBotaoTexto').value = config.avisoBotaoTexto || '';
    document.getElementById('avisoBotaoUrl').value = config.avisoBotaoUrl || '';
    document.getElementById('avisoEntregaTexto').value = config.avisoEntregaTexto || '';
    document.getElementById('exibirTaxaEntrega').checked = config.exibirTaxaEntrega !== false;
    document.getElementById('footerTexto').value = config.footerTexto || '';

    if (config.customizacao) {
      const cores = {
        corPrimaria: config.customizacao.corPrimaria || '#6366f1',
        corSecundaria: config.customizacao.corSecundaria || '#10b981',
        corFundo: config.customizacao.corFundo || '#0f172a',
        corTexto: config.customizacao.corTexto || '#f1f5f9',
        corHeaderBg: config.customizacao.corHeaderBg || '#1e293b',
        corMenuTexto: config.customizacao.corMenuTexto || '#94a3b8',
        corCardBg: config.customizacao.corCardBg || '#1e293b',
        corCardBorda: config.customizacao.corCardBorda || '#334155',
        corBotaoPrimario: config.customizacao.corBotaoPrimario || '#6366f1',
        corBotaoPrimarioHover: config.customizacao.corBotaoPrimarioHover || '#4f46e5',
        corBotaoPrimarioTextoCor: config.customizacao.corBotaoPrimarioTextoCor || '#ffffff',
        corBotaoOutline: config.customizacao.corBotaoOutline || '#6366f1',
        corBotaoOutlineHover: config.customizacao.corBotaoOutlineHover || '#6366f1',
        corBotaoOutlineHoverTextoCor: config.customizacao.corBotaoOutlineHoverTextoCor || '#ffffff',
        corBotaoWhatsapp: config.customizacao.corBotaoWhatsapp || '#10b981',
        corBotaoWhatsappHover: config.customizacao.corBotaoWhatsappHover || '#059669',
        corBotaoWhatsappTextoCor: config.customizacao.corBotaoWhatsappTextoCor || '#ffffff',
        corFooterBg: config.customizacao.corFooterBg || '#0f172a',
        corFooterTexto: config.customizacao.corFooterTexto || '#94a3b8'
      };

      Object.entries(cores).forEach(([key, value]) => {
        document.getElementById(key).value = value;
        document.getElementById(key + 'Texto').value = value;
      });
    }

    if (config.logoUrl) {
      const preview = document.getElementById('logoPreview');
      DomUtils.clear(preview);
      const img = document.createElement('img');
      img.src = config.logoUrl;
      img.alt = 'Logo';
      preview.appendChild(img);
      preview.style.display = 'block';

      const previewLogo = document.getElementById('previewLogo');
      DomUtils.clear(previewLogo);
      const imgPreview = document.createElement('img');
      imgPreview.src = config.logoUrl;
      imgPreview.style.height = '40px';
      previewLogo.appendChild(imgPreview);
    }

    this.atualizarPreview();
  },

  async salvarConfiguracoes(e) {
    e.preventDefault();

    const config = {
      nomeLoja: document.getElementById('nomeLoja').value.trim(),
      logoUrl: document.getElementById('logoUrl').value.trim(),
      avisoTexto: document.getElementById('avisoTexto').value.trim(),
      avisoBotaoTexto: document.getElementById('avisoBotaoTexto').value.trim(),
      avisoBotaoUrl: document.getElementById('avisoBotaoUrl').value.trim(),
      avisoEntregaTexto: document.getElementById('avisoEntregaTexto').value.trim(),
      exibirTaxaEntrega: document.getElementById('exibirTaxaEntrega').checked,
      footerTexto: document.getElementById('footerTexto').value.trim(),
      customizacao: {
        corPrimaria: document.getElementById('corPrimaria').value,
        corSecundaria: document.getElementById('corSecundaria').value,
        corFundo: document.getElementById('corFundo').value,
        corTexto: document.getElementById('corTexto').value,
        corHeaderBg: document.getElementById('corHeaderBg').value,
        corMenuTexto: document.getElementById('corMenuTexto').value,
        corCardBg: document.getElementById('corCardBg').value,
        corCardBorda: document.getElementById('corCardBorda').value,
        corBotaoPrimario: document.getElementById('corBotaoPrimario').value,
        corBotaoPrimarioHover: document.getElementById('corBotaoPrimarioHover').value,
        corBotaoPrimarioTextoCor: document.getElementById('corBotaoPrimarioTextoCor').value,
        corBotaoOutline: document.getElementById('corBotaoOutline').value,
        corBotaoOutlineHover: document.getElementById('corBotaoOutlineHover').value,
        corBotaoOutlineHoverTextoCor: document.getElementById('corBotaoOutlineHoverTextoCor').value,
        corBotaoWhatsapp: document.getElementById('corBotaoWhatsapp').value,
        corBotaoWhatsappHover: document.getElementById('corBotaoWhatsappHover').value,
        corBotaoWhatsappTextoCor: document.getElementById('corBotaoWhatsappTextoCor').value,
        corFooterBg: document.getElementById('corFooterBg').value,
        corFooterTexto: document.getElementById('corFooterTexto').value
      }
    };

    const result = await ConfigService.salvar(config);

    if (result.success) {
      alert('Configurações salvas com sucesso!');
    } else {
      alert('Erro ao salvar configurações');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ConfigVisualPage.init());
window.resetarCores = () => ConfigVisualPage.resetarCores();
window.ConfigVisualPage = ConfigVisualPage;


