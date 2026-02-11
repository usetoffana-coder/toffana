/**
 * UI de Comunicação
 */

const ComunicacaoUI = {
  init() {
    setupEventListeners();
    carregarConfiguracoes();
  }
};

window.ComunicacaoUI = ComunicacaoUI;

function setupEventListeners() {
  document.getElementById('configComunicacaoForm')
    ?.addEventListener('submit', salvarConfiguracoes);

  document.getElementById('mensagemPadrao')
    ?.addEventListener('input', atualizarPreviewProduto);

  document.getElementById('mensagemCarrinho')
    ?.addEventListener('input', atualizarPreviewCarrinho);

  document.getElementById('mensagemCarrinhoItem')
    ?.addEventListener('input', atualizarPreviewCarrinho);
}

async function carregarConfiguracoes() {
  const config = await ConfigService.buscar();

  setValue('whatsapp', config.whatsapp);
  setValue(
    'mensagemPadrao',
    config.mensagemPadrao ||
    'Olá! Gostaria de fazer um pedido:\n\n*Produto:* {produto}\n*Marca:* {marca}\n*Tamanho:* {tamanho}\n*Pagamento:* {pagamento}\n*Entrega:* {entrega}\n*Valor:* R$ {valor}'
  );

  setValue(
    'mensagemCarrinho',
    config.mensagemCarrinho ||
    'Olá! Gostaria de finalizar meu pedido:\n\n{produtos}\n\nResumo: {quantidade} item(ns) | Pagamento: {pagamento}\nEntrega: {entrega} | Frete: R$ {frete}\nTotal: R$ {total}'
  );
  setValue(
    'mensagemCarrinhoItem',
    config.mensagemCarrinhoItem ||
    '{numero}. *{produto}* - {marca}\n   Tamanho: {tamanho} | Pagamento: {pagamento}\n   Qtd: {quantidade} | Valor unit.: R$ {valor} | Subtotal: R$ {subtotal}'
  );

  setChecked('whatsappFlutuante', config.whatsappFlutuante !== false);
  setValue('whatsappMensagemFlutuante', config.whatsappMensagemFlutuante);
  setValue('whatsappMensagemInicial', config.whatsappMensagemInicial);

  setChecked('exibirHorario', config.exibirHorario === true);
  setChecked('permitirForaHorario', config.permitirForaHorario === true);
  setValue('horarioSegSexInicio', config.horarioSegSexInicio || '09:00');
  setValue('horarioSegSexFim', config.horarioSegSexFim || '18:00');
  setValue('horarioSabInicio', config.horarioSabInicio || '09:00');
  setValue('horarioSabFim', config.horarioSabFim || '13:00');
  setChecked('atendeDOM', config.atendeDOM === true);
  setValue('mensagemForaHorario', config.mensagemForaHorario);

  setValue('telefone', config.telefone);
  setValue('email', config.email);
  setValue('endereco', config.endereco);

  atualizarPreviewProduto();
  atualizarPreviewCarrinho();
}

function atualizarPreviewProduto() {
  const mensagem = document.getElementById('mensagemPadrao')?.value || '';
  const preview = document.getElementById('previewMensagemProduto');
  if (!preview) return;

  const texto = mensagem
    .replace(/{produto}/g, 'Produto Exemplo Premium')
    .replace(/{marca}/g, 'Marca Exemplo')
    .replace(/{tamanho}/g, 'Único')
    .replace(/{pagamento}/g, 'PIX')
    .replace(/{entrega}/g, 'Retirar na Loja')
    .replace(/{valor}/g, '299,90');

  DomUtils.clear(preview);
  const pre = document.createElement('pre');
  pre.textContent = texto;
  preview.appendChild(pre);
}

