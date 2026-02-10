/**
 * Página: Configurações > Pagamento
 */
const ConfigPagamentoPage = {
  init() {
    this.bindEvents();
    this.carregarConfiguracoes();
  },

  bindEvents() {
    document.getElementById('configPagamentoForm')?.addEventListener('submit', (e) => this.salvarConfiguracoes(e));

    document.getElementById('valorSimulador')?.addEventListener('input', () => this.simularParcelas());
    document.getElementById('parcelasSemJuros')?.addEventListener('input', () => this.simularParcelas());
    document.getElementById('descontoPix')?.addEventListener('input', () => this.simularParcelas());
    document.getElementById('valorMinimoParcela')?.addEventListener('input', () => this.simularParcelas());
  },

  simularParcelas() {
    const valor = parseFloat(document.getElementById('valorSimulador').value) || 0;
    const parcelas = parseInt(document.getElementById('parcelasSemJuros').value) || 1;
    const descontoPix = parseFloat(document.getElementById('descontoPix').value) || 0;
    const valorMinParcela = parseFloat(document.getElementById('valorMinimoParcela').value) || 0;

    const resultado = document.getElementById('resultadoSimulacao');
    if (!resultado) return;

    DomUtils.clear(resultado);

    if (valor <= 0) {
      const p = document.createElement('p');
      p.className = 'text-secondary';
      p.textContent = 'Digite um valor para simular';
      resultado.appendChild(p);
      return;
    }

    const valorPix = valor - (valor * descontoPix / 100);

    const itemPix = document.createElement('div');
    itemPix.className = 'simulacao-item';
    const pixStrong = document.createElement('strong');
    pixStrong.textContent = '💰 PIX:';
    const pixSpan = document.createElement('span');
    pixSpan.className = 'valor-destaque';
    pixSpan.textContent = `R$ ${valorPix.toFixed(2).replace('.', ',')}`;
    itemPix.appendChild(pixStrong);
    itemPix.appendChild(pixSpan);

    if (descontoPix > 0) {
      const small = document.createElement('small');
      small.className = 'desconto-info';
      small.textContent = `${descontoPix}% de desconto`;
      itemPix.appendChild(small);
    }

    resultado.appendChild(itemPix);

    let parcelasValidas = parcelas;
    if (valorMinParcela > 0) {
      parcelasValidas = Math.min(parcelas, Math.floor(valor / valorMinParcela));
    }

    if (parcelasValidas > 1) {
      for (let i = 1; i <= parcelasValidas; i++) {
        const valorParcela = valor / i;
        const item = document.createElement('div');
        item.className = 'simulacao-item';
        const strong = document.createElement('strong');
        strong.textContent = `💳 ${i}x:`;
        const span = document.createElement('span');
        span.textContent = `R$ ${valorParcela.toFixed(2).replace('.', ',')} sem juros`;
        item.appendChild(strong);
        item.appendChild(span);
        resultado.appendChild(item);
      }
    } else {
      const item = document.createElement('div');
      item.className = 'simulacao-item';
      const strong = document.createElement('strong');
      strong.textContent = '💳 À vista no cartão:';
      const span = document.createElement('span');
      span.textContent = `R$ ${valor.toFixed(2).replace('.', ',')}`;
      item.appendChild(strong);
      item.appendChild(span);
      resultado.appendChild(item);
    }
  },

  async carregarConfiguracoes() {
    const config = await ConfigService.buscar();

    document.getElementById('descontoPix').value = config.descontoPix || 10;
    document.getElementById('parcelasSemJuros').value = config.parcelasSemJuros || 3;
    document.getElementById('valorMinimoParcela').value = config.valorMinimoParcela || 0;
    document.getElementById('exibirDescontoPix').checked = config.exibirDescontoPix !== false;
    document.getElementById('exibirParcelas').checked = config.exibirParcelas !== false;
    document.getElementById('aceitaDinheiro').checked = config.aceitaDinheiro === true;
    document.getElementById('aceitaBoleto').checked = config.aceitaBoleto === true;
    document.getElementById('observacoesPagamento').value = config.observacoesPagamento || '';
    document.getElementById('taxaMotoboy').value = config.taxaMotoboy || 0;
    document.getElementById('entregaRetiradaAtivo').checked = config.entregaRetiradaAtivo !== false;
    document.getElementById('entregaMotoboyAtivo').checked = config.entregaMotoboyAtivo !== false;

    this.simularParcelas();
  },

  async salvarConfiguracoes(e) {
    e.preventDefault();

    if (window.RateLimiter && !RateLimiter.allowBucket('config:pagamento', 5, 1 / 30)) {
      if (window.AuditService) {
        await AuditService.log({
          action: 'rate_limited',
          entity: 'config_pagamento',
          entityId: 'loja'
        });
      }
      alert('Muitas tentativas. Aguarde alguns segundos.');
      return;
    }

    const config = {
      descontoPix: parseFloat(document.getElementById('descontoPix').value) || 0,
      parcelasSemJuros: parseInt(document.getElementById('parcelasSemJuros').value) || 1,
      valorMinimoParcela: parseFloat(document.getElementById('valorMinimoParcela').value) || 0,
      exibirDescontoPix: document.getElementById('exibirDescontoPix').checked,
      exibirParcelas: document.getElementById('exibirParcelas').checked,
      aceitaDinheiro: document.getElementById('aceitaDinheiro').checked,
      aceitaBoleto: document.getElementById('aceitaBoleto').checked,
      observacoesPagamento: DomUtils.sanitizeText(document.getElementById('observacoesPagamento').value.trim(), 500),
      taxaMotoboy: parseFloat(document.getElementById('taxaMotoboy').value) || 0,
      entregaRetiradaAtivo: document.getElementById('entregaRetiradaAtivo').checked,
      entregaMotoboyAtivo: document.getElementById('entregaMotoboyAtivo').checked
    };

    const result = await ConfigService.salvar(config);

    if (result.success) {
      alert('✅ Configurações salvas com sucesso!');
    } else {
      alert('❌ Erro ao salvar configurações');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ConfigPagamentoPage.init());
window.ConfigPagamentoPage = ConfigPagamentoPage;
