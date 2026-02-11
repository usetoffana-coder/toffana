/**
 * Página: Configurações > Comunicação
 */
const ConfigComunicacaoPage = {
  init() {
    if (window.ComunicacaoUI) {
      ComunicacaoUI.init();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ConfigComunicacaoPage.init());
window.ConfigComunicacaoPage = ConfigComunicacaoPage;