function atualizarPreviewCarrinho() {
  const mensagem = document.getElementById('mensagemCarrinho')?.value || '';
  const itemTemplate = document.getElementById('mensagemCarrinhoItem')?.value
    || '{numero}. *{produto}* - {marca}\n   Tamanho: {tamanho} | Pagamento: {pagamento}\n   Qtd: {quantidade} | Valor unit.: R$ {valor} | Subtotal: R$ {subtotal}';
  const preview = document.getElementById('previewMensagemCarrinho');
  if (!preview) return;

  const item1 = itemTemplate
    .replace(/{numero}/g, '1')
    .replace(/{produto}/g, 'Produto Exemplo Premium')
    .replace(/{marca}/g, 'Marca X')
    .replace(/{tamanho}/g, 'Único')
    .replace(/{pagamento}/g, 'PIX')
    .replace(/{quantidade}/g, '1')
    .replace(/{valor}/g, '299,90')
    .replace(/{subtotal}/g, '299,90');

  const item2 = itemTemplate
    .replace(/{numero}/g, '2')
    .replace(/{produto}/g, 'Camisa Adidas')
    .replace(/{marca}/g, 'Adidas')
    .replace(/{tamanho}/g, 'M')
    .replace(/{pagamento}/g, 'CARTAO')
    .replace(/{quantidade}/g, '2')
    .replace(/{valor}/g, '149,95')
    .replace(/{subtotal}/g, '299,90');

  const produtosExemplo = `${item1}\n\n${item2}`;

  const exemplo = mensagem
    .replace(/{produtos}/g, produtosExemplo)
    .replace(/{itens}/g, 'Produto Exemplo Premium x1\nCamisa Adidas x2')
    .replace(/{item}/g, produtosExemplo)
    .replace(/{quantidade}/g, '3')
    .replace(/{total}/g, '599,80')
    .replace(/{total_pix}/g, '299,90')
    .replace(/{total_cartao}/g, '299,90')
    .replace(/{pagamento}/g, 'Variado')
    .replace(/{entrega}/g, 'Entrega via Motoboy')
    .replace(/{frete}/g, '10,00')
    .replace(/{observacoes}/g, 'Entregar na portaria');

  DomUtils.clear(preview);
  const pre = document.createElement('pre');
  pre.textContent = exemplo;
  preview.appendChild(pre);
}

function inserirVariavel(campoId, variavel) {
  const campo = document.getElementById(campoId);
  if (!campo) return;

  const start = campo.selectionStart ?? campo.value.length;
  const end = campo.selectionEnd ?? campo.value.length;

  campo.value =
    campo.value.substring(0, start) +
    variavel +
    campo.value.substring(end);

  campo.focus();
  campo.setSelectionRange(start + variavel.length, start + variavel.length);

  if (campoId === 'mensagemPadrao') {
    atualizarPreviewProduto();
  } else {
    atualizarPreviewCarrinho();
  }
}

async function salvarConfiguracoes(e) {
  e.preventDefault();

  const whatsapp = document.getElementById('whatsapp')?.value.trim();
  if (!CryptoService.validatePhone(whatsapp)) {
    alert('Número de WhatsApp inválido');
    return;
  }

  const config = {
    whatsapp,
    mensagemPadrao: getValue('mensagemPadrao'),
    mensagemCarrinho: getValue('mensagemCarrinho'),
    mensagemCarrinhoItem: getValue('mensagemCarrinhoItem'),

    whatsappFlutuante: isChecked('whatsappFlutuante'),
    whatsappMensagemFlutuante: getValue('whatsappMensagemFlutuante'),
    whatsappMensagemInicial: getValue('whatsappMensagemInicial'),

    exibirHorario: isChecked('exibirHorario'),
    permitirForaHorario: isChecked('permitirForaHorario'),
    horarioSegSexInicio: getValue('horarioSegSexInicio'),
    horarioSegSexFim: getValue('horarioSegSexFim'),
    horarioSabInicio: getValue('horarioSabInicio'),
    horarioSabFim: getValue('horarioSabFim'),
    atendeDOM: isChecked('atendeDOM'),
    mensagemForaHorario: getValue('mensagemForaHorario'),

    telefone: getValue('telefone'),
    email: getValue('email'),
    endereco: getValue('endereco')
  };

  const result = await ConfigService.salvar(config);
  alert(result.success ? 'Salvo com sucesso!' : 'Erro ao salvar');
}

function setValue(id, value = '') {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function setChecked(id, value = false) {
  const el = document.getElementById(id);
  if (el) el.checked = value;
}

function getValue(id) {
  return document.getElementById(id)?.value.trim() || '';
}

function isChecked(id) {
  return document.getElementById(id)?.checked || false;
}

window.inserirVariavel = inserirVariavel;


