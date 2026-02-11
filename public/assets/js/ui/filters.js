/**
 * Catalog Filters
 */

const Filters = {
  produtosTodos: [],
  filtrosMarcaSelecionados: [],
  filtrosTamanhoSelecionados: [],
  termoBusca: '',
  config: null,
  initialized: false,
  _listenersBound: false,

  init(produtos, config) {
    this.produtosTodos = produtos;
    this.config = config;
    this.renderizarFiltros();
    this.configurarEventListeners();
    this.initialized = true;
  },

  atualizarProdutos(produtos) {
    this.produtosTodos = produtos;
    const marcasSelecionadas = [...this.filtrosMarcaSelecionados];
    const tamanhosSelecionados = [...this.filtrosTamanhoSelecionados];

    this.renderizarFiltros();

    const marcasDisponiveis = DataService.extrairMarcas(produtos);
    const tamanhosDisponiveis = DataService.extrairTamanhos(produtos);

    this.filtrosMarcaSelecionados = marcasSelecionadas.filter(m => marcasDisponiveis.includes(m));
    this.filtrosTamanhoSelecionados = tamanhosSelecionados.filter(t => tamanhosDisponiveis.includes(t));

    document.querySelectorAll('[data-filtro="marca"]').forEach(checkbox => {
      checkbox.checked = this.filtrosMarcaSelecionados.includes(checkbox.value);
    });

    document.querySelectorAll('[data-filtro="tamanho"]').forEach(checkbox => {
      checkbox.checked = this.filtrosTamanhoSelecionados.includes(checkbox.value);
    });
  },

  renderizarFiltros() {
    this.renderizarFiltrosMarca();
    this.renderizarFiltrosTamanho();
  },

  renderizarFiltrosMarca() {
    const container = document.getElementById('filtrosMarca');
    if (!container) return;

    const marcas = DataService.extrairMarcas(this.produtosTodos);

    container.innerHTML = marcas.map(marca => {
      const safe = DomUtils.escapeHtml(marca);
      return `
        <label class="filtro-checkbox">
          <input type="checkbox" value="${safe}" data-filtro="marca">
          <span>${safe}</span>
        </label>
      `;
    }).join('');
  },

  renderizarFiltrosTamanho() {
    const container = document.getElementById('filtrosTamanho');
    if (!container) return;

    const tamanhos = DataService.extrairTamanhos(this.produtosTodos);

    container.innerHTML = tamanhos.map(tamanho => {
      const safe = DomUtils.escapeHtml(tamanho);
      return `
        <label class="filtro-checkbox">
          <input type="checkbox" value="${safe}" data-filtro="tamanho">
          <span>${safe}</span>
        </label>
      `;
    }).join('');
  },

  configurarEventListeners() {
    if (!this._listenersBound) {
      const campoBusca = document.getElementById('campoBusca');
      if (campoBusca) {
        campoBusca.addEventListener('input', (e) => {
          this.termoBusca = e.target.value.toLowerCase();
          this.aplicarFiltros();
        });
      }

      const btnLimpar = document.getElementById('btnLimparFiltros');
      if (btnLimpar) {
        btnLimpar.addEventListener('click', () => this.limparFiltros());
      }

      const filtrosMarca = document.getElementById('filtrosMarca');
      if (filtrosMarca) {
        filtrosMarca.addEventListener('change', (e) => {
          if (!e.target || e.target.dataset.filtro !== 'marca') return;
          if (e.target.checked) {
            this.filtrosMarcaSelecionados.push(e.target.value);
          } else {
            this.filtrosMarcaSelecionados = this.filtrosMarcaSelecionados.filter(
              m => m !== e.target.value
            );
          }
          this.aplicarFiltros();
        });
      }

      const filtrosTamanho = document.getElementById('filtrosTamanho');
      if (filtrosTamanho) {
        filtrosTamanho.addEventListener('change', (e) => {
          if (!e.target || e.target.dataset.filtro !== 'tamanho') return;
          if (e.target.checked) {
            this.filtrosTamanhoSelecionados.push(e.target.value);
          } else {
            this.filtrosTamanhoSelecionados = this.filtrosTamanhoSelecionados.filter(
              t => t !== e.target.value
            );
          }
          this.aplicarFiltros();
        });
      }

      this._listenersBound = true;
    }

  },

  aplicarFiltros() {
    let produtosFiltrados = [...this.produtosTodos];

    if (this.termoBusca) {
      produtosFiltrados = produtosFiltrados.filter(p =>
        String(p.nome || '').toLowerCase().includes(this.termoBusca) ||
        String(p.marca || '').toLowerCase().includes(this.termoBusca) ||
        (p.categoria && String(p.categoria).toLowerCase().includes(this.termoBusca))
      );
    }

    if (this.filtrosMarcaSelecionados.length > 0) {
      produtosFiltrados = produtosFiltrados.filter(p =>
        this.filtrosMarcaSelecionados.includes(p.marca)
      );
    }

    if (this.filtrosTamanhoSelecionados.length > 0) {
      produtosFiltrados = produtosFiltrados.filter(p =>
        Array.isArray(p.tamanhos) && p.tamanhos.some(t => this.filtrosTamanhoSelecionados.includes(t))
      );
    }

    this.atualizarContadores(produtosFiltrados.length);
    CatalogRender.renderizarPorCategorias(produtosFiltrados);
    this.fecharSidebarMobile();
  },

  limparFiltros() {
    this.filtrosMarcaSelecionados = [];
    this.filtrosTamanhoSelecionados = [];
    this.termoBusca = '';

    document.querySelectorAll('[data-filtro]').forEach(checkbox => {
      checkbox.checked = false;
    });

    const campoBusca = document.getElementById('campoBusca');
    if (campoBusca) {
      campoBusca.value = '';
    }

    CatalogRender.categoriaAtual = 'todas';
    document.querySelectorAll('.categoria-item').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.categoria === 'todas') {
        btn.classList.add('active');
      }
    });

    this.atualizarContadores(this.produtosTodos.length);
    CatalogRender.renderizarPorCategorias(this.produtosTodos);
    this.fecharSidebarMobile();
  },

  fecharSidebarMobile() {
    const sidebar = document.getElementById('filtrosSidebar');
    const overlay = document.getElementById('filtrosOverlay');

    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  },

  atualizarContadores(total) {
    const contador = document.getElementById('contadorProdutos');
    if (contador) {
      contador.textContent = `${total} produto${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
    }
  }
};

window.Filters = Filters;

