/**
 * UI de Páginas Customizadas
 */

let paginaEditandoId = null;
let slugAutoAtivo = true;
let paginaBlocos = [];

const PaginasUI = {
  init() {
    carregarPaginas();
    setupPaginasEventListeners();
  }
};

window.PaginasUI = PaginasUI;

function setupPaginasEventListeners() {
  document.getElementById('btnNovaPagina')?.addEventListener('click', () => abrirModalPagina());
  document.getElementById('formPagina')?.addEventListener('submit', salvarPagina);

  const tituloInput = document.getElementById('paginaTitulo');
  const slugInput = document.getElementById('paginaSlug');
  if (tituloInput && slugInput) {
    tituloInput.addEventListener('input', () => {
      if (!slugAutoAtivo) return;
      slugInput.value = gerarSlug(tituloInput.value);
    });
    slugInput.addEventListener('input', () => {
      slugAutoAtivo = slugInput.value.trim() === '' || slugInput.value === gerarSlug(tituloInput.value);
    });
  }

  document.getElementById('paginaModo')?.addEventListener('change', (e) => {
    alternarModoConteudo(e.target.value);
  });

  document.querySelectorAll('[data-block-add]')?.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-block-add');
      adicionarBloco(type);
    });
  });

  const htmlTextarea = document.getElementById('paginaConteudoHtml');
  if (htmlTextarea) {
    htmlTextarea.addEventListener('input', () => atualizarHtmlEditor());
    htmlTextarea.addEventListener('scroll', () => sincronizarScrollHtml());
  }
}

