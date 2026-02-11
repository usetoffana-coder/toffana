/**
 * Página: Produto Form
 */
const ProdutoFormPage = {
  init() {
    if (window.ProdutosUI) {
      ProdutosUI.init();
    }

    this.carregarDataLists();
    this.carregarEdicao();
  },

  async carregarDataLists() {
    try {
      const marcasList = document.getElementById('marcas-list');
      const categoriasList = document.getElementById('categorias-list');

      const [marcas, categorias] = await Promise.all([
        window.MarcasService ? MarcasService.listar() : Promise.resolve([]),
        window.CategoriasService ? CategoriasService.listar() : Promise.resolve([])
      ]);

      if (marcasList) {
        DomUtils.clear(marcasList);
        marcas
          .filter(m => m.ativo !== false)
          .forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.nome || '';
            marcasList.appendChild(opt);
          });
      }

      if (categoriasList) {
        DomUtils.clear(categoriasList);
        categorias
          .filter(c => c.ativo !== false)
          .forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.nome || '';
            categoriasList.appendChild(opt);
          });
      }
    } catch (e) {
      console.warn('Erro ao carregar datalists:', e);
    }
  },

  carregarEdicao() {
    const urlParams = new URLSearchParams(window.location.search);
    const produtoId = urlParams.get('id');

    if (produtoId) {
      document.getElementById('pageTitle').textContent = 'Editar Produto';
      ProdutosUI.carregarFormulario(produtoId);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ProdutoFormPage.init());
window.ProdutoFormPage = ProdutoFormPage;


