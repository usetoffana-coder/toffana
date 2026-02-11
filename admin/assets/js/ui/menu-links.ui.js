/**
 * UI de Menu & Links
 * Gerencia links personalizados do menu
 */

// ===================================
// VARIÁVEIS GLOBAIS
// ===================================
let linkEditandoId = null;

// ===================================
// INICIALIZAÇÃO
// ===================================
const MenuLinksUI = {
  init() {
    carregarLinks();
    setupEventListeners();
  }
};

window.MenuLinksUI = MenuLinksUI;

function setupEventListeners() {
  document.getElementById('btnNovoLink')?.addEventListener('click', () => abrirModalLink());
  document.getElementById('formLink')?.addEventListener('submit', salvarLink);
}

// ===================================
// CARREGAR LINKS
// ===================================
async function carregarLinks() {
  const links = await MenuLinksService.listar();
  const tbody = document.getElementById('linksTableBody');
  if (!tbody) return;

  DomUtils.clear(tbody);

  if (links.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.style.textAlign = 'center';
    td.style.padding = '40px';
    td.textContent = 'Nenhum link cadastrado.';

    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = 'Criar Primeiro Link';
    btn.addEventListener('click', () => abrirModalLink());

    const wrap = document.createElement('div');
    wrap.style.marginTop = '12px';
    wrap.appendChild(btn);

    td.appendChild(document.createElement('br'));
    td.appendChild(wrap);
    tr.appendChild(td);
    tbody.appendChild(tr);

    atualizarPreview([]);
    return;
  }

  const frag = document.createDocumentFragment();

  links.forEach(link => {
    const tr = document.createElement('tr');

    const tdOrdem = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = String(link.ordem ?? 0);
    tdOrdem.appendChild(badge);

    const tdIcone = document.createElement('td');
    tdIcone.style.textAlign = 'center';
    tdIcone.style.fontSize = '24px';
    tdIcone.textContent = link.icone || '🔗';

    const tdTexto = document.createElement('td');
    const strong = document.createElement('strong');
    strong.textContent = link.texto || '';
    tdTexto.appendChild(strong);

    const tdUrl = document.createElement('td');
    const a = document.createElement('a');
    a.href = DomUtils.sanitizeUrl(link.url);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.fontSize = '12px';
    a.style.wordBreak = 'break-all';
    a.textContent = link.url || '';
    tdUrl.appendChild(a);

    const tdTags = document.createElement('td');
    if (link.abrirNovaAba) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = 'Nova Aba';
      tdTags.appendChild(tag);
    }
    if (link.destacado) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.style.background = 'var(--warning)';
      tag.textContent = 'Destacado';
      tdTags.appendChild(tag);
    }

    const tdStatus = document.createElement('td');
    const status = document.createElement('span');
    status.className = `status-badge ${link.ativo ? 'ativo' : 'inativo'}`;
    status.textContent = link.ativo ? 'Ativo' : 'Inativo';
    tdStatus.appendChild(status);

    const tdAcoes = document.createElement('td');
    tdAcoes.className = 'acoes';
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn-editar';
    btnEditar.title = 'Editar';
    btnEditar.textContent = '✏️';
    btnEditar.addEventListener('click', () => editarLink(link.id));

    const btnDeletar = document.createElement('button');
    btnDeletar.className = 'btn-deletar';
    btnDeletar.title = 'Deletar';
    btnDeletar.textContent = '🗑️';
    btnDeletar.addEventListener('click', () => deletarLink(link.id, link.texto));

    tdAcoes.appendChild(btnEditar);
    tdAcoes.appendChild(btnDeletar);

    tr.appendChild(tdOrdem);
    tr.appendChild(tdIcone);
    tr.appendChild(tdTexto);
    tr.appendChild(tdUrl);
    tr.appendChild(tdTags);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAcoes);

    frag.appendChild(tr);
  });

  tbody.appendChild(frag);

  atualizarPreview(links);
}