async function carregarPaginas() {
  const paginas = await PaginasService.listar();
  const tbody = document.getElementById('paginasTableBody');
  if (!tbody) return;

  DomUtils.clear(tbody);

  if (paginas.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.style.textAlign = 'center';
    td.style.padding = '40px';
    td.textContent = 'Nenhuma página cadastrada.';

    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = 'Criar Primeira Página';
    btn.addEventListener('click', () => abrirModalPagina());

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

  paginas.forEach(pagina => {
    const tr = document.createElement('tr');

    const tdTitulo = document.createElement('td');
    tdTitulo.textContent = pagina.titulo || '';

    const tdSlug = document.createElement('td');
    tdSlug.textContent = pagina.slug || '';

    const tdModo = document.createElement('td');
    tdModo.textContent = pagina.modoConteudo === 'html' ? 'HTML' : 'Texto';

    const tdStatus = document.createElement('td');
    const status = document.createElement('span');
    status.className = `status-badge ${pagina.ativo ? 'ativo' : 'inativo'}`;
    status.textContent = pagina.ativo ? 'Ativo' : 'Inativo';
    tdStatus.appendChild(status);

    const tdLink = document.createElement('td');
    const a = document.createElement('a');
    a.href = `/pagina.html?slug=${encodeURIComponent(pagina.slug || '')}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'Abrir';
    tdLink.appendChild(a);

    const tdAcoes = document.createElement('td');
    tdAcoes.className = 'acoes';

    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn-editar';
    btnEditar.title = 'Editar';
    btnEditar.textContent = '✏️';
    btnEditar.addEventListener('click', () => editarPagina(pagina.id));

    const btnDeletar = document.createElement('button');
    btnDeletar.className = 'btn-deletar';
    btnDeletar.title = 'Deletar';
    btnDeletar.textContent = '🗑️';
    btnDeletar.addEventListener('click', () => deletarPagina(pagina.id, pagina.titulo));

    tdAcoes.appendChild(btnEditar);
    tdAcoes.appendChild(btnDeletar);

    tr.appendChild(tdTitulo);
    tr.appendChild(tdSlug);
    tr.appendChild(tdModo);
    tr.appendChild(tdStatus);
    tr.appendChild(tdLink);
    tr.appendChild(tdAcoes);
    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}

function abrirModalPagina(id = null) {
  paginaEditandoId = id;
  slugAutoAtivo = true;

  const modal = document.getElementById('modalPagina');
  const titulo = document.getElementById('modalPaginaTitulo');
  if (!modal || !titulo) return;

  if (id) {
    titulo.textContent = 'Editar Página';
    carregarPaginaParaEdicao(id);
  } else {
    titulo.textContent = 'Nova Página';
    document.getElementById('formPagina').reset();
    document.getElementById('paginaId').value = '';
    paginaBlocos = [];
    alternarModoConteudo('texto');
  }

  modal.style.display = 'flex';
}

function fecharModalPagina() {
  document.getElementById('modalPagina').style.display = 'none';
  paginaEditandoId = null;
}

async function carregarPaginaParaEdicao(id) {
  const pagina = await PaginasService.buscarPorId(id);
  if (!pagina) {
    alert('Página não encontrada');
    fecharModalPagina();
    return;
  }

  document.getElementById('paginaId').value = pagina.id;
  document.getElementById('paginaTitulo').value = pagina.titulo || '';
  document.getElementById('paginaSlug').value = pagina.slug || '';
  document.getElementById('paginaModo').value = pagina.modoConteudo || 'texto';
  document.getElementById('paginaConteudoTexto').value = pagina.conteudoTexto || '';
  document.getElementById('paginaConteudoHtml').value = pagina.conteudoHtml || '';
  paginaBlocos = Array.isArray(pagina.conteudoBlocos) ? pagina.conteudoBlocos : [];
  document.getElementById('paginaAtiva').checked = pagina.ativo !== false;

  slugAutoAtivo = false;
  alternarModoConteudo(pagina.modoConteudo || 'texto');
  atualizarHtmlEditor();
  renderizarBlocos();
}

async function salvarPagina(e) {
  e.preventDefault();

  const modo = document.getElementById('paginaModo').value;
  const pagina = {
    titulo: DomUtils.sanitizeText(document.getElementById('paginaTitulo').value.trim(), 120),
    slug: gerarSlug(document.getElementById('paginaSlug').value.trim()),
    modoConteudo: modo === 'html' ? 'html' : modo === 'blocos' ? 'blocos' : 'texto',
    conteudoTexto: document.getElementById('paginaConteudoTexto').value.trim(),
    conteudoHtml: document.getElementById('paginaConteudoHtml').value.trim(),
    conteudoBlocos: modo === 'blocos' ? paginaBlocos : [],
    ativo: document.getElementById('paginaAtiva').checked
  };

  const validacao = PaginasService.validar(pagina);
  if (!validacao.valido) {
    alert(validacao.erros.join('\n'));
    return;
  }

  const paginaId = document.getElementById('paginaId').value;
  let result;

  if (paginaId) {
    result = await PaginasService.atualizar(paginaId, pagina);
  } else {
    result = await PaginasService.criar(pagina);
  }

  if (result.success) {
    alert('✅ Página salva com sucesso!');
    fecharModalPagina();
    carregarPaginas();
  } else {
    alert('❌ Erro ao salvar página: ' + result.error);
  }
}

async function editarPagina(id) {
  abrirModalPagina(id);
}

async function deletarPagina(id, titulo) {
  if (!confirm(`Deletar a página "${titulo}"?\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }

  const result = await PaginasService.deletar(id);

  if (result.success) {
    alert('✅ Página deletada com sucesso!');
    carregarPaginas();
  } else {
    alert('❌ ' + result.error);
  }
}

function alternarModoConteudo(modo) {
  const textoWrap = document.getElementById('paginaConteudoTextoWrap');
  const htmlWrap = document.getElementById('paginaConteudoHtmlWrap');
  const blocosWrap = document.getElementById('paginaConteudoBlocosWrap');
  if (!textoWrap || !htmlWrap) return;

  if (modo === 'html') {
    textoWrap.style.display = 'none';
    htmlWrap.style.display = 'block';
    if (blocosWrap) blocosWrap.style.display = 'none';
  } else if (modo === 'blocos') {
    textoWrap.style.display = 'none';
    htmlWrap.style.display = 'none';
    if (blocosWrap) blocosWrap.style.display = 'block';
  } else {
    textoWrap.style.display = 'block';
    htmlWrap.style.display = 'none';
    if (blocosWrap) blocosWrap.style.display = 'none';
  }

  atualizarHtmlEditor();
  renderizarBlocos();
}

function gerarSlug(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

function atualizarHtmlEditor() {
  const textarea = document.getElementById('paginaConteudoHtml');
  const highlight = document.getElementById('paginaHtmlHighlight');
  const preview = document.getElementById('paginaHtmlPreview');
  const modo = document.getElementById('paginaModo')?.value || 'texto';

  if (!textarea || !highlight || !preview) return;

  if (modo !== 'html') {
    preview.innerHTML = '<p class="text-secondary">Pré-visualização disponível no modo HTML.</p>';
    highlight.innerHTML = '';
    return;
  }

  const value = textarea.value || '';
  highlight.innerHTML = highlightHtml(value);
  preview.innerHTML = sanitizeHtml(value);
  sincronizarScrollHtml();
}

function renderizarBlocos() {
  const modo = document.getElementById('paginaModo')?.value || 'texto';
  const editor = document.getElementById('paginaBlocksEditor');
  const preview = document.getElementById('paginaHtmlPreview');
  if (!editor || !preview) return;

  if (modo !== 'blocos') return;

  DomUtils.clear(editor);

  if (!Array.isArray(paginaBlocos) || paginaBlocos.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-secondary';
    empty.textContent = 'Nenhum bloco adicionado.';
    editor.appendChild(empty);
  } else {
    paginaBlocos.forEach((block, index) => {
      editor.appendChild(criarBlocoUI(block, index));
    });
  }

  preview.innerHTML = renderBlocosPreview(paginaBlocos);
}

function criarBlocoUI(block, index) {
  const wrapper = document.createElement('div');
  wrapper.className = 'block-item';
  wrapper.draggable = true;
  wrapper.dataset.index = String(index);

  wrapper.addEventListener('dragstart', (e) => {
    wrapper.classList.add('dragging');
    e.dataTransfer.setData('text/plain', String(index));
  });

  wrapper.addEventListener('dragend', () => {
    wrapper.classList.remove('dragging');
  });

  wrapper.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  wrapper.addEventListener('drop', (e) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData('text/plain'));
    const to = Number(wrapper.dataset.index);
    if (Number.isNaN(from) || Number.isNaN(to) || from === to) return;
    moverBloco(from, to);
  });

  const header = document.createElement('div');
  header.className = 'block-header';
  const handle = document.createElement('span');
  handle.className = 'block-handle';
  handle.textContent = '⠿';
  const title = document.createElement('span');
  title.className = 'block-type';
  title.textContent = getBlockLabel(block.tipo);
  const actions = document.createElement('div');
  actions.className = 'block-actions';

  const upBtn = document.createElement('button');
  upBtn.type = 'button';
  upBtn.textContent = '↑';
  upBtn.addEventListener('click', () => moverBloco(index, index - 1));
  const downBtn = document.createElement('button');
  downBtn.type = 'button';
  downBtn.textContent = '↓';
  downBtn.addEventListener('click', () => moverBloco(index, index + 1));
  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.textContent = '✖';
  delBtn.addEventListener('click', () => removerBloco(index));

  actions.appendChild(upBtn);
  actions.appendChild(downBtn);
  actions.appendChild(delBtn);

  header.appendChild(handle);
  header.appendChild(title);
  header.appendChild(actions);

  const fields = document.createElement('div');
  fields.className = 'block-fields';
  fields.appendChild(renderBlockFields(block, index));

  wrapper.appendChild(header);
  wrapper.appendChild(fields);
  return wrapper;
}

function renderBlockFields(block, index) {
  const frag = document.createDocumentFragment();
  const update = (key, value) => {
    paginaBlocos[index] = { ...paginaBlocos[index], [key]: value };
    renderizarBlocos();
  };

  if (block.tipo === 'heading') {
    const level = document.createElement('select');
    level.innerHTML = `
      <option value="2">H2</option>
      <option value="3">H3</option>
      <option value="4">H4</option>
    `;
    level.value = String(block.level || 2);
    level.addEventListener('change', (e) => update('level', Number(e.target.value)));
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Título';
    input.value = block.texto || '';
    input.addEventListener('input', (e) => update('texto', e.target.value));
    frag.appendChild(level);
    frag.appendChild(input);
  } else if (block.tipo === 'paragraph') {
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Texto do parágrafo';
    textarea.value = block.texto || '';
    textarea.addEventListener('input', (e) => update('texto', e.target.value));
    frag.appendChild(textarea);
  } else if (block.tipo === 'list') {
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Um item por linha';
    textarea.value = block.items || '';
    textarea.addEventListener('input', (e) => update('items', e.target.value));
    frag.appendChild(textarea);
  } else if (block.tipo === 'image') {
    const url = document.createElement('input');
    url.type = 'text';
    url.placeholder = 'URL da imagem';
    url.value = block.url || '';
    url.addEventListener('input', (e) => update('url', e.target.value));
    const alt = document.createElement('input');
    alt.type = 'text';
    alt.placeholder = 'Texto alternativo';
    alt.value = block.alt || '';
    alt.addEventListener('input', (e) => update('alt', e.target.value));
    frag.appendChild(url);
    frag.appendChild(alt);
  } else if (block.tipo === 'button') {
    const text = document.createElement('input');
    text.type = 'text';
    text.placeholder = 'Texto do botão';
    text.value = block.texto || '';
    text.addEventListener('input', (e) => update('texto', e.target.value));
    const url = document.createElement('input');
    url.type = 'text';
    url.placeholder = 'URL do botão';
    url.value = block.url || '';
    url.addEventListener('input', (e) => update('url', e.target.value));
    frag.appendChild(text);
    frag.appendChild(url);
  } else if (block.tipo === 'quote') {
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Citação';
    textarea.value = block.texto || '';
    textarea.addEventListener('input', (e) => update('texto', e.target.value));
    const autor = document.createElement('input');
    autor.type = 'text';
    autor.placeholder = 'Autor (opcional)';
    autor.value = block.autor || '';
    autor.addEventListener('input', (e) => update('autor', e.target.value));
    frag.appendChild(textarea);
    frag.appendChild(autor);
  } else if (block.tipo === 'divider') {
    const info = document.createElement('p');
    info.className = 'text-secondary';
    info.textContent = 'Divisor';
    frag.appendChild(info);
  }

  return frag;
}

function adicionarBloco(tipo) {
  const novo = criarBlocoPadrao(tipo);
  if (!novo) return;
  paginaBlocos.push(novo);
  renderizarBlocos();
}

function removerBloco(index) {
  paginaBlocos.splice(index, 1);
  renderizarBlocos();
}

function moverBloco(from, to) {
  if (to < 0 || to >= paginaBlocos.length) return;
  const [item] = paginaBlocos.splice(from, 1);
  paginaBlocos.splice(to, 0, item);
  renderizarBlocos();
}

function criarBlocoPadrao(tipo) {
  switch (tipo) {
    case 'heading':
      return { tipo: 'heading', level: 2, texto: 'Título' };
    case 'paragraph':
      return { tipo: 'paragraph', texto: '' };
    case 'list':
      return { tipo: 'list', items: '' };
    case 'image':
      return { tipo: 'image', url: '', alt: '' };
    case 'button':
      return { tipo: 'button', texto: 'Saiba mais', url: '' };
    case 'quote':
      return { tipo: 'quote', texto: '', autor: '' };
    case 'divider':
      return { tipo: 'divider' };
    default:
      return null;
  }
}

function getBlockLabel(tipo) {
  const map = {
    heading: 'Título',
    paragraph: 'Parágrafo',
    list: 'Lista',
    image: 'Imagem',
    button: 'Botão',
    quote: 'Citação',
    divider: 'Divisor'
  };
  return map[tipo] || 'Bloco';
}

function renderBlocosPreview(blocos) {
  if (!Array.isArray(blocos) || blocos.length === 0) {
    return '<p class="text-secondary">Adicione blocos para visualizar.</p>';
  }

  const escape = (v) => DomUtils.escapeHTML ? DomUtils.escapeHTML(v) : DomUtils.escapeHtml(v);

  return blocos.map(block => {
    switch (block.tipo) {
      case 'heading': {
        const level = [2, 3, 4].includes(block.level) ? block.level : 2;
        return `<h${level}>${escape(block.texto || '')}</h${level}>`;
      }
      case 'paragraph':
        return `<p>${escape(block.texto || '')}</p>`;
      case 'list': {
        const items = String(block.items || '').split('\n').filter(Boolean);
        if (items.length === 0) return '';
        return `<ul>${items.map(i => `<li>${escape(i)}</li>`).join('')}</ul>`;
      }
      case 'image': {
        const url = DomUtils.sanitizeUrl(block.url || '');
        const alt = escape(block.alt || '');
        if (!url) return '';
        return `<p><img src="${url}" alt="${alt}" style="max-width: 100%; border-radius: 8px;"></p>`;
      }
      case 'button': {
        const url = DomUtils.sanitizeUrl(block.url || '');
        const text = escape(block.texto || 'Saiba mais');
        if (!url) return `<p>${text}</p>`;
        return `<p><a href="${url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">${text}</a></p>`;
      }
      case 'quote': {
        const texto = escape(block.texto || '');
        const autor = escape(block.autor || '');
        return `<blockquote>${texto}${autor ? `<br><small>${autor}</small>` : ''}</blockquote>`;
      }
      case 'divider':
        return '<hr>';
      default:
        return '';
    }
  }).join('');
}

function sincronizarScrollHtml() {
  const textarea = document.getElementById('paginaConteudoHtml');
  const highlight = document.getElementById('paginaHtmlHighlight');
  if (!textarea || !highlight) return;
  highlight.scrollTop = textarea.scrollTop;
  highlight.scrollLeft = textarea.scrollLeft;
}

function highlightHtml(code) {
  const esc = (str) => String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  let output = esc(code);

  output = output.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="token comment">$1</span>');
  output = output.replace(/(&lt;\/?)([a-zA-Z0-9:-]+)([^&]*?)(\/?&gt;)/g, (match, open, tag, attrs, close) => {
    const safeAttrs = attrs.replace(/([a-zA-Z-:]+)(=)(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g,
      '<span class="token attr-name">$1</span><span class="token attr-eq">=</span><span class="token attr-value">$3</span>'
    );
    return `<span class="token tag">${open}${tag}</span>${safeAttrs}<span class="token tag">${close}</span>`;
  });

  return output;
}

function sanitizeHtml(html) {
  const allowedTags = new Set([
    'p','br','strong','b','em','i','u','s','a',
    'h1','h2','h3','h4','h5','h6',
    'ul','ol','li','blockquote','code','pre','span','div'
  ]);

  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html || ''), 'text/html');
  if (!doc || !doc.body) {
    if (window.DomUtils && DomUtils.escapeHTML) {
      return DomUtils.escapeHTML(String(html || ''));
    }
    return String(html || '');
  }

  const walk = (node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      if (!allowedTags.has(tag)) {
        const parent = node.parentNode;
        if (parent) {
          while (node.firstChild) parent.insertBefore(node.firstChild, node);
          parent.removeChild(node);
        }
        return;
      }

      const attrs = Array.from(node.attributes);
      attrs.forEach(attr => {
        const name = attr.name.toLowerCase();
        if (tag === 'a' && (name === 'href' || name === 'target' || name === 'rel')) {
          if (name === 'href') {
            const safe = DomUtils.sanitizeUrl(attr.value);
            if (safe) node.setAttribute('href', safe);
            else node.removeAttribute('href');
          }
          if (name === 'target') node.setAttribute('target', '_blank');
          if (name === 'rel') node.setAttribute('rel', 'noopener noreferrer');
        } else {
          node.removeAttribute(name);
        }
      });
    }

    Array.from(node.childNodes).forEach(child => walk(child));
  };

  walk(doc.body);
  return doc.body.innerHTML;
}

window.abrirModalPagina = abrirModalPagina;
window.fecharModalPagina = fecharModalPagina;
window.editarPagina = editarPagina;
window.deletarPagina = deletarPagina;
