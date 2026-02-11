/**
 * Serviço de Métricas
 */

const MetricasService = {
  collection: 'metricas',

  async registrarCliqueWhatsApp(dados) {
    try {
      if (window.RateLimiter && !RateLimiter.allowBucket('whatsapp_click', 10, 1 / 6)) {
        return;
      }

      await firebaseDb.collection(this.collection).add({
        tipo: 'whatsapp_click',
        produtoId: dados.produtoId || null,
        produtoNome: dados.produtoNome || null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('Erro ao registrar métrica:', error);
    }
  },

  async buscarMetricasDashboard() {
    try {
      if (typeof ProdutosService === 'undefined') {
        return this.metricasVazias();
      }

      const produtos = await ProdutosService.listar();

      const totalProdutos = produtos.length;
      const produtosAtivos = produtos.filter(p => p.ativo).length;
      const produtosInativos = totalProdutos - produtosAtivos;

      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

      const snapshotCliques = await firebaseDb
        .collection(this.collection)
        .where('tipo', '==', 'whatsapp_click')
        .where('timestamp', '>=', trintaDiasAtras)
        .get();

      return {
        totalProdutos,
        produtosAtivos,
        produtosInativos,
        totalCliques: snapshotCliques.size
      };
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      return this.metricasVazias();
    }
  },

  async buscarEventosRecentes(limite = 20) {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('timestamp', 'desc')
        .limit(limite)
        .get();

      const eventos = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        eventos.push({
          id: doc.id,
          tipo: data.tipo,
          produtoNome: data.produtoNome || 'N/A',
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });

      return eventos;
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }
  },

  metricasVazias() {
    return {
      totalProdutos: 0,
      produtosAtivos: 0,
      produtosInativos: 0,
      totalCliques: 0
    };
  },

  formatarDataHora(date) {
    const opcoes = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('pt-BR', opcoes);
  }
};

window.MetricasService = MetricasService;


