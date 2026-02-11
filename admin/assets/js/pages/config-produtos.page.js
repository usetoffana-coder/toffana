/**
 * Página: Configurações > Produtos
 */
const ConfigProdutosPage = {
  init() {
    if (window.ConfiguracoesProdutosUI) {
      ConfiguracoesProdutosUI.init();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ConfigProdutosPage.init());
window.ConfigProdutosPage = ConfigProdutosPage;
