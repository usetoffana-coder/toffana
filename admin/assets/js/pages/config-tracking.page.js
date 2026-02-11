/**
 * Página: Configurações > Tracking
 */
const ConfigTrackingPage = {
  init() {
    this.bindEvents();
    this.carregarConfiguracoes();
  },

  bindEvents() {
    const ids = [
      'pixelFacebook', 'pixelAtivo',
      'gtmGoogle', 'gtmAtivo',
      'googleAnalytics', 'gaAtivo'
    ];

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.atualizarStatus());
        el.addEventListener('change', () => this.atualizarStatus());
      }
    });

    document.getElementById('configTrackingForm')?.addEventListener('submit', (e) => this.salvarConfiguracoes(e));
  },

  setStatusBadge(id, ativo) {
    const el = document.getElementById(id);
    if (!el) return;
    DomUtils.clear(el);

    const badge = document.createElement('span');
    badge.className = ativo ? 'badge badge-active' : 'badge badge-inactive';
    badge.textContent = ativo ? 'Ativo' : 'Inativo';
    el.appendChild(badge);
  },

  atualizarStatus() {
    const pixelId = document.getElementById('pixelFacebook').value.trim();
    const gtmId = document.getElementById('gtmGoogle').value.trim();
    const gaId = document.getElementById('googleAnalytics').value.trim();

    const pixelAtivo = document.getElementById('pixelAtivo').checked && pixelId;
    const gtmAtivo = document.getElementById('gtmAtivo').checked && gtmId;
    const gaAtivo = document.getElementById('gaAtivo').checked && gaId;

    this.setStatusBadge('statusFacebook', !!pixelAtivo);
    this.setStatusBadge('statusGTM', !!gtmAtivo);
    this.setStatusBadge('statusGA', !!gaAtivo);
  },

  testarTracking() {
    alert('🧪 Teste de Tracking:\n\n' +
      '1. Abra o Console do navegador (F12)\n' +
      '2. Vá para a aba "Network"\n' +
      '3. Acesse o catálogo\n' +
      '4. Verifique requisições para:\n' +
      '   - facebook.com/tr (Pixel)\n' +
      '   - googletagmanager.com (GTM)\n' +
      '   - google-analytics.com (GA4)');
  },

  async carregarConfiguracoes() {
    const config = await ConfigService.buscar();

    document.getElementById('pixelFacebook').value = config.pixelFacebook || '';
    document.getElementById('gtmGoogle').value = config.gtmGoogle || '';
    document.getElementById('googleAnalytics').value = config.googleAnalytics || '';

    document.getElementById('pixelAtivo').checked =
      config.pixelAtivo !== false && config.pixelFacebook;
    document.getElementById('gtmAtivo').checked =
      config.gtmAtivo !== false && config.gtmGoogle;
    document.getElementById('gaAtivo').checked =
      config.gaAtivo !== false && config.googleAnalytics;

    document.getElementById('rastrearScrollDepth').checked =
      config.rastrearScrollDepth === true;
    document.getElementById('rastrearTempoNaPagina').checked =
      config.rastrearTempoNaPagina === true;
    document.getElementById('rastrearCliquesOutbound').checked =
      config.rastrearCliquesOutbound === true;

    this.atualizarStatus();
  },

  async salvarConfiguracoes(e) {
    e.preventDefault();

    const config = {
      pixelFacebook: document.getElementById('pixelFacebook').value.trim(),
      gtmGoogle: document.getElementById('gtmGoogle').value.trim(),
      googleAnalytics: document.getElementById('googleAnalytics').value.trim(),

      pixelAtivo: document.getElementById('pixelAtivo').checked,
      gtmAtivo: document.getElementById('gtmAtivo').checked,
      gaAtivo: document.getElementById('gaAtivo').checked,

      rastrearScrollDepth: document.getElementById('rastrearScrollDepth').checked,
      rastrearTempoNaPagina: document.getElementById('rastrearTempoNaPagina').checked,
      rastrearCliquesOutbound: document.getElementById('rastrearCliquesOutbound').checked
    };

    const result = await ConfigService.salvar(config);

    if (result.success) {
      alert('Configurações salvas com sucesso!');
      this.atualizarStatus();
    } else {
      alert('Erro ao salvar configurações');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ConfigTrackingPage.init());
window.testarTracking = () => ConfigTrackingPage.testarTracking();
window.ConfigTrackingPage = ConfigTrackingPage;


