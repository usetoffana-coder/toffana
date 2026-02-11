/**
 * Página: Configurações > Menu & Links
 */
const ConfigMenuLinksPage = {
  init() {
    if (window.MenuLinksUI) {
      MenuLinksUI.init();
    }
    if (window.PaginasUI) {
      PaginasUI.init();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ConfigMenuLinksPage.init());
window.ConfigMenuLinksPage = ConfigMenuLinksPage;
