/**
 * Página: Produtos (lista)
 */
const ProdutosPage = {
  pageSize: 25,
  lastDocs: [],
  currentPage: 0,
  currentItems: [],
  currentFiltered: [],
  selectedIds: new Set(),

  init() {
    this.bindEvents();
    this.carregarPagina();
  },

  bindEvents() {
    document.getElementById('prevPage')?.addEventListener('click', () => this.prev());
    document.getElementById('nextPage')?.addEventListener('click', () => this.next());

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      const handler = DomUtils.debounce(() => this.aplicarFiltro(searchInput.value), 300);
      searchInput.addEventListener('input', handler);
    }

    document.getElementById('selectAllProdutos')?.addEventListener('change', (e) => {
      this.toggleSelectAll(e.target.checked);
    });

    document.getElementById('bulkAtivar')?.addEventListener('click', () => this.bulkSetAtivo(true));
    document.getElementById('bulkDesativar')?.addEventListener('click', () => this.bulkSetAtivo(false));
    document.getElementById('bulkAplicarCategoria')?.addEventListener('click', () => this.bulkAlterarCategoria());
    document.getElementById('bulkAplicarMarca')?.addEventListener('click', () => this.bulkAlterarMarca());
    document.getElementById('bulkAplicarDesconto')?.addEventListener('click', () => this.bulkAplicarDesconto());
    document.getElementById('bulkExcluir')?.addEventListener('click', () => this.bulkExcluir());

    document.getElementById('exportProdutosCsv')?.addEventListener('click', () => {
      if (window.ExportService) ExportService.exportProdutos(this.currentFiltered, 'csv');
    });
    document.getElementById('exportProdutosJson')?.addEventListener('click', () => {
      if (window.ExportService) ExportService.exportProdutos(this.currentFiltered, 'json');
    });
  },

  async carregarPagina() {
    const lastDoc = this.lastDocs[this.currentPage - 1] || null;
    const result = await ProdutosService.listarPaginado(this.pageSize, lastDoc);
    this.currentItems = result.items;
    this.aplicarFiltro(document.getElementById('searchInput')?.value || '');

    if (result.lastDoc) {
      this.lastDocs[this.currentPage] = result.lastDoc;
    }

    this.updatePagination(result.items.length);
  },

  aplicarFiltro(termo) {
    const t = String(termo || '').toLowerCase().trim();
    if (!t) {
      this.currentFiltered = this.currentItems.slice();
      ProdutosUI.renderizarLista(this.currentItems);
      this.clearSelection();
      return;
    }

    const filtrados = this.currentItems.filter(p => {
      const nome = String(p.nome || '').toLowerCase();
      const marca = String(p.marca || '').toLowerCase();
      return nome.includes(t) || marca.includes(t);
    });
    this.currentFiltered = filtrados;
    ProdutosUI.renderizarLista(filtrados);
    this.clearSelection();
  },

  updatePagination(count) {
    const info = document.getElementById('pageInfo');
    if (info) info.textContent = `Página ${this.currentPage + 1}`;

    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (prevBtn) prevBtn.disabled = this.currentPage === 0;
    if (nextBtn) nextBtn.disabled = count < this.pageSize;
  },

  async next() {
    this.currentPage += 1;
    await this.carregarPagina();
  },

  async prev() {
    if (this.currentPage === 0) return;
    this.currentPage -= 1;
    await this.carregarPagina();
  },

  toggleSelection(id, checked) {
    if (checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
    this.updateBulkBar();
  },

  toggleSelectAll(checked) {
    this.selectedIds.clear();
    const checkboxes = document.querySelectorAll('.select-produto');
    checkboxes.forEach(chk => {
      chk.checked = checked;
      const id = chk.dataset.id;
      if (checked && id) this.selectedIds.add(id);
    });
    this.updateBulkBar();
  },

  clearSelection() {
    this.selectedIds.clear();
    const selectAll = document.getElementById('selectAllProdutos');
    if (selectAll) selectAll.checked = false;
    document.querySelectorAll('.select-produto').forEach(chk => {
      chk.checked = false;
    });
    this.updateBulkBar();
  },

  updateBulkBar() {
    const bar = document.getElementById('bulkActionsBar');
    const countEl = document.getElementById('bulkSelectionCount');
    if (!bar || !countEl) return;
    const count = this.selectedIds.size;
    countEl.textContent = `${count} selecionado(s)`;
    bar.style.display = count > 0 ? 'flex' : 'none';
  },

  async bulkSetAtivo(ativo) {
    await this.bulkUpdate(async (p) => ({ ...p, ativo }));
  },

  async bulkAlterarCategoria() {
    const categoria = document.getElementById('bulkCategoria')?.value.trim();
    if (!categoria) {
      alert('Informe uma categoria válida.');
      return;
    }
    await this.bulkUpdate(async (p) => ({ ...p, categoria }));
  },

  async bulkAlterarMarca() {
    const marca = document.getElementById('bulkMarca')?.value.trim();
    if (!marca) {
      alert('Informe uma marca válida.');
      return;
    }
    await this.bulkUpdate(async (p) => ({ ...p, marca }));
  },

  async bulkAplicarDesconto() {
    const desconto = parseFloat(document.getElementById('bulkDescontoPix')?.value) || 0;
    if (desconto <= 0 || desconto > 100) {
      alert('Informe um desconto entre 1 e 100.');
      return;
    }
    await this.bulkUpdate(async (p) => {
      const novoPix = Math.max(0, (Number(p.precoPix) || 0) * (1 - desconto / 100));
      const cartao = Number(p.precoCartao) || 0;
      return { ...p, precoPix: Math.min(novoPix, cartao) };
    });
  },

  async bulkExcluir() {
    const ids = [...this.selectedIds];
    if (ids.length === 0) return;

    if (!confirm(`Excluir ${ids.length} produto(s)?\n\nEsta ação é irreversível.`)) {
      return;
    }

    const senha = prompt('Opcional: digite sua senha para reautenticar (ou deixe em branco).');
    if (senha) {
      const reauth = await AuthService.reauthenticate(senha);
      if (!reauth.success) {
        alert('Reautenticação falhou.');
        return;
      }
    }

    try {
      ProdutosUI.mostrarLoading('Excluindo produtos...');
      for (const id of ids) {
        await ProdutosService.deletar(id);
      }
      if (window.AuditService) {
        await AuditService.log({
          action: 'bulk_delete',
          entity: 'produto',
          entityId: ids.join(',')
        });
      }
      alert('Produtos excluídos com sucesso.');
      this.clearSelection();
      await this.carregarPagina();
    } catch (error) {
      alert('Erro ao excluir produtos.');
    } finally {
      ProdutosUI.esconderLoading();
    }
  },

  async bulkUpdate(modifier) {
    const ids = [...this.selectedIds];
    if (ids.length === 0) return;

    if (window.RateLimiter && !RateLimiter.allowBucket('produtos:bulk', 5, 1 / 10)) {
      if (window.AuditService) {
        await AuditService.log({
          action: 'rate_limited',
          entity: 'produto',
          entityId: 'bulk'
        });
      }
      alert('Muitas tentativas. Aguarde alguns segundos.');
      return;
    }

    try {
      ProdutosUI.mostrarLoading('Aplicando alterações...');
      for (const id of ids) {
        const base = await this.getProdutoBase(id);
        if (!base) continue;
        const mod = await modifier(base);
        await ProdutosService.atualizar(id, mod);
      }
      if (window.AuditService) {
        await AuditService.log({
          action: 'bulk_update',
          entity: 'produto',
          entityId: ids.join(',')
        });
      }
      alert('Alterações aplicadas com sucesso.');
      this.clearSelection();
      await this.carregarPagina();
    } catch (error) {
      alert('Erro ao aplicar alterações em lote.');
    } finally {
      ProdutosUI.esconderLoading();
    }
  },

  async getProdutoBase(id) {
    const inPage = this.currentItems.find(p => p.id === id);
    const produto = inPage || await ProdutosService.buscarPorId(id);
    if (!produto) return null;

    return {
      nome: produto.nome || '',
      marca: produto.marca || '',
      categoria: produto.categoria || '',
      tipoProdutoId: produto.tipoProdutoId || '',
      tipoProdutoNome: produto.tipoProdutoNome || '',
      precoPix: Number(produto.precoPix) || 0,
      precoCartao: Number(produto.precoCartao) || 0,
      tamanhos: Array.isArray(produto.tamanhos) ? produto.tamanhos : [],
      imagemUrl: produto.imagemUrl || '',
      ativo: produto.ativo !== false,
      status: produto.status || 'draft',
      slug: produto.slug || '',
      seoTitle: produto.seoTitle || '',
      seoDescription: produto.seoDescription || '',
      featured: produto.featured === true,
      relacionados: Array.isArray(produto.relacionados) ? produto.relacionados : []
    };
  }
};

document.addEventListener('DOMContentLoaded', () => ProdutosPage.init());
window.ProdutosPage = ProdutosPage;
