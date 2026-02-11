/**
 * UI de Produtos V3
 */

const ProdutosUI = {
  isSubmitting: false,
  isUploading: false,
  tiposDisponiveis: [],
  produtosDisponiveis: [],

  init() {
    const form = document.getElementById('produtoForm');
    if (form) {
      form.addEventListener('submit', e => this.salvarProduto(e));
    }
    const btnRascunho = document.getElementById('btnSalvarRascunho');
    if (btnRascunho) {
      btnRascunho.addEventListener('click', () => this.setStatusAndSubmit('draft'));
    }
    const btnPublicar = document.getElementById('btnPublicarProduto');
    if (btnPublicar) {
      btnPublicar.addEventListener('click', () => this.setStatusAndSubmit('published'));
    }
    const btnArquivar = document.getElementById('btnArquivarProduto');
    if (btnArquivar) {
      btnArquivar.addEventListener('click', () => this.setStatusAndSubmit('archived'));
    }

    const nomeInput = document.getElementById('nome');
    const slugInput = document.getElementById('slug');
    if (nomeInput && slugInput) {
      nomeInput.addEventListener('input', () => {
        if (slugInput.value.trim()) return;
        slugInput.value = this.gerarSlug(nomeInput.value);
      });
    }

    const inputImagem = document.getElementById('imagemUpload');
    if (inputImagem) {
      inputImagem.addEventListener('change', e => this.processarUpload(e));
    }

    const tipoSelect = document.getElementById('tipoProduto');
    if (tipoSelect) {
      tipoSelect.addEventListener('change', e => this.carregarTamanhosPorTipo(e.target.value));
    }

    this.carregarTiposProduto();
    this.carregarProdutosParaRelacionados();
  },

  async carregarTiposProduto() {
    try {
      this.tiposDisponiveis = await TiposProdutoService.listar();
      this.renderizarSelectTipos();
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
    }
  },

  async carregarProdutosParaRelacionados() {
    const select = document.getElementById('relacionados');
    if (!select) return;

    try {
      this.produtosDisponiveis = await ProdutosService.listar();
      DomUtils.clear(select);
      this.produtosDisponiveis.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.nome;
        select.appendChild(opt);
      });
    } catch (error) {
      console.error('Erro ao carregar relacionados:', error);
    }
  },

  renderizarSelectTipos() {
    const select = document.getElementById('tipoProduto');
    if (!select) return;

    const tiposAtivos = this.tiposDisponiveis.filter(t => t.ativo);
    DomUtils.clear(select);

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecione o tipo';
    select.appendChild(placeholder);

    tiposAtivos.forEach(tipo => {
      const opt = document.createElement('option');
      opt.value = tipo.id;
      opt.textContent = tipo.nome;
      select.appendChild(opt);
    });
  },

  async carregarTamanhosPorTipo(tipoId) {
    const container = document.getElementById('tamanhosSelect');
    if (!container) return;

    DomUtils.clear(container);

    if (!tipoId) {
      const p = document.createElement('p');
      p.className = 'text-secondary';
      p.textContent = 'Selecione um tipo de produto primeiro';
      container.appendChild(p);
      return;
    }

    const tipo = this.tiposDisponiveis.find(t => t.id === tipoId);
    if (!tipo) return;

    this.renderizarTamanhos(tipo.opcoesTamanho, tipo.nomePropriedade);
  },

  renderizarTamanhos(tamanhos, nomePropriedade = 'Tamanho', tamanhosSelecionados = []) {
    const container = document.getElementById('tamanhosSelect');
    if (!container) return;

    const label = document.querySelector('label[for="tamanhosSelect"]');
    if (label) {
      label.textContent = `${nomePropriedade} Disponíveis *`;
    }

    DomUtils.clear(container);

    tamanhos.forEach(tamanho => {
      const labelEl = DomUtils.create('label', 'tamanho-item');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'tamanhos';
      input.value = tamanho;
      if (tamanhosSelecionados.includes(tamanho)) input.checked = true;

      const span = document.createElement('span');
      span.textContent = tamanho;

      labelEl.appendChild(input);
      labelEl.appendChild(span);
      container.appendChild(labelEl);
    });
  },

  renderizarLista(produtos = []) {
    const tbody = document.getElementById('produtosTableBody');
    if (!tbody) return;

    DomUtils.clear(tbody);

    if (!Array.isArray(produtos) || produtos.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 8;
      td.style.textAlign = 'center';
      td.style.padding = '40px';
      td.textContent = 'Nenhum produto cadastrado';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    const frag = document.createDocumentFragment();

    produtos.forEach(produto => {
      const tr = document.createElement('tr');

      const tdSelect = document.createElement('td');
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.className = 'select-produto';
      chk.dataset.id = produto.id;
      chk.addEventListener('change', (e) => {
        if (window.ProdutosPage) {
          ProdutosPage.toggleSelection(produto.id, e.target.checked);
        }
      });
      tdSelect.appendChild(chk);

      const tdImg = document.createElement('td');
      const img = document.createElement('img');
      img.src = produto.imagemUrl || '';
      img.alt = produto.nome || 'Produto';
      img.loading = 'lazy';
      img.style.width = '60px';
      img.style.height = '60px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      tdImg.appendChild(img);

      const tdNome = document.createElement('td');
      const strong = document.createElement('strong');
      strong.textContent = produto.nome || '';
      const small = document.createElement('small');
      small.className = 'text-secondary';
      small.textContent = produto.tipoProdutoNome || 'Sem tipo';
      tdNome.appendChild(strong);
      tdNome.appendChild(document.createElement('br'));
      tdNome.appendChild(small);

      const tdMarca = document.createElement('td');
      tdMarca.textContent = produto.marca || '';

      const tdPix = document.createElement('td');
      tdPix.textContent = `R$ ${this.formatarPreco(produto.precoPix)}`;

      const tdCartao = document.createElement('td');
      tdCartao.textContent = `R$ ${this.formatarPreco(produto.precoCartao)}`;

      const tdStatus = document.createElement('td');
      const badge = document.createElement('span');
      const status = produto.status || 'draft';
      const statusLabel = status === 'published'
        ? 'Publicado'
        : status === 'archived'
          ? 'Arquivado'
          : 'Rascunho';
      badge.className = `status-badge ${produto.ativo ? 'ativo' : 'inativo'}`;
      badge.textContent = `${statusLabel}${produto.ativo ? '' : ' (Inativo)'}`;
      tdStatus.appendChild(badge);

      const tdAcoes = document.createElement('td');
      tdAcoes.className = 'acoes';

      const btnEditar = document.createElement('button');
      btnEditar.className = 'btn-editar';
      btnEditar.title = 'Editar';
      btnEditar.textContent = '✏️';
      btnEditar.addEventListener('click', () => this.editar(produto.id));

      const btnClonar = document.createElement('button');
      btnClonar.className = 'btn-clonar';
      btnClonar.title = 'Clonar';
      btnClonar.textContent = '📄';
      btnClonar.addEventListener('click', () => this.clonar(produto.id));

      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn-deletar';
      btnDelete.title = 'Excluir';
      btnDelete.textContent = '🗑️';
      btnDelete.addEventListener('click', () => this.confirmarDelete(produto.id, produto.nome || ''));

      tdAcoes.appendChild(btnEditar);
      tdAcoes.appendChild(btnClonar);
      tdAcoes.appendChild(btnDelete);

      tr.appendChild(tdSelect);
      tr.appendChild(tdImg);
      tr.appendChild(tdNome);
      tr.appendChild(tdMarca);
      tr.appendChild(tdPix);
      tr.appendChild(tdCartao);
      tr.appendChild(tdStatus);
      tr.appendChild(tdAcoes);

      frag.appendChild(tr);
    });

    tbody.appendChild(frag);
  },

  editar(id) {
    window.location.href = `/admin/produto-form.html?id=${encodeURIComponent(id)}`;
  },

  async clonar(id) {
    if (!confirm('Clonar este produto?')) return;
    try {
      this.mostrarLoading('Clonando produto...');
      const result = await ProdutosService.clonar(id);
      if (result.success) {
        this.mostrarMensagem('Produto clonado com sucesso!', 'success');
        window.location.href = `/admin/produto-form.html?id=${encodeURIComponent(result.id)}`;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.mostrarMensagem('Erro ao clonar produto', 'error');
    } finally {
      this.esconderLoading();
    }
  },

  async confirmarDelete(id, nome) {
    if (!confirm(`Excluir o produto "${nome}"?\n\nEsta ação é irreversível.`)) {
      return;
    }

    try {
      this.mostrarLoading('Excluindo produto...');
      await ProdutosService.deletar(id);
      this.mostrarMensagem('Produto excluído com sucesso!', 'success');
      this.renderizarLista(await ProdutosService.listar());
    } catch (err) {
      this.mostrarMensagem('Erro ao excluir produto', 'error');
    } finally {
      this.esconderLoading();
    }
  },

  async carregarFormulario(produtoId) {
    try {
      this.mostrarLoading('Carregando produto...');

      await this.carregarTiposProduto();
      await this.carregarProdutosParaRelacionados();

      const produto = await ProdutosService.buscarPorId(produtoId);

      if (!produto) {
        alert('Produto não encontrado');
        window.location.href = '/admin/produtos.html';
        return;
      }

      document.getElementById('nome').value = produto.nome || '';
      document.getElementById('marca').value = produto.marca || '';
      document.getElementById('categoria').value = produto.categoria || '';
      document.getElementById('tipoProduto').value = produto.tipoProdutoId || '';
      document.getElementById('precoPix').value = produto.precoPix || 0;
      document.getElementById('precoCartao').value = produto.precoCartao || 0;
      document.getElementById('imagemUrlHidden').value = produto.imagemUrl || '';
      document.getElementById('ativo').checked = produto.ativo !== false;
      document.getElementById('status').value = produto.status || 'draft';
      document.getElementById('slug').value = produto.slug || '';
      document.getElementById('seoTitle').value = produto.seoTitle || '';
      document.getElementById('seoDescription').value = produto.seoDescription || '';
      document.getElementById('featured').checked = produto.featured === true;

      const relacionadosSelect = document.getElementById('relacionados');
      if (relacionadosSelect && Array.isArray(produto.relacionados)) {
        [...relacionadosSelect.options].forEach(opt => {
          opt.selected = produto.relacionados.includes(opt.value);
        });
      }

      const preview = document.getElementById('imagemPreview');
      if (preview && produto.imagemUrl) {
        DomUtils.clear(preview);
        const img = document.createElement('img');
        img.src = produto.imagemUrl;
        img.alt = 'Produto';
        preview.appendChild(img);
        preview.style.display = 'block';
      }

      if (produto.tipoProdutoId) {
        const tipo = this.tiposDisponiveis.find(t => t.id === produto.tipoProdutoId);
        if (tipo) {
          this.renderizarTamanhos(tipo.opcoesTamanho, tipo.nomePropriedade, produto.tamanhos || []);
        }
      }

      this.renderizarHistoricoPreco(produto.priceHistory || []);
      this.esconderLoading();
    } catch (error) {
      this.esconderLoading();
      alert('Erro ao carregar produto');
    }
  },

  renderizarHistoricoPreco(history) {
    const container = document.getElementById('priceHistory');
    if (!container) return;

    DomUtils.clear(container);

    if (!Array.isArray(history) || history.length === 0) {
      const p = document.createElement('p');
      p.className = 'text-secondary';
      p.textContent = 'Nenhuma alteração de preço registrada.';
      container.appendChild(p);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'price-history-list';

    history.slice(0, 10).forEach(item => {
      const li = document.createElement('li');
      const date = item.changedAt && typeof item.changedAt.toDate === 'function'
        ? item.changedAt.toDate()
        : null;
      const label = date ? date.toLocaleString('pt-BR') : 'Agora';
      li.textContent = `${label} - PIX R$ ${this.formatarPreco(item.precoPix)} | Cartão R$ ${this.formatarPreco(item.precoCartao)}`;
      list.appendChild(li);
    });

    container.appendChild(list);
  },

  async processarUpload(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      this.mostrarMensagem('Selecione uma imagem válida', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.mostrarMensagem('Imagem muito grande (máx. 5MB)', 'error');
      return;
    }

    const preview = document.getElementById('imagemPreview');
    if (!preview) return;

    DomUtils.clear(preview);
    preview.style.display = 'block';

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.style.width = '160px';
    img.style.height = '160px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '10px';

    const progressContainer = document.createElement('div');
    progressContainer.style.marginTop = '8px';

    const barWrap = document.createElement('div');
    barWrap.style.width = '160px';
    barWrap.style.height = '8px';
    barWrap.style.background = '#334155';
    barWrap.style.borderRadius = '4px';

    const bar = document.createElement('div');
    bar.id = 'uploadBar';
    bar.style.width = '0%';
    bar.style.height = '100%';
    bar.style.background = '#10b981';
    bar.style.borderRadius = '4px';
    bar.style.transition = 'width .2s';

    barWrap.appendChild(bar);
    progressContainer.appendChild(barWrap);

    preview.appendChild(img);
    preview.appendChild(progressContainer);

    this.isUploading = true;

    try {
      const imageUrl = await this.uploadComProgresso(file);
      document.getElementById('imagemUrlHidden').value = imageUrl;
      img.src = imageUrl;
      progressContainer.remove();
    } catch (err) {
      progressContainer.remove();
      this.mostrarMensagem('Erro ao enviar imagem', 'error');
    } finally {
      this.isUploading = false;
    }
  },

  uploadComProgresso(file) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      formData.append('file', file);
      formData.append('upload_preset', ProdutosService.cloudinary.uploadPreset);

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          const bar = document.getElementById('uploadBar');
          if (bar) bar.style.width = percent + '%';
        }
      };

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText || '{}');
          res.secure_url ? resolve(res.secure_url) : reject(new Error('URL não retornada'));
        } catch {
          reject(new Error('Erro ao processar resposta'));
        }
      };

      xhr.onerror = () => reject(new Error('Erro na requisição'));

      xhr.open(
        'POST',
        `https://api.cloudinary.com/v1_1/${ProdutosService.cloudinary.cloudName}/image/upload`
      );
      xhr.send(formData);
    });
  },

  async salvarProduto(e) {
    e.preventDefault();

    if (this.isSubmitting || this.isUploading) {
      alert('Aguarde o upload da imagem finalizar');
      return;
    }

    if (window.RateLimiter && !RateLimiter.allowBucket('produtos:save', 10, 1 / 10)) {
      if (window.AuditService) {
        await AuditService.log({
          action: 'rate_limited',
          entity: 'produto',
          entityId: 'form'
        });
      }
      alert('Muitas tentativas. Aguarde alguns segundos.');
      return;
    }

    this.isSubmitting = true;
    const form = e.target;
    const produtoId = new URLSearchParams(window.location.search).get('id');

    const tamanhosSelecionados = [...document.querySelectorAll('#tamanhosSelect input:checked')]
      .map(i => i.value);

    const tipoId = form.tipoProduto.value;
    const tipo = this.tiposDisponiveis.find(t => t.id === tipoId);

    const relacionadosSelect = document.getElementById('relacionados');
    const relacionados = relacionadosSelect
      ? [...relacionadosSelect.selectedOptions].map(opt => opt.value)
      : [];

    const produto = {
      nome: form.nome.value.trim(),
      marca: form.marca.value.trim(),
      categoria: form.categoria.value.trim(),
      tipoProdutoId: tipoId,
      tipoProdutoNome: tipo ? tipo.nome : '',
      precoPix: Number(form.precoPix.value),
      precoCartao: Number(form.precoCartao.value),
      tamanhos: tamanhosSelecionados,
      imagemUrl: form.imagemUrlHidden.value,
      ativo: form.ativo.checked,
      status: form.status.value,
      slug: form.slug.value.trim(),
      seoTitle: form.seoTitle.value.trim(),
      seoDescription: form.seoDescription.value.trim(),
      featured: form.featured.checked,
      relacionados
    };

    const validacao = ProdutosService.validar(produto);

    if (!validacao.valido) {
      alert(validacao.erros.join('\n'));
      this.isSubmitting = false;
      return;
    }

    try {
      this.mostrarLoading(produtoId ? 'Atualizando...' : 'Salvando...');

      const result = produtoId
        ? await ProdutosService.atualizar(produtoId, produto)
        : await ProdutosService.criar(produto);

      if (result.success) {
        this.mostrarMensagem('Produto salvo com sucesso!', 'success');
        setTimeout(() => {
          window.location.href = '/admin/produtos.html';
        }, 1200);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      this.mostrarMensagem('Erro ao salvar produto', 'error');
    } finally {
      this.isSubmitting = false;
      this.esconderLoading();
    }
  },

  setStatusAndSubmit(status) {
    const statusSelect = document.getElementById('status');
    if (statusSelect) statusSelect.value = status;
    const form = document.getElementById('produtoForm');
    if (form) form.requestSubmit();
  },

  formatarPreco(valor) {
    const num = Number(valor);
    return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
  },

  mostrarLoading(msg) {
    let el = document.getElementById('loadingOverlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'loadingOverlay';
      el.className = 'loading-overlay';
      document.body.appendChild(el);
    }
    DomUtils.clear(el);

    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    const p = document.createElement('p');
    p.textContent = msg || '';

    el.appendChild(spinner);
    el.appendChild(p);
    el.style.display = 'flex';
  },

  esconderLoading() {
    const el = document.getElementById('loadingOverlay');
    if (el) el.style.display = 'none';
  },

  mostrarMensagem(msg, tipo = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo}`;
    alert.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10000;
      min-width: 300px;
      animation: slideInRight 0.3s ease;
    `;
    alert.textContent = msg;

    document.body.appendChild(alert);

    setTimeout(() => {
      alert.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  },

  gerarSlug(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
};

window.ProdutosUI = ProdutosUI;

document.addEventListener('DOMContentLoaded', () => ProdutosUI.init());


