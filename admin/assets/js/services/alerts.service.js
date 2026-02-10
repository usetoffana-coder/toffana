/**
 * Alerts Service
 */
const AlertsService = {
  async listarAlertas() {
    const alertas = [];

    const produtosPromise = (window.ProdutosService && typeof ProdutosService.listar === 'function')
      ? ProdutosService.listar()
      : Promise.resolve([]);
    const bannersPromise = (window.BannersService && typeof BannersService.listar === 'function')
      ? BannersService.listar()
      : Promise.resolve([]);
    const configPromise = (window.ConfigService && typeof ConfigService.buscar === 'function')
      ? ConfigService.buscar()
      : Promise.resolve(null);

    const [produtos, banners, config] = await Promise.all([
      produtosPromise,
      bannersPromise,
      configPromise
    ]);

    const semImagem = produtos.filter(p => !p.imagemUrl).length;
    if (semImagem > 0) {
      alertas.push({
        id: 'produtos_sem_imagem',
        tipo: 'Produtos sem imagem',
        severidade: 'warning',
        mensagem: `${semImagem} produto(s) sem imagem cadastrada.`,
        actionUrl: '/admin/produtos.html',
        origem: 'produtos',
        recomendacao: 'Adicionar imagem aos produtos.'
      });
    }

    const semTamanho = produtos.filter(p => !Array.isArray(p.tamanhos) || p.tamanhos.length === 0).length;
    if (semTamanho > 0) {
      alertas.push({
        id: 'produtos_sem_tamanho',
        tipo: 'Produtos sem tamanho',
        severidade: 'warning',
        mensagem: `${semTamanho} produto(s) sem tamanhos definidos.`,
        actionUrl: '/admin/produtos.html',
        origem: 'produtos',
        recomendacao: 'Definir tamanhos disponíveis.'
      });
    }

    const bannersSemLink = banners.filter(b => !b.linkUrl || !String(b.linkUrl).trim()).length;
    if (bannersSemLink > 0) {
      alertas.push({
        id: 'banners_sem_link',
        tipo: 'Banners sem link',
        severidade: 'info',
        mensagem: `${bannersSemLink} banner(s) sem link configurado.`,
        actionUrl: '/admin/configuracoes/banners.html',
        origem: 'banners',
        recomendacao: 'Adicionar link para cada banner.'
      });
    }

    if (config && window.ConfigService && !ConfigService.validarWhatsApp(String(config.whatsapp || ''))) {
      alertas.push({
        id: 'whatsapp_invalido',
        tipo: 'WhatsApp inválido',
        severidade: 'critical',
        mensagem: 'O número de WhatsApp está inválido. Atualize a configuração.',
        actionUrl: '/admin/configuracoes/comunicacao.html',
        origem: 'config',
        recomendacao: 'Corrigir número do WhatsApp.'
      });
    }

    const foraHorario = this.verificarForaHorario(config);
    if (foraHorario) {
      alertas.push({
        id: 'fora_horario',
        tipo: 'Loja fora do horário',
        severidade: 'info',
        mensagem: 'A loja está fora do horário configurado.',
        actionUrl: '/admin/configuracoes/comunicacao.html',
        origem: 'config',
        recomendacao: 'Revisar horário de atendimento.'
      });
    }

    return alertas;
  },

  verificarForaHorario(config) {
    if (!config || config.exibirHorario !== true) return false;

    const now = new Date();
    const day = now.getDay();
    const time = now.getHours() * 60 + now.getMinutes();

    const toMinutes = (hhmm) => {
      if (!hhmm) return null;
      const [h, m] = String(hhmm).split(':').map(n => parseInt(n, 10));
      if (Number.isNaN(h) || Number.isNaN(m)) return null;
      return h * 60 + m;
    };

    const isSunday = day === 0;
    const isSaturday = day === 6;

    if (isSunday && config.atendeDOM !== true) return true;

    if (isSaturday) {
      const start = toMinutes(config.horarioSabInicio);
      const end = toMinutes(config.horarioSabFim);
      if (start === null || end === null) return false;
      return time < start || time > end;
    }

    const start = toMinutes(config.horarioSegSexInicio);
    const end = toMinutes(config.horarioSegSexFim);
    if (start === null || end === null) return false;
    return time < start || time > end;
  }
};

window.AlertsService = AlertsService;
