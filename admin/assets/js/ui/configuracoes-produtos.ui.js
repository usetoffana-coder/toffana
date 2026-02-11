/**
 * UI de Configurações de Produtos
 * Gerencia Tipos, Categorias e Marcas
 */

// ===================================
// VARIÁVEIS GLOBAIS
// ===================================
let opcoesTamanhoTemp = [];
let tipoEditandoId = null;
let categoriaEditandoId = null;
let marcaEditandoId = null;
let isUploadingLogo = false;

// ===================================
// INICIALIZAÇÃO
// ===================================
const ConfiguracoesProdutosUI = {
  init() {
    carregarTodosDados();
    setupEventListeners();
  }
};

window.ConfiguracoesProdutosUI = ConfiguracoesProdutosUI;

function setupEventListeners() {
  document.getElementById('btnNovoTipo')?.addEventListener('click', () => abrirModalTipo());
  document.getElementById('btnNovaCategoria')?.addEventListener('click', () => abrirModalCategoria());
  document.getElementById('btnNovaMarca')?.addEventListener('click', () => abrirModalMarca());

  document.getElementById('formTipo')?.addEventListener('submit', salvarTipo);
  document.getElementById('formCategoria')?.addEventListener('submit', salvarCategoria);
  document.getElementById('formMarca')?.addEventListener('submit', salvarMarca);

  document.getElementById('marcaLogoUpload')?.addEventListener('change', uploadLogoMarca);
}

// ===================================
// CARREGAR DADOS
// ===================================
async function carregarTodosDados() {
  await Promise.all([
    carregarTipos(),
    carregarCategorias(),
    carregarMarcas()
  ]);
}

