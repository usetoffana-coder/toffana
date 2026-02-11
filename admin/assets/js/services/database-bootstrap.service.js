/**
 * Database Bootstrap Service
 * Inicializa colecoes e documentos base no Firestore.
 */
const DatabaseBootstrapService = {
  async seed({ overwrite = false } = {}) {
    if (window.RbacService && !RbacService.has('config.write')) {
      return { success: false, error: 'Sem permissão para inicializar dados' };
    }

    const db = firebaseDb;
    const now = firebase.firestore.FieldValue.serverTimestamp();
    const summary = {
      config: 0,
      tipos_produto: 0,
      categorias: 0,
      marcas: 0,
      banners: 0,
      menu_links: 0,
      redes_sociais: 0,
      paginas: 0
    };

    const shouldWrite = async (collection, docId) => {
      if (overwrite) return true;
      const doc = await db.collection(collection).doc(docId).get();
      return !doc.exists;
    };

    const baseConfig = (window.ConfigService && ConfigService.getConfigPadrao)
      ? ConfigService.getConfigPadrao()
      : {
          nomeLoja: 'Minha Loja',
          whatsapp: '5511999999999'
        };

    if (await shouldWrite('config', 'loja')) {
      await db.collection('config').doc('loja').set({
        ...baseConfig,
        atualizadoEm: now
      }, { merge: true });
      summary.config++;
    }

    const tipos = (window.TiposProdutoService && TiposProdutoService.getTiposPadrao)
      ? TiposProdutoService.getTiposPadrao()
      : [];

    for (const tipo of tipos) {
      if (!tipo || !tipo.id) continue;
      if (!(await shouldWrite('tipos_produto', tipo.id))) continue;

      const { id, ...data } = tipo;
      await db.collection('tipos_produto').doc(id).set({
        ...data,
        criadoEm: now,
        atualizadoEm: now
      }, { merge: true });
      summary.tipos_produto++;
    }

    const categoriaBaseId = 'geral';
    if (await shouldWrite('categorias', categoriaBaseId)) {
      await db.collection('categorias').doc(categoriaBaseId).set({
        nome: 'Geral',
        slug: 'geral',
        ordem: 0,
        ativo: true,
        criadoEm: now,
        atualizadoEm: now
      }, { merge: true });
      summary.categorias++;
    }

    const marcaBaseId = 'drak-feet';
    if (await shouldWrite('marcas', marcaBaseId)) {
      await db.collection('marcas').doc(marcaBaseId).set({
        nome: 'Drak Feet',
        slug: 'drak-feet',
        logoUrl: '',
        descricao: '',
        ativo: true,
        criadoEm: now,
        atualizadoEm: now
      }, { merge: true });
      summary.marcas++;
    }

    const bannerBaseId = 'banner-principal';
    if (await shouldWrite('banners', bannerBaseId)) {
      await db.collection('banners').doc(bannerBaseId).set({
        titulo: 'Banner principal',
        texto: 'Edite este banner no painel',
        imagemUrl: '',
        linkUrl: '',
        ordem: 1,
        tipo: 'slider',
        ativo: false,
        criadoEm: now,
        atualizadoEm: now
      }, { merge: true });
      summary.banners++;
    }

    const menuBaseId = 'inicio';
    if (await shouldWrite('menu_links', menuBaseId)) {
      await db.collection('menu_links').doc(menuBaseId).set({
        texto: 'Início',
        url: '#inicio',
        icone: '',
        ordem: 1,
        abrirNovaAba: false,
        destacado: false,
        ativo: true,
        criadoEm: now,
        atualizadoEm: now
      }, { merge: true });
      summary.menu_links++;
    }

    const redeBaseId = 'whatsapp';
    if (await shouldWrite('redes_sociais', redeBaseId)) {
      const whatsapp = String(baseConfig.whatsapp || '5511999999999').replace(/\D/g, '');
      await db.collection('redes_sociais').doc(redeBaseId).set({
        tipo: 'whatsapp',
        nome: 'WhatsApp',
        icone: '💬',
        url: `https://wa.me/${whatsapp}`,
        ordem: 1,
        ativo: true,
        criadoEm: now,
        atualizadoEm: now
      }, { merge: true });
      summary.redes_sociais++;
    }

    const paginaBaseId = 'sobre';
    if (await shouldWrite('paginas', paginaBaseId)) {
      await db.collection('paginas').doc(paginaBaseId).set({
        titulo: 'Sobre',
        slug: 'sobre',
        modoConteudo: 'texto',
        conteudoTexto: 'Edite esta página no painel administrativo.',
        conteudoHtml: '',
        conteudoBlocos: [],
        ativo: false,
        criadoEm: now,
        atualizadoEm: now
      }, { merge: true });
      summary.paginas++;
    }

    if (window.AuditService) {
      await AuditService.log({
        action: 'database_bootstrap',
        entity: 'firestore',
        entityId: 'seed',
        before: null,
        after: { overwrite, summary }
      });
    }

    return { success: true, summary };
  }
};

window.DatabaseBootstrapService = DatabaseBootstrapService;
