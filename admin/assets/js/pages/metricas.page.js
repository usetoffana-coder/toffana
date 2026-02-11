/**
 * Página: Métricas
 */
const MetricasPage = {
  init() {
    this.carregarMetricas();
  },

  async carregarMetricas() {
    const dados = await DashboardService.buscarMetricasCompletas();
    const stats = DashboardService.estatisticasResumo(dados.metricas);

    document.getElementById('totalProdutos').textContent = dados.totalProdutos;
    document.getElementById('totalAcessos').textContent = stats.ultimos30Dias.acessos;
    document.getElementById('totalCliques').textContent = stats.ultimos30Dias.cliques;
    document.getElementById('totalAddToCart').textContent = stats.ultimos30Dias.addToCart ?? 0;
    document.getElementById('totalCheckout').textContent = stats.ultimos30Dias.checkout ?? 0;
    document.getElementById('totalWhatsAppFloating').textContent = stats.ultimos30Dias.whatsappFloating ?? 0;

    const eventos = dados.metricas.slice(0, 50);
    const tbody = document.getElementById('eventosTableBody');
    DomUtils.clear(tbody);

    if (eventos.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 3;
      td.style.textAlign = 'center';
      td.style.padding = '40px';
      td.textContent = 'Nenhum evento registrado';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    const frag = document.createDocumentFragment();

    eventos.forEach(evento => {
      const tr = document.createElement('tr');
      const tdTipo = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = 'badge';
      const labels = {
        whatsapp_click: '💬 WhatsApp',
        whatsapp_floating_click: '📲 WhatsApp Flutuante',
        checkout_whatsapp: '✅ Finalização',
        add_to_cart: '🛒 Carrinho',
        page_view: '👁️ Visualização',
        product_view: '👀 Produto',
        banner_click: '🖼️ Banner',
        search: '🔎 Busca',
        filter_apply: '🧰 Filtro'
      };
      badge.textContent = labels[evento.tipo] || evento.tipo;
      tdTipo.appendChild(badge);

      const tdProduto = document.createElement('td');
      tdProduto.textContent = evento.produtoNome || 'Página Principal';

      const tdData = document.createElement('td');
      tdData.textContent = new Date(evento.timestamp).toLocaleString('pt-BR');

      tr.appendChild(tdTipo);
      tr.appendChild(tdProduto);
      tr.appendChild(tdData);

      frag.appendChild(tr);
    });

    tbody.appendChild(frag);
  }
};

document.addEventListener('DOMContentLoaded', () => MetricasPage.init());
window.MetricasPage = MetricasPage;