// ===================================
// TIPOS DE PRODUTO
// ===================================
async function carregarTipos() {
  const tipos = await TiposProdutoService.listar();
  const tbody = document.getElementById('tiposTableBody');
  if (!tbody) return;

  DomUtils.clear(tbody);

  if (tipos.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.style.textAlign = 'center';
    td.style.padding = '40px';
    td.textContent = 'Nenhum tipo cadastrado.';

    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = 'Criar Primeiro Tipo';
    btn.addEventListener('click', () => abrirModalTipo());

    const wrap = document.createElement('div');
    wrap.style.marginTop = '12px';
    wrap.appendChild(btn);

    td.appendChild(document.createElement('br'));
    td.appendChild(wrap);
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  const frag = document.createDocumentFragment();

  tipos.forEach(tipo => {
    const tr = document.createElement('tr');

    const tdNome = document.createElement('td');
    const strong = document.createElement('strong');
    strong.textContent = tipo.nome || '';
    tdNome.appendChild(strong);

    const tdProp = document.createElement('td');
    tdProp.textContent = tipo.nomePropriedade || '';

    const tdOpcoes = document.createElement('td');
    const div = document.createElement('div');
    div.className = 'opcoes-preview';
    const opcoes = Array.isArray(tipo.opcoesTamanho) ? tipo.opcoesTamanho : [];
    const text = opcoes.slice(0, 5).join(', ');
    const extra = opcoes.length > 5 ? ` (+${opcoes.length - 5})` : '';
    div.textContent = `${text}${extra}`;
    tdOpcoes.appendChild(div);

    const tdStatus = document.createElement('td');
    const status = document.createElement('span');
    status.className = `status-badge ${tipo.ativo ? 'ativo' : 'inativo'}`;
    status.textContent = tipo.ativo ? 'Ativo' : 'Inativo';
    tdStatus.appendChild(status);

    const tdAcoes = document.createElement('td');
    tdAcoes.className = 'acoes';
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn-editar';
    btnEditar.title = 'Editar';
    btnEditar.textContent = '✏️';
    btnEditar.addEventListener('click', () => editarTipo(tipo.id));

    const btnDeletar = document.createElement('button');
    btnDeletar.className = 'btn-deletar';
    btnDeletar.title = 'Deletar';
    btnDeletar.textContent = '🗑️';
    btnDeletar.addEventListener('click', () => deletarTipo(tipo.id, tipo.nome));

    tdAcoes.appendChild(btnEditar);
    tdAcoes.appendChild(btnDeletar);

    tr.appendChild(tdNome);
    tr.appendChild(tdProp);
    tr.appendChild(tdOpcoes);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAcoes);

    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}

function abrirModalTipo(id = null) {
  tipoEditandoId = id;
  opcoesTamanhoTemp = [];

  const modal = document.getElementById('modalTipo');
  const titulo = document.getElementById('modalTipoTitulo');

  if (id) {
    titulo.textContent = 'Editar Tipo de Produto';
    carregarTipoParaEdicao(id);
  } else {
    titulo.textContent = 'Novo Tipo de Produto';
    document.getElementById('formTipo').reset();
    document.getElementById('tipoId').value = '';
    atualizarListaOpcoes();
  }

  modal.style.display = 'flex';
}

function fecharModalTipo() {
  document.getElementById('modalTipo').style.display = 'none';
  opcoesTamanhoTemp = [];
  tipoEditandoId = null;
}

async function carregarTipoParaEdicao(id) {
  const tipo = await TiposProdutoService.buscarPorId(id);

  if (!tipo) {
    alert('Tipo não encontrado');
    fecharModalTipo();
    return;
  }

  document.getElementById('tipoId').value = tipo.id;
  document.getElementById('tipoNome').value = tipo.nome;
  document.getElementById('tipoPropriedade').value = tipo.nomePropriedade;
  document.getElementById('tipoAtivo').checked = tipo.ativo;

  opcoesTamanhoTemp = [...tipo.opcoesTamanho];
  atualizarListaOpcoes();
}

function adicionarOpcaoTamanho() {
  const input = document.getElementById('novaTamanhoOpcao');
  const valor = input.value.trim();

  if (!valor) {
    alert('Digite uma opção');
    return;
  }

  if (opcoesTamanhoTemp.includes(valor)) {
    alert('Esta opção já foi adicionada');
    return;
  }

  opcoesTamanhoTemp.push(valor);
  input.value = '';
  atualizarListaOpcoes();
}

function removerOpcaoTamanho(index) {
  opcoesTamanhoTemp.splice(index, 1);
  atualizarListaOpcoes();
}

function atualizarListaOpcoes() {
  const lista = document.getElementById('listaOpcoesTamanho');
  if (!lista) return;

  DomUtils.clear(lista);

  if (opcoesTamanhoTemp.length === 0) {
    const p = document.createElement('p');
    p.className = 'text-secondary';
    p.textContent = 'Nenhuma opção adicionada';
    lista.appendChild(p);
    return;
  }

  opcoesTamanhoTemp.forEach((opcao, index) => {
    const item = document.createElement('div');
    item.className = 'opcao-item';

    const span = document.createElement('span');
    span.textContent = opcao;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-remover';
    btn.textContent = '✖';
    btn.addEventListener('click', () => removerOpcaoTamanho(index));

    item.appendChild(span);
    item.appendChild(btn);
    lista.appendChild(item);
  });
}

async function salvarTipo(e) {
  e.preventDefault();

  const tipo = {
    nome: DomUtils.sanitizeText(document.getElementById('tipoNome').value.trim(), 120),
    nomePropriedade: DomUtils.sanitizeText(document.getElementById('tipoPropriedade').value.trim(), 120),
    opcoesTamanho: opcoesTamanhoTemp,
    ativo: document.getElementById('tipoAtivo').checked
  };

  const validacao = TiposProdutoService.validar(tipo);

  if (!validacao.valido) {
    alert(validacao.erros.join('\n'));
    return;
  }

  const tipoId = document.getElementById('tipoId').value;
  let result;

  if (tipoId) {
    result = await TiposProdutoService.atualizar(tipoId, tipo);
  } else {
    result = await TiposProdutoService.criar(tipo);
  }

  if (result.success) {
    alert('✅ Tipo salvo com sucesso!');
    fecharModalTipo();
    carregarTipos();
  } else {
    alert('❌ Erro ao salvar tipo: ' + result.error);
  }
}

async function editarTipo(id) {
  abrirModalTipo(id);
}

async function deletarTipo(id, nome) {
  if (!confirm(`Deletar o tipo "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }

  const result = await TiposProdutoService.deletar(id);

  if (result.success) {
    alert('✅ Tipo deletado com sucesso!');
    carregarTipos();
  } else {
    alert('❌ ' + result.error);
  }
}

// ===================================
// CATEGORIAS
// ===================================
async function carregarCategorias() {
  const categorias = await CategoriasService.listar();
  const tbody = document.getElementById('categoriasTableBody');
  if (!tbody) return;

  DomUtils.clear(tbody);

  if (categorias.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.style.textAlign = 'center';
    td.style.padding = '40px';
    td.textContent = 'Nenhuma categoria cadastrada.';

    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = 'Criar Primeira Categoria';
    btn.addEventListener('click', () => abrirModalCategoria());

    const wrap = document.createElement('div');
    wrap.style.marginTop = '12px';
    wrap.appendChild(btn);

    td.appendChild(document.createElement('br'));
    td.appendChild(wrap);
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  const frag = document.createDocumentFragment();

  categorias.forEach(cat => {
    const tr = document.createElement('tr');

    const tdOrdem = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = String(cat.ordem ?? 0);
    tdOrdem.appendChild(badge);

    const tdNome = document.createElement('td');
    const strong = document.createElement('strong');
    strong.textContent = cat.nome || '';
    tdNome.appendChild(strong);

    const tdSlug = document.createElement('td');
    const code = document.createElement('code');
    code.textContent = cat.slug || '';
    tdSlug.appendChild(code);

    const tdStatus = document.createElement('td');
    const status = document.createElement('span');
    status.className = `status-badge ${cat.ativo ? 'ativo' : 'inativo'}`;
    status.textContent = cat.ativo ? 'Ativo' : 'Inativo';
    tdStatus.appendChild(status);

    const tdAcoes = document.createElement('td');
    tdAcoes.className = 'acoes';
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn-editar';
    btnEditar.title = 'Editar';
    btnEditar.textContent = '✏️';
    btnEditar.addEventListener('click', () => editarCategoria(cat.id));

    const btnDeletar = document.createElement('button');
    btnDeletar.className = 'btn-deletar';
    btnDeletar.title = 'Deletar';
    btnDeletar.textContent = '🗑️';
    btnDeletar.addEventListener('click', () => deletarCategoria(cat.id, cat.nome));

    tdAcoes.appendChild(btnEditar);
    tdAcoes.appendChild(btnDeletar);

    tr.appendChild(tdOrdem);
    tr.appendChild(tdNome);
    tr.appendChild(tdSlug);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAcoes);

    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}

function abrirModalCategoria(id = null) {
  categoriaEditandoId = id;

  const modal = document.getElementById('modalCategoria');
  const titulo = document.getElementById('modalCategoriaTitulo');

  if (id) {
    titulo.textContent = 'Editar Categoria';
    carregarCategoriaParaEdicao(id);
  } else {
    titulo.textContent = 'Nova Categoria';
    document.getElementById('formCategoria').reset();
    document.getElementById('categoriaId').value = '';
  }

  modal.style.display = 'flex';
}

function fecharModalCategoria() {
  document.getElementById('modalCategoria').style.display = 'none';
  categoriaEditandoId = null;
}

async function carregarCategoriaParaEdicao(id) {
  const categoria = await CategoriasService.buscarPorId(id);

  if (!categoria) {
    alert('Categoria não encontrada');
    fecharModalCategoria();
    return;
  }

  document.getElementById('categoriaId').value = categoria.id;
  document.getElementById('categoriaNome').value = categoria.nome;
  document.getElementById('categoriaOrdem').value = categoria.ordem;
  document.getElementById('categoriaAtivo').checked = categoria.ativo;
}

async function salvarCategoria(e) {
  e.preventDefault();

  const categoria = {
    nome: DomUtils.sanitizeText(document.getElementById('categoriaNome').value.trim(), 120),
    ordem: parseInt(document.getElementById('categoriaOrdem').value) || 0,
    ativo: document.getElementById('categoriaAtivo').checked
  };

  const validacao = CategoriasService.validar(categoria);

  if (!validacao.valido) {
    alert(validacao.erros.join('\n'));
    return;
  }

  const categoriaId = document.getElementById('categoriaId').value;
  let result;

  if (categoriaId) {
    result = await CategoriasService.atualizar(categoriaId, categoria);
  } else {
    result = await CategoriasService.criar(categoria);
  }

  if (result.success) {
    alert('✅ Categoria salva com sucesso!');
    fecharModalCategoria();
    carregarCategorias();
  } else {
    alert('❌ Erro ao salvar categoria: ' + result.error);
  }
}

async function editarCategoria(id) {
  abrirModalCategoria(id);
}

async function deletarCategoria(id, nome) {
  if (!confirm(`Deletar a categoria "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }

  const result = await CategoriasService.deletar(id);

  if (result.success) {
    alert('✅ Categoria deletada com sucesso!');
    carregarCategorias();
  } else {
    alert('❌ ' + result.error);
  }
}

// ===================================
// MARCAS
// ===================================
async function carregarMarcas() {
  const marcas = await MarcasService.listar();
  const tbody = document.getElementById('marcasTableBody');
  if (!tbody) return;

  DomUtils.clear(tbody);

  if (marcas.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.style.textAlign = 'center';
    td.style.padding = '40px';
    td.textContent = 'Nenhuma marca cadastrada.';

    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = 'Criar Primeira Marca';
    btn.addEventListener('click', () => abrirModalMarca());

    const wrap = document.createElement('div');
    wrap.style.marginTop = '12px';
    wrap.appendChild(btn);

    td.appendChild(document.createElement('br'));
    td.appendChild(wrap);
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  const marcasComContagem = await Promise.all(
    marcas.map(async (marca) => ({
      ...marca,
      totalProdutos: await MarcasService.contarProdutos(marca.id)
    }))
  );

  const frag = document.createDocumentFragment();

  marcasComContagem.forEach(marca => {
    const tr = document.createElement('tr');

    const tdNome = document.createElement('td');
    const strong = document.createElement('strong');
    strong.textContent = marca.nome || '';
    tdNome.appendChild(strong);

    const tdSlug = document.createElement('td');
    const code = document.createElement('code');
    code.textContent = marca.slug || '';
    tdSlug.appendChild(code);

    const tdTotal = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = String(marca.totalProdutos ?? 0);
    tdTotal.appendChild(badge);

    const tdStatus = document.createElement('td');
    const status = document.createElement('span');
    status.className = `status-badge ${marca.ativo ? 'ativo' : 'inativo'}`;
    status.textContent = marca.ativo ? 'Ativo' : 'Inativo';
    tdStatus.appendChild(status);

    const tdAcoes = document.createElement('td');
    tdAcoes.className = 'acoes';
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn-editar';
    btnEditar.title = 'Editar';
    btnEditar.textContent = '✏️';
    btnEditar.addEventListener('click', () => editarMarca(marca.id));

    const btnDeletar = document.createElement('button');
    btnDeletar.className = 'btn-deletar';
    btnDeletar.title = 'Deletar';
    btnDeletar.textContent = '🗑️';
    btnDeletar.addEventListener('click', () => deletarMarca(marca.id, marca.nome));

    tdAcoes.appendChild(btnEditar);
    tdAcoes.appendChild(btnDeletar);

    tr.appendChild(tdNome);
    tr.appendChild(tdSlug);
    tr.appendChild(tdTotal);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAcoes);

    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}

function abrirModalMarca(id = null) {
  marcaEditandoId = id;

  const modal = document.getElementById('modalMarca');
  const titulo = document.getElementById('modalMarcaTitulo');

  if (id) {
    titulo.textContent = 'Editar Marca';
    carregarMarcaParaEdicao(id);
  } else {
    titulo.textContent = 'Nova Marca';
    document.getElementById('formMarca').reset();
    document.getElementById('marcaId').value = '';
    document.getElementById('marcaLogoUrl').value = '';
    const preview = document.getElementById('marcaLogoPreview');
    DomUtils.clear(preview);
    preview.style.display = 'none';
  }

  modal.style.display = 'flex';
}

function fecharModalMarca() {
  document.getElementById('modalMarca').style.display = 'none';
  marcaEditandoId = null;
}

async function carregarMarcaParaEdicao(id) {
  const marca = await MarcasService.buscarPorId(id);

  if (!marca) {
    alert('Marca não encontrada');
    fecharModalMarca();
    return;
  }

  document.getElementById('marcaId').value = marca.id;
  document.getElementById('marcaNome').value = marca.nome;
  document.getElementById('marcaDescricao').value = marca.descricao || '';
  document.getElementById('marcaLogoUrl').value = marca.logoUrl || '';
  document.getElementById('marcaAtivo').checked = marca.ativo;

  if (marca.logoUrl) {
    const preview = document.getElementById('marcaLogoPreview');
    DomUtils.clear(preview);
    const img = document.createElement('img');
    img.src = DomUtils.sanitizeUrl(marca.logoUrl);
    img.alt = 'Logo da Marca';
    preview.appendChild(img);
    preview.style.display = 'block';
  }
}

async function uploadLogoMarca(e) {
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

  const preview = document.getElementById('marcaLogoPreview');
  DomUtils.clear(preview);
  const p = document.createElement('p');
  p.textContent = '📤 Enviando...';
  preview.appendChild(p);
  preview.style.display = 'block';

  isUploadingLogo = true;

  try {
    const imageUrl = await ProdutosService.uploadImagem(file);
    document.getElementById('marcaLogoUrl').value = imageUrl;
    DomUtils.clear(preview);
    const img = document.createElement('img');
    img.src = DomUtils.sanitizeUrl(imageUrl);
    img.alt = 'Logo da Marca';
    preview.appendChild(img);
  } catch (err) {
    console.error('❌ Erro no upload:', err);
    alert('Erro ao enviar logo');
    DomUtils.clear(preview);
  } finally {
    isUploadingLogo = false;
  }
}

async function salvarMarca(e) {
  e.preventDefault();

  if (isUploadingLogo) {
    alert('Aguarde o upload da logo finalizar');
    return;
  }

  const marca = {
    nome: DomUtils.sanitizeText(document.getElementById('marcaNome').value.trim(), 120),
    descricao: DomUtils.sanitizeText(document.getElementById('marcaDescricao').value.trim(), 200),
    logoUrl: DomUtils.sanitizeUrl(document.getElementById('marcaLogoUrl').value.trim()),
    ativo: document.getElementById('marcaAtivo').checked
  };

  const validacao = MarcasService.validar(marca);

  if (!validacao.valido) {
    alert(validacao.erros.join('\n'));
    return;
  }

  const marcaId = document.getElementById('marcaId').value;
  let result;

  if (marcaId) {
    result = await MarcasService.atualizar(marcaId, marca);
  } else {
    result = await MarcasService.criar(marca);
  }

  if (result.success) {
    alert('✅ Marca salva com sucesso!');
    fecharModalMarca();
    carregarMarcas();
  } else {
    alert('❌ Erro ao salvar marca: ' + result.error);
  }
}

async function editarMarca(id) {
  abrirModalMarca(id);
}

async function deletarMarca(id, nome) {
  if (!confirm(`Deletar a marca "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }

  const result = await MarcasService.deletar(id);

  if (result.success) {
    alert('✅ Marca deletada com sucesso!');
    carregarMarcas();
  } else {
    alert('❌ ' + result.error);
  }
}

// Tornar funções globais
window.abrirModalTipo = abrirModalTipo;
window.fecharModalTipo = fecharModalTipo;
window.editarTipo = editarTipo;
window.deletarTipo = deletarTipo;
window.adicionarOpcaoTamanho = adicionarOpcaoTamanho;
window.removerOpcaoTamanho = removerOpcaoTamanho;

window.abrirModalCategoria = abrirModalCategoria;
window.fecharModalCategoria = fecharModalCategoria;
window.editarCategoria = editarCategoria;
window.deletarCategoria = deletarCategoria;

window.abrirModalMarca = abrirModalMarca;
window.fecharModalMarca = fecharModalMarca;
window.editarMarca = editarMarca;
window.deletarMarca = deletarMarca;
