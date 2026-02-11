/**
 * Página: Dashboard
 */
const DashboardPage = {
  graficoAcessos: null,
  graficoDiaSemana: null,
  graficoHorarios: null,

  init() {
    const periodoFiltro = document.getElementById('periodoFiltro');
    if (periodoFiltro) {
      periodoFiltro.addEventListener('change', (e) => this.onPeriodoChange(e));
    }

    document.getElementById('exportConfigJson')?.addEventListener('click', async () => {
      if (window.ExportService && window.ConfigService) {
        const config = await ConfigService.buscar();
        ExportService.exportConfig(config, 'json');
      }
    });
    document.getElementById('exportAuditJson')?.addEventListener('click', async () => {
      if (window.ExportService) {
        ExportService.exportAuditLogs('json', 500);
      }
    });

    this.carregarDashboard();
  },

  async carregarDashboard() {
    try {
      const dados = await DashboardService.buscarMetricasCompletas();
      const stats = DashboardService.estatisticasResumo(dados.metricas);

      document.getElementById('totalProdutos').textContent = dados.totalProdutos;
      document.getElementById('produtosAtivos').textContent = dados.produtosAtivos;
      document.getElementById('totalAcessos').textContent = stats.ultimos7Dias.acessos;
      document.getElementById('totalCliques').textContent = stats.ultimos7Dias.cliques;
      document.getElementById('totalAddToCart').textContent = stats.ultimos7Dias.addToCart ?? 0;
      document.getElementById('totalCheckout').textContent = stats.ultimos7Dias.checkout ?? 0;
      document.getElementById('totalWhatsAppFloating').textContent = stats.ultimos7Dias.whatsappFloating ?? 0;

      const taxaConversao = stats.ultimos7Dias.acessos > 0
        ? ((stats.ultimos7Dias.cliques / stats.ultimos7Dias.acessos) * 100).toFixed(1)
        : 0;
      document.getElementById('taxaConversao').textContent = `${taxaConversao}%`;

      const dados7Dias = DashboardService.ultimos7Dias(dados.metricas);
      this.renderizarGraficoAcessos(dados7Dias);

      const dadosDiaSemana = DashboardService.agruparPorDiaSemana(dados.metricas);
      this.renderizarGraficoDiaSemana(dadosDiaSemana);

      const dadosHorarios = DashboardService.agruparPorHora(dados.metricas);
      this.renderizarGraficoHorarios(dadosHorarios);

      const topProdutos = DashboardService.produtosMaisClicados(dados.metricas);
      this.renderizarTopProdutos(topProdutos);

      await this.renderizarAlertas();
      await this.renderizarConfigVersoes();
      await this.renderizarHealthPanel();
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  },

  renderizarGraficoAcessos(dados) {
    const ctx = document.getElementById('graficoAcessos');
    if (!ctx) return;

    if (this.graficoAcessos) this.graficoAcessos.destroy();

    this.graficoAcessos = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dados.map(d => d.data),
        datasets: [
          {
            label: 'Visualizações',
            data: dados.map(d => d.acessos),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Cliques WhatsApp',
            data: dados.map(d => d.cliques),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom' },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  },

  renderizarGraficoDiaSemana(dados) {
    const ctx = document.getElementById('graficoDiaSemana');
    if (!ctx) return;

    if (this.graficoDiaSemana) this.graficoDiaSemana.destroy();

    const valores = Object.values(dados);

    this.graficoDiaSemana = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: valores.map(d => d.nome),
        datasets: [{
          label: 'Cliques',
          data: valores.map(d => d.total),
          backgroundColor: [
            'rgba(99, 102, 241, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  },

  renderizarGraficoHorarios(dados) {
    const ctx = document.getElementById('graficoHorarios');
    if (!ctx) return;

    if (this.graficoHorarios) this.graficoHorarios.destroy();

    const valores = Object.values(dados);

    this.graficoHorarios = new Chart(ctx, {
      type: 'line',
      data: {
        labels: valores.map(d => d.hora),
        datasets: [{
          label: 'Acessos',
          data: valores.map(d => d.total),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  },

  renderizarTopProdutos(produtos) {
    const container = document.getElementById('topProdutos');
    if (!container) return;

    DomUtils.clear(container);

    if (produtos.length === 0) {
      const p = document.createElement('p');
      p.className = 'empty-message';
      p.textContent = 'Nenhum clique registrado ainda';
      container.appendChild(p);
      return;
    }

    produtos.forEach((produto, index) => {
      const item = DomUtils.create('div', 'top-produto-item');
      const num = DomUtils.create('span', 'top-numero');
      num.textContent = `${index + 1}Âº`;
      const nome = DomUtils.create('span', 'top-nome');
      nome.textContent = produto.nome || '';
      const valor = DomUtils.create('span', 'top-valor');
      valor.textContent = `${produto.total} cliques`;

      item.appendChild(num);
      item.appendChild(nome);
      item.appendChild(valor);
      container.appendChild(item);
    });
  },

  async renderizarAlertas() {
    const container = document.getElementById('alertsContainer');
    if (!container || !window.AlertsService) return;

    DomUtils.clear(container);
    const alertas = await AlertsService.listarAlertas();

    if (alertas.length === 0) {
      const p = document.createElement('p');
      p.className = 'empty-message';
      p.textContent = 'Nenhum alerta ativo.';
      container.appendChild(p);
      return;
    }

    alertas.forEach(alerta => {
      const card = DomUtils.create('div', `alert-card ${alerta.severidade}`);
      const title = DomUtils.create('strong');
      title.textContent = alerta.tipo;
      const msg = DomUtils.create('p');
      msg.textContent = alerta.mensagem;
      const link = document.createElement('a');
      link.href = alerta.actionUrl;
      link.className = 'btn btn-secondary';
      link.textContent = 'Resolver';

      card.appendChild(title);
      card.appendChild(msg);
      card.appendChild(link);
      container.appendChild(card);
    });
  },

  async renderizarConfigVersoes() {
    const container = document.getElementById('configVersions');
    if (!container || !window.ConfigVersionService) return;

    if (window.RbacService && !RbacService.role) {
      await RbacService.loadRole();
    }

    if (window.RbacService && !RbacService.has('config.write')) {
      DomUtils.clear(container);
      const p = document.createElement('p');
      p.className = 'empty-message';
      p.textContent = 'Acesso restrito para versões de configuração.';
      container.appendChild(p);
      return;
    }

    DomUtils.clear(container);
    const versions = await ConfigVersionService.listar(5);

    if (versions.length === 0) {
      const p = document.createElement('p');
      p.className = 'empty-message';
      p.textContent = 'Nenhuma versão registrada.';
      container.appendChild(p);
      return;
    }

    versions.forEach(v => {
      const row = DomUtils.create('div', 'version-row');
      const info = DomUtils.create('span', 'version-info');
      const date = v.timestamp && typeof v.timestamp.toDate === 'function'
        ? v.timestamp.toDate().toLocaleString('pt-BR')
        : 'Agora';
      info.textContent = `${date} • ${v.motivo || 'update'}`;

      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary';
      btn.textContent = 'Restaurar';
      btn.addEventListener('click', async () => {
        if (!confirm('Restaurar esta versão de configuração?')) return;
        const result = await ConfigVersionService.restaurar(v.id);
        alert(result.success ? 'Configuração restaurada.' : 'Erro ao restaurar.');
      });

      row.appendChild(info);
      row.appendChild(btn);
      container.appendChild(row);
    });
  },

  async renderizarHealthPanel() {
    const container = document.getElementById('healthPanel');
    if (!container) return;
    DomUtils.clear(container);

    let firebaseStatus = 'Desconectado';
    try {
      if (firebase.apps && firebase.apps.length > 0) {
        firebaseStatus = 'Conectado';
      }
    } catch (e) {
      firebaseStatus = 'Desconectado';
    }

    const config = await ConfigService.buscar();
    const lastRead = ConfigService.lastReadAt
      ? ConfigService.lastReadAt.toLocaleString('pt-BR')
      : 'Nunca';
    const lastError = window.LastError || (ConfigService.lastError ? String(ConfigService.lastError) : 'Nenhum');

    let cloudinaryStatus = 'Indisponível';
    try {
      const cloudName = AppConfig.cloudinary.cloudName;
      const url = `https://res.cloudinary.com/${cloudName}/image/upload/sample`;
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok || res.status === 404) {
        cloudinaryStatus = res.status === 404 ? 'OK (sem amostra)' : 'OK';
      } else {
        cloudinaryStatus = 'Indisponível';
      }
    } catch (e) {
      cloudinaryStatus = 'Indisponível';
    }

    const inconsistencias = [];
    if (!config || !ConfigService.validarWhatsApp(String(config.whatsapp || ''))) {
      inconsistencias.push('WhatsApp inválido ou ausente');
    }

    const list = document.createElement('ul');
    list.className = 'health-list';

    const itens = [
      `Firebase: ${firebaseStatus}`,
      `Última leitura de config: ${lastRead}`,
      `Último erro: ${lastError}`,
      `Cloudinary: ${cloudinaryStatus}`,
      `Inconsistências: ${inconsistencias.length ? inconsistencias.join('; ') : 'Nenhuma'}`
    ];

    itens.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      list.appendChild(li);
    });

    container.appendChild(list);
  },

  async onPeriodoChange(e) {
    const periodo = e.target.value;
    const dados = await DashboardService.buscarMetricasCompletas();
    const stats = DashboardService.estatisticasResumo(dados.metricas);

    let acessos;
    let cliques;
    let addToCart;
    let checkout;
    let whatsappFloating;
    let label;

    if (periodo === 'hoje') {
      acessos = stats.hoje.acessos;
      cliques = stats.hoje.cliques;
      addToCart = stats.hoje.addToCart;
      checkout = stats.hoje.checkout;
      whatsappFloating = stats.hoje.whatsappFloating;
      label = 'Hoje';
    } else if (periodo === '7dias') {
      acessos = stats.ultimos7Dias.acessos;
      cliques = stats.ultimos7Dias.cliques;
      addToCart = stats.ultimos7Dias.addToCart;
      checkout = stats.ultimos7Dias.checkout;
      whatsappFloating = stats.ultimos7Dias.whatsappFloating;
      label = 'Últimos 7 dias';
    } else {
      acessos = stats.ultimos30Dias.acessos;
      cliques = stats.ultimos30Dias.cliques;
      addToCart = stats.ultimos30Dias.addToCart;
      checkout = stats.ultimos30Dias.checkout;
      whatsappFloating = stats.ultimos30Dias.whatsappFloating;
      label = 'Últimos 30 dias';
    }

    document.getElementById('totalAcessos').textContent = acessos;
    document.getElementById('totalCliques').textContent = cliques;
    document.getElementById('statusAcessos').textContent = label;
    document.getElementById('statusCliques').textContent = label;
    document.getElementById('totalAddToCart').textContent = addToCart ?? 0;
    document.getElementById('totalCheckout').textContent = checkout ?? 0;
    document.getElementById('totalWhatsAppFloating').textContent = whatsappFloating ?? 0;
    document.getElementById('statusAddToCart').textContent = label;
    document.getElementById('statusCheckout').textContent = label;
    document.getElementById('statusWhatsAppFloating').textContent = label;

    const taxaConversao = acessos > 0
      ? ((cliques / acessos) * 100).toFixed(1)
      : 0;
    document.getElementById('taxaConversao').textContent = `${taxaConversao}%`;
  }
};

document.addEventListener('DOMContentLoaded', () => DashboardPage.init());
window.DashboardPage = DashboardPage;


