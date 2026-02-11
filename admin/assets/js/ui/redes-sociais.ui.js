/**
 * UI de Redes Sociais
 */
let redeEditandoId = null;

const RedesSociaisUI = {
  init() {
    carregarRedes();
    setupEventListeners();
  }
};

window.RedesSociaisUI = RedesSociaisUI;

function setupEventListeners() {
  document.getElementById('btnNovaRede')?.addEventListener('click', () => abrirModalRede());
  document.getElementById('formRede')?.addEventListener('submit', salvarRede);
}

async function carregarRedes() {
  const redes = await RedesSociaisService.listar();
  const tbody = document.getElementById('redesTableBody');
  if (!tbody) return;

  DomUtils.clear(tbody);

  if (redes.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.style.textAlign = 'center';
    td.style.padding = '40px';
    td.textContent = 'Nenhuma rede social cadastrada.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    atualizarPreview([]);
    return;
  }

  const frag = document.createDocumentFragment();

  redes.forEach(rede => {
    const tr = document.createElement('tr');

    const tdNome = document.createElement('td');
    tdNome.textContent = rede.nome || '';

    const tdUrl = document.createElement('td');
    const a = document.createElement('a');
    a.href = DomUtils.sanitizeUrl(rede.url);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.fontSize = '12px';
    a.style.wordBreak = 'break-all';
    a.textContent = rede.url || '';
    tdUrl.appendChild(a);

    const tdIcone = document.createElement('td');
    tdIcone.textContent = rede.icone || '🔗';

    const tdStatus = document.createElement('td');
    const status = document.createElement('span');
    status.className = `status-badge ${rede.ativo ? 'ativo' : 'inativo'}`;
    status.textContent = rede.ativo ? 'Ativo' : 'Inativo';
    tdStatus.appendChild(status);

    const tdAcoes = document.createElement('td');
    tdAcoes.className = 'acoes';
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn-editar';
    btnEditar.title = 'Editar';
    btnEditar.textContent = '✏️';
    btnEditar.addEventListener('click', () => editarRede(rede.id));

    const btnDeletar = document.createElement('button');
    btnDeletar.className = 'btn-deletar';
    btnDeletar.title = 'Deletar';
    btnDeletar.textContent = '🗑️';
    btnDeletar.addEventListener('click', () => deletarRede(rede.id, rede.nome));

    tdAcoes.appendChild(btnEditar);
    tdAcoes.appendChild(btnDeletar);

    tr.appendChild(tdNome);
    tr.appendChild(tdUrl);
    tr.appendChild(tdIcone);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAcoes);

    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
  atualizarPreview(redes);
}

function atualizarPreview(redes) {
  const previewContainer = document.getElementById('previewRedesItems');
  if (!previewContainer) return;

  DomUtils.clear(previewContainer);

  if (redes.length === 0) {
    const p = document.createElement('p');
    p.className = 'text-secondary';
    p.textContent = 'Nenhuma rede social ativa';
    previewContainer.appendChild(p);
    return;
  }

  const redesAtivas = redes.filter(r => r.ativo);

  if (redesAtivas.length === 0) {
    const p = document.createElement('p');
    p.className = 'text-secondary';
    p.textContent = 'Nenhuma rede social ativa';
    previewContainer.appendChild(p);
    return;
  }

  redesAtivas.forEach(rede => {
    const item = document.createElement('div');
    item.className = 'preview-rede-item';
    const icone = document.createElement('span');
    icone.className = 'preview-icone';
    icone.textContent = rede.icone || '🔗';
    const nome = document.createElement('span');
    nome.className = 'preview-texto';
    nome.textContent = rede.nome || '';
    item.appendChild(icone);
    item.appendChild(nome);
    previewContainer.appendChild(item);
  });
}

function abrirModalRede(id = null) {
  redeEditandoId = id;
  const modal = document.getElementById('modalRede');
  const titulo = document.getElementById('modalRedeTitulo');

  if (id) {
    titulo.textContent = 'Editar Rede Social';
    carregarRedeParaEdicao(id);
  } else {
    titulo.textContent = 'Nova Rede Social';
    document.getElementById('formRede').reset();
    document.getElementById('redeId').value = '';
  }

  modal.style.display = 'flex';
}

function fecharModalRede() {
  document.getElementById('modalRede').style.display = 'none';
  redeEditandoId = null;
}

async function carregarRedeParaEdicao(id) {
  const rede = await RedesSociaisService.buscarPorId(id);

  if (!rede) {
    alert('Rede social não encontrada');
    fecharModalRede();
    return;
  }

  document.getElementById('redeId').value = rede.id;
  document.getElementById('redeNome').value = rede.nome;
  document.getElementById('redeUrl').value = rede.url;
  document.getElementById('redeIcone').value = rede.icone || '';
  document.getElementById('redeAtivo').checked = rede.ativo;
}

async function salvarRede(e) {
  e.preventDefault();

  const rede = {
    nome: DomUtils.sanitizeText(document.getElementById('redeNome').value.trim(), 120),
    url: DomUtils.sanitizeUrl(document.getElementById('redeUrl').value.trim()),
    icone: DomUtils.sanitizeText(document.getElementById('redeIcone').value.trim(), 10),
    ativo: document.getElementById('redeAtivo').checked
  };

  const validacao = RedesSociaisService.validar(rede);

  if (!validacao.valido) {
    alert(validacao.erros.join('\n'));
    return;
  }

  const redeId = document.getElementById('redeId').value;
  let result;

  if (redeId) {
    result = await RedesSociaisService.atualizar(redeId, rede);
  } else {
    result = await RedesSociaisService.criar(rede);
  }

  if (result.success) {
    alert('✅ Rede social salva com sucesso!');
    fecharModalRede();
    carregarRedes();
  } else {
    alert('❌ Erro ao salvar rede social: ' + result.error);
  }
}

async function editarRede(id) {
  abrirModalRede(id);
}

async function deletarRede(id, nome) {
  if (!confirm(`Deletar a rede social "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }

  const result = await RedesSociaisService.deletar(id);

  if (result.success) {
    alert('✅ Rede social deletada com sucesso!');
    carregarRedes();
  } else {
    alert('❌ ' + result.error);
  }
}

// Tornar funções globais
window.abrirModalRede = abrirModalRede;
window.fecharModalRede = fecharModalRede;
window.editarRede = editarRede;
window.deletarRede = deletarRede;
