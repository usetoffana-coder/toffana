/**
 * UI de Configurações
 * Upload de logo via Cloudinary (ProdutosService)
 */

const ConfigUI = {
  async init() {
    initTabs();
    await carregarConfiguracoes();
    setupFormSubmit();
    setupLogoUpload();
  }
};

window.ConfigUI = ConfigUI;

/* ===========================
   TABS
=========================== */
function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const panes = document.querySelectorAll('.tab-pane');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      buttons.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document
        .querySelector(`.tab-pane[data-pane="${tab}"]`)
        ?.classList.add('active');
    });
  });
}

/* ===========================
   CARREGAR CONFIG
=========================== */
async function carregarConfiguracoes() {
  const config = await ConfigService.buscar();

  preencherCampo('nomeLoja', config.nomeLoja);
  preencherCampo('whatsapp', config.whatsapp);
  preencherCampo('taxaMotoboy', config.taxaMotoboy);
  preencherCampo('descontoPix', config.descontoPix);
  preencherCampo('parcelasSemJuros', config.parcelasSemJuros);
  preencherCampo('pixelFacebook', config.pixelFacebook);
  preencherCampo('gtmGoogle', config.gtmGoogle);
  preencherCampo('googleAnalytics', config.googleAnalytics);

  preencherTextarea('menuCategorias', config.menuCategorias);
  preencherTextarea('marcasCadastradas', config.marcasCadastradas);
  preencherTextarea('categoriasCadastradas', config.categoriasCadastradas);
  preencherTextarea('mensagemPadrao', config.mensagemPadrao);

  preencherCampo('avisoTexto', config.avisoTexto);
  preencherCampo('avisoBotaoTexto', config.avisoBotaoTexto);
  preencherCampo('avisoBotaoUrl', config.avisoBotaoUrl);

  setCheckbox('whatsappFlutuante', config.whatsappFlutuante);

  if (config.logoUrl) {
    document.getElementById('logoUrl').value = config.logoUrl;
    const preview = document.getElementById('logoPreview');
    DomUtils.clear(preview);
    const img = document.createElement('img');
    img.src = DomUtils.sanitizeUrl(config.logoUrl);
    img.alt = 'Logo da Loja';
    preview.appendChild(img);
  }
}

/* ===========================
   SALVAR CONFIG
=========================== */
function setupFormSubmit() {
  const form = document.getElementById('configForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    if (window.RateLimiter && !RateLimiter.allowBucket('config:save', 5, 1 / 30)) {
      if (window.AuditService) {
        await AuditService.log({
          action: 'rate_limited',
          entity: 'config',
          entityId: 'loja'
        });
      }
      alert('Muitas tentativas. Aguarde alguns segundos.');
      return;
    }

    const config = {
      nomeLoja: DomUtils.sanitizeText(getValue('nomeLoja'), 120),
      whatsapp: DomUtils.sanitizeText(getValue('whatsapp'), 15),
      taxaMotoboy: Number(getValue('taxaMotoboy')),
      descontoPix: Number(getValue('descontoPix')),
      parcelasSemJuros: Number(getValue('parcelasSemJuros')),
      pixelFacebook: DomUtils.sanitizeText(getValue('pixelFacebook'), 120),
      gtmGoogle: DomUtils.sanitizeText(getValue('gtmGoogle'), 120),
      googleAnalytics: DomUtils.sanitizeText(getValue('googleAnalytics'), 120),
      mensagemPadrao: DomUtils.sanitizeText(getValue('mensagemPadrao'), 1000),
      avisoTexto: DomUtils.sanitizeText(getValue('avisoTexto'), 500),
      avisoBotaoTexto: DomUtils.sanitizeText(getValue('avisoBotaoTexto'), 120),
      avisoBotaoUrl: DomUtils.sanitizeUrl(getValue('avisoBotaoUrl')),
      logoUrl: DomUtils.sanitizeUrl(getValue('logoUrl')),
      whatsappFlutuante: document.getElementById('whatsappFlutuante')?.checked ?? true,

      menuCategorias: splitLinhas('menuCategorias'),
      marcasCadastradas: splitLinhas('marcasCadastradas'),
      categoriasCadastradas: splitLinhas('categoriasCadastradas')
    };

    const result = await ConfigService.salvar(config);

    if (result.success) {
      alert('✅ Configurações salvas com sucesso');
    } else {
      alert('❌ Erro ao salvar configurações');
    }
  });
}

/* ===========================
   UPLOAD DE LOGO (CLOUDINARY)
=========================== */
function setupLogoUpload() {
  const logoInput = document.getElementById('logoUpload');
  if (!logoInput) return;

  logoInput.addEventListener('change', async (e) => {
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
      mostrarLoadingLogo(true);

      // Upload via Cloudinary (mesmo dos produtos)
      const url = await ProdutosService.uploadImagem(file);

      document.getElementById('logoUrl').value = url;

      const preview = document.getElementById('logoPreview');
      DomUtils.clear(preview);
      const img = document.createElement('img');
      img.src = DomUtils.sanitizeUrl(url);
      img.alt = 'Logo da Loja';
      preview.appendChild(img);

    } catch (error) {
      console.error(error);
      alert('Erro ao enviar logo');
    } finally {
      mostrarLoadingLogo(false);
    }
  });
}

/* ===========================
   HELPERS
=========================== */
function preencherCampo(id, valor) {
  const el = document.getElementById(id);
  if (el && valor !== undefined && valor !== null) {
    el.value = valor;
  }
}

function preencherTextarea(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;

  el.value = Array.isArray(valor) ? valor.join('\n') : (valor || '');
}

function setCheckbox(id, valor) {
  const el = document.getElementById(id);
  if (el) el.checked = !!valor;
}

function getValue(id) {
  return document.getElementById(id)?.value || '';
}

function splitLinhas(id) {
  return getValue(id)
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
}

/* ===========================
   LOADING LOGO
=========================== */
function mostrarLoadingLogo(ativo) {
  const preview = document.getElementById('logoPreview');
  if (!preview) return;

  if (ativo) {
    DomUtils.clear(preview);
    const p = document.createElement('p');
    p.textContent = 'Enviando logo...';
    preview.appendChild(p);
  }
}