// ===================================
// PREVIEW DO MENU
// ===================================
function atualizarPreview(links) {
  const previewContainer = document.getElementById('previewMenuItems');
  if (!previewContainer) return;

  DomUtils.clear(previewContainer);

  if (links.length === 0) {
    const p = document.createElement('p');
    p.className = 'text-secondary';
    p.textContent = 'Nenhum link ativo';
    previewContainer.appendChild(p);
    return;
  }

  const linksAtivos = links.filter(l => l.ativo);

  if (linksAtivos.length === 0) {
    const p = document.createElement('p');
    p.className = 'text-secondary';
    p.textContent = 'Nenhum link ativo';
    previewContainer.appendChild(p);
    return;
  }

  linksAtivos.forEach(link => {
    const item = document.createElement('div');
    item.className = `preview-menu-item ${link.destacado ? 'destacado' : ''}`;

    const icone = document.createElement('span');
    icone.className = 'preview-icone';
    icone.textContent = link.icone || '🔗';

    const texto = document.createElement('span');
    texto.className = 'preview-texto';
    texto.textContent = link.texto || '';

    item.appendChild(icone);
    item.appendChild(texto);

    if (link.abrirNovaAba) {
      const badge = document.createElement('span');
      badge.className = 'preview-badge';
      badge.textContent = '↗';
      item.appendChild(badge);
    }

    previewContainer.appendChild(item);
  });
}

// ===================================
// MODAL
// ===================================
function abrirModalLink(id = null) {
  linkEditandoId = id;

  const modal = document.getElementById('modalLink');
  const titulo = document.getElementById('modalLinkTitulo');

  if (id) {
    titulo.textContent = 'Editar Link';
    carregarLinkParaEdicao(id);
  } else {
    titulo.textContent = 'Novo Link';
    document.getElementById('formLink').reset();
    document.getElementById('linkId').value = '';
  }

  modal.style.display = 'flex';
}

function fecharModalLink() {
  document.getElementById('modalLink').style.display = 'none';
  linkEditandoId = null;
}

async function carregarLinkParaEdicao(id) {
  const link = await MenuLinksService.buscarPorId(id);

  if (!link) {
    alert('Link não encontrado');
    fecharModalLink();
    return;
  }

  document.getElementById('linkId').value = link.id;
  document.getElementById('linkTexto').value = link.texto;
  document.getElementById('linkUrl').value = link.url;
  document.getElementById('linkIcone').value = link.icone || '';
  document.getElementById('linkOrdem').value = link.ordem;
  document.getElementById('linkNovaAba').checked = link.abrirNovaAba;
  document.getElementById('linkDestacado').checked = link.destacado;
  document.getElementById('linkAtivo').checked = link.ativo;
}

async function salvarLink(e) {
  e.preventDefault();

  const link = {
    texto: DomUtils.sanitizeText(document.getElementById('linkTexto').value.trim(), 120),
    url: DomUtils.sanitizeUrl(document.getElementById('linkUrl').value.trim()),
    icone: DomUtils.sanitizeText(document.getElementById('linkIcone').value.trim(), 10),
    ordem: parseInt(document.getElementById('linkOrdem').value) || 0,
    abrirNovaAba: document.getElementById('linkNovaAba').checked,
    destacado: document.getElementById('linkDestacado').checked,
    ativo: document.getElementById('linkAtivo').checked
  };

  const validacao = MenuLinksService.validar(link);

  if (!validacao.valido) {
    alert(validacao.erros.join('\n'));
    return;
  }

  const linkId = document.getElementById('linkId').value;
  let result;

  if (linkId) {
    result = await MenuLinksService.atualizar(linkId, link);
  } else {
    result = await MenuLinksService.criar(link);
  }

  if (result.success) {
    alert('✅ Link salvo com sucesso!');
    fecharModalLink();
    carregarLinks();
  } else {
    alert('❌ Erro ao salvar link: ' + result.error);
  }
}

async function editarLink(id) {
  abrirModalLink(id);
}

async function deletarLink(id, texto) {
  if (!confirm(`Deletar o link "${texto}"?\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }

  const result = await MenuLinksService.deletar(id);

  if (result.success) {
    alert('✅ Link deletado com sucesso!');
    carregarLinks();
  } else {
    alert('❌ ' + result.error);
  }
}

// Tornar funções globais
window.abrirModalLink = abrirModalLink;
window.fecharModalLink = fecharModalLink;
window.editarLink = editarLink;
window.deletarLink = deletarLink;
