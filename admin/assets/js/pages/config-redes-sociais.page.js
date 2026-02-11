/**
 * Página: Configurações > Redes Sociais
 */
const ConfigRedesSociaisPage = {
  init() {
    if (window.RedesSociaisUI) {
      RedesSociaisUI.init();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ConfigRedesSociaisPage.init());
window.ConfigRedesSociaisPage = ConfigRedesSociaisPage;
