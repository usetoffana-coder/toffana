/**
 * Serviço de Dashboard
 * Gerencia métricas avançadas e gráficos
 */

// ==============================
// FUNÇÃO AUXILIAR
// ==============================
function normalizarTimestamp(timestamp) {
  if (!timestamp) return null;

  // Firestore Timestamp
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // ISO String
  if (typeof timestamp === 'string') {
    const d = new Date(timestamp);
    return isNaN(d.getTime()) ? null : d;
  }

  // Epoch (number)
  if (typeof timestamp === 'number') {
    const d = new Date(timestamp);
    return isNaN(d.getTime()) ? null : d;
  }

  // Date direto
  if (timestamp instanceof Date) {
    return timestamp;
  }

  return null;
}

const DashboardService = {
  /**
   * Busca métricas completas para o dashboard
   * @returns {Promise<object>}
   */
  async buscarMetricasCompletas() {
    try {
      if (window.RbacService && !RbacService.role) {
        await RbacService.loadRole();
      }

      const podeLerMetricas = window.RbacService
        ? RbacService.has('metricas.read')
        : true;

      const produtos = await ProdutosService.listar();
      const totalProdutos = produtos.length;
      const produtosAtivos = produtos.filter(p => p.ativo).length;
      const produtosInativos = totalProdutos - produtosAtivos;

      if (!podeLerMetricas) {
        return {
          totalProdutos,
          produtosAtivos,
          produtosInativos,
          totalCliques: 0,
          totalAcessos: 0,
          metricas: []
        };
      }

      const snapshot = await firebaseDb
        .collection('metricas')
        .orderBy('timestamp', 'desc')
        .get();

      const metricas = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const timestampNormalizado = normalizarTimestamp(data.timestamp);

        if (!timestampNormalizado) {
          console.warn('⚠️ Métrica ignorada (timestamp inválido):', doc.id);
          return;
        }

        metricas.push({
          id: doc.id,
          tipo: data.tipo,
          produtoId: data.produtoId || null,
          produtoNome: data.produtoNome || null,
          timestamp: timestampNormalizado,
          userAgent: data.userAgent || null,
          ip: data.ip || null
        });
      });

      // Análises
      const totalCliques = metricas.filter(m => m.tipo === 'whatsapp_click').length;
      const totalAcessos = metricas.filter(m => m.tipo === 'page_view').length;

      return {
        totalProdutos,
        produtosAtivos,
        produtosInativos,
        totalCliques,
        totalAcessos,
        metricas
      };
    } catch (error) {
      if (!(error && error.code === 'permission-denied')) {
        console.error('❌ Erro ao buscar métricas:', error);
      }
      return {
        totalProdutos: 0,
        produtosAtivos: 0,
        produtosInativos: 0,
        totalCliques: 0,
        totalAcessos: 0,
        metricas: []
      };
    }
  },

  /**
   * Agrupa cliques por dia da semana
   */
  agruparPorDiaSemana(metricas) {
    const cliques = metricas.filter(m => m.tipo === 'whatsapp_click');

    const diasSemana = {
      0: { nome: 'Dom', total: 0 },
      1: { nome: 'Seg', total: 0 },
      2: { nome: 'Ter', total: 0 },
      3: { nome: 'Qua', total: 0 },
      4: { nome: 'Qui', total: 0 },
      5: { nome: 'Sex', total: 0 },
      6: { nome: 'Sáb', total: 0 }
    };

    cliques.forEach(clique => {
      if (!(clique.timestamp instanceof Date)) return;
      const dia = clique.timestamp.getDay();
      diasSemana[dia].total++;
    });

    return diasSemana;
  },

  /**
   * Agrupa acessos por hora do dia
   */
  agruparPorHora(metricas) {
    const acessos = metricas.filter(
      m => m.tipo === 'page_view' || m.tipo === 'whatsapp_click'
    );

    const horas = {};
    for (let i = 0; i < 24; i++) {
      horas[i] = { hora: `${i}h`, total: 0 };
    }

    acessos.forEach(acesso => {
      if (!(acesso.timestamp instanceof Date)) return;
      const hora = acesso.timestamp.getHours();
      horas[hora].total++;
    });

    return horas;
  },

  /**
   * Produtos mais clicados
   */
  produtosMaisClicados(metricas) {
    const cliques = metricas.filter(
      m => m.tipo === 'whatsapp_click' && m.produtoNome
    );

    const contagem = {};

    cliques.forEach(clique => {
      contagem[clique.produtoNome] =
        (contagem[clique.produtoNome] || 0) + 1;
    });

    return Object.entries(contagem)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  },

  /**
   * Últimos 7 dias
   */
  ultimos7Dias(metricas) {
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje.getTime() - 7 * 86400000);

    const metricasRecentes = metricas.filter(
      m => m.timestamp instanceof Date && m.timestamp >= seteDiasAtras
    );

    const dias = {};
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje.getTime() - i * 86400000);
      const chave = this.formatarDataChave(data);
      dias[chave] = {
        data: this.formatarDataLabel(data),
        acessos: 0,
        cliques: 0
      };
    }

    metricasRecentes.forEach(metrica => {
      const chave = this.formatarDataChave(metrica.timestamp);
      if (!dias[chave]) return;

      if (metrica.tipo === 'page_view') dias[chave].acessos++;
      if (metrica.tipo === 'whatsapp_click') dias[chave].cliques++;
    });

    return Object.values(dias);
  },

  formatarDataChave(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  },

  formatarDataLabel(data) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
  },

  /**
   * Estatísticas resumo
   */
  estatisticasResumo(metricas) {
    const hoje = new Date();
    const ontem = new Date(hoje.getTime() - 86400000);
    const seteDiasAtras = new Date(hoje.getTime() - 7 * 86400000);
    const trintaDiasAtras = new Date(hoje.getTime() - 30 * 86400000);

    const isMesmoDia = (a, b) =>
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear();

    const validas = metricas.filter(m => m.timestamp instanceof Date);

    const contar = (tipo, inicio, fim = null) =>
      validas.filter(m =>
        m.tipo === tipo
        && m.timestamp >= inicio
        && (fim ? m.timestamp < fim : true)
      ).length;

    return {
      hoje: {
        acessos: validas.filter(
          m => m.tipo === 'page_view' && isMesmoDia(m.timestamp, hoje)
        ).length,
        cliques: validas.filter(
          m => m.tipo === 'whatsapp_click' && isMesmoDia(m.timestamp, hoje)
        ).length,
        addToCart: validas.filter(
          m => m.tipo === 'add_to_cart' && isMesmoDia(m.timestamp, hoje)
        ).length,
        checkout: validas.filter(
          m => m.tipo === 'checkout_whatsapp' && isMesmoDia(m.timestamp, hoje)
        ).length,
        whatsappFloating: validas.filter(
          m => m.tipo === 'whatsapp_floating_click' && isMesmoDia(m.timestamp, hoje)
        ).length
      },
      ontem: {
        acessos: validas.filter(
          m => m.tipo === 'page_view' && isMesmoDia(m.timestamp, ontem)
        ).length,
        cliques: validas.filter(
          m => m.tipo === 'whatsapp_click' && isMesmoDia(m.timestamp, ontem)
        ).length,
        addToCart: validas.filter(
          m => m.tipo === 'add_to_cart' && isMesmoDia(m.timestamp, ontem)
        ).length,
        checkout: validas.filter(
          m => m.tipo === 'checkout_whatsapp' && isMesmoDia(m.timestamp, ontem)
        ).length,
        whatsappFloating: validas.filter(
          m => m.tipo === 'whatsapp_floating_click' && isMesmoDia(m.timestamp, ontem)
        ).length
      },
      ultimos7Dias: {
        acessos: contar('page_view', seteDiasAtras),
        cliques: contar('whatsapp_click', seteDiasAtras),
        addToCart: contar('add_to_cart', seteDiasAtras),
        checkout: contar('checkout_whatsapp', seteDiasAtras),
        whatsappFloating: contar('whatsapp_floating_click', seteDiasAtras)
      },
      ultimos30Dias: {
        acessos: contar('page_view', trintaDiasAtras),
        cliques: contar('whatsapp_click', trintaDiasAtras),
        addToCart: contar('add_to_cart', trintaDiasAtras),
        checkout: contar('checkout_whatsapp', trintaDiasAtras),
        whatsappFloating: contar('whatsapp_floating_click', trintaDiasAtras)
      }
    };
  }
};

// Exportar
window.DashboardService = DashboardService;
