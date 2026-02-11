/**
 * Security Constants - limites e campos permitidos
 */
const SecurityConstants = {
  limits: {
    maxLen: {
      nome: 120,
      marca: 120,
      categoria: 120,
      tipoProdutoNome: 120,
      slug: 120,
      seoTitle: 120,
      seoDescription: 200,
      imagemUrl: 500,
      whatsapp: 15,
      codigoCupom: 50,
      email: 254,
      url: 500,
      titulo: 120,
      texto: 500,
      mensagem: 1000
    },
    maxArray: {
      tamanhos: 60,
      relacionados: 20,
      priceHistory: 30,
      opcoesTamanho: 100,
      items: 50,
      menuCategorias: 60,
      marcasCadastradas: 60,
      categoriasCadastradas: 60
    },
    maxPrice: 99999,
    maxDiscount: 100
  },
  regex: {
    url: '^https?:\\/\\/[A-Za-z0-9\\-._~:/?#\\[\\]@!$&\\\'()*+,;=%]+$'
  },
  allowedFields: {
    produtos: [
      'nome','marca','categoria','tipoProdutoId','tipoProdutoNome',
      'slug','seoTitle','seoDescription','relacionados','featured',
      'precoPix','precoCartao','tamanhos','imagemUrl','ativo',
      'priceHistory','criadoEm','atualizadoEm','status','publishedAt'
    ],
    tipos_produto: ['nome','nomePropriedade','opcoesTamanho','ativo'],
    config: [
      'nomeLoja','whatsapp','mensagemPadrao','mensagemCarrinho',
      'taxaMotoboy','parcelasSemJuros','descontoPix','pixelFacebook',
      'gtmGoogle','googleAnalytics','menuCategorias','marcasCadastradas',
      'categoriasCadastradas','avisoTexto','avisoBotaoTexto','avisoBotaoUrl','avisoMotoboy',
      'avisoEntregaTexto',
      'logoUrl','whatsappFlutuante','whatsappMensagemFlutuante',
      'whatsappMensagemInicial','exibirHorario','horarioSegSexInicio',
      'horarioSegSexFim','horarioSabInicio','horarioSabFim','atendeDOM',
      'mensagemForaHorario','permitirForaHorario','telefone','email','endereco',
      'customizacao','exibirTaxaEntrega','sliderAutoPlay','sliderInterval',
      'exibirDescontoPix','exibirParcelas','valorMinimoParcela',
      'aceitaDinheiro','aceitaBoleto','observacoesPagamento','mensagemCarrinhoItem','pixelAtivo','gtmAtivo','gaAtivo',
      'entregaRetiradaAtivo','entregaMotoboyAtivo',
      'footerTexto','atualizadoEm'
    ],
    banners: ['titulo','texto','imagemUrl','linkUrl','ordem','ativo','tipo','criadoEm','atualizadoEm'],
    menu_links: ['texto','url','icone','ordem','abrirNovaAba','destacado','ativo','criadoEm','atualizadoEm'],
    paginas: ['titulo','slug','modoConteudo','conteudoHtml','conteudoTexto','conteudoBlocos','ativo','criadoEm','atualizadoEm'],
    redes_sociais: ['tipo','nome','icone','url','ordem','ativo','criadoEm','atualizadoEm'],
    metricas: ['tipo','timestamp','produtoId','produtoNome','userAgent'],
    usuarios: ['email','role','ativo','criadoEm','atualizadoEm','displayName'],
    carrinhos: ['items','updatedAt'],
    pedidos: ['userId','items','total','status','criadoEm','atualizadoEm'],
    audit_logs: ['userId','role','action','entity','entityId','before','after','timestamp','userAgent','meta'],
    categorias: ['nome','slug','ordem','ativo','criadoEm','atualizadoEm'],
    marcas: ['nome','slug','logoUrl','descricao','ativo','criadoEm','atualizadoEm'],
    cupons: ['codigo','desconto','ativo','validade'],
    notificacoes: ['lida','mensagem','criadoEm'],
    reviews: ['produtoId','userId','rating','comentario','criadoEm']
  }
};

window.SecurityConstants = SecurityConstants;
