/**
 * Export Service - CSV/JSON
 */
const ExportService = {
  download(filename, content, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  toCSV(items, columns) {
    const escape = (val) => {
      const str = String(val ?? '');
      if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };

    const header = columns.map(c => escape(c.label)).join(',');
    const rows = items.map(item => {
      return columns.map(c => escape(item[c.key])).join(',');
    });
    return [header, ...rows].join('\n');
  },

  exportProdutos(produtos, format = 'csv') {
    const data = (produtos || []).map(p => ({
      id: p.id || '',
      nome: p.nome || '',
      marca: p.marca || '',
      categoria: p.categoria || '',
      tipoProdutoId: p.tipoProdutoId || '',
      tipoProdutoNome: p.tipoProdutoNome || '',
      precoPix: p.precoPix ?? 0,
      precoCartao: p.precoCartao ?? 0,
      ativo: p.ativo === true,
      status: p.status || 'draft',
      slug: p.slug || '',
      featured: p.featured === true,
      updatedAt: p.atualizadoEm && typeof p.atualizadoEm.toDate === 'function'
        ? p.atualizadoEm.toDate().toISOString()
        : ''
    }));

    if (format === 'json') {
      this.download('produtos.json', JSON.stringify(data, null, 2), 'application/json');
      return;
    }

    const csv = this.toCSV(data, [
      { key: 'id', label: 'ID' },
      { key: 'nome', label: 'Nome' },
      { key: 'marca', label: 'Marca' },
      { key: 'categoria', label: 'Categoria' },
      { key: 'tipoProdutoId', label: 'TipoProdutoId' },
      { key: 'tipoProdutoNome', label: 'TipoProdutoNome' },
      { key: 'precoPix', label: 'PrecoPIX' },
      { key: 'precoCartao', label: 'PrecoCartao' },
      { key: 'ativo', label: 'Ativo' },
      { key: 'status', label: 'Status' },
      { key: 'slug', label: 'Slug' },
      { key: 'featured', label: 'Featured' },
      { key: 'updatedAt', label: 'AtualizadoEm' }
    ]);
    this.download('produtos.csv', csv, 'text/csv');
  },

  exportConfig(config, format = 'json') {
    const safeFields = [
      'nomeLoja','whatsapp','mensagemPadrao','mensagemCarrinho',
      'taxaMotoboy','parcelasSemJuros','descontoPix','menuCategorias',
      'marcasCadastradas','categoriasCadastradas','avisoTexto','avisoBotaoTexto',
      'avisoBotaoUrl','logoUrl','whatsappFlutuante','whatsappMensagemFlutuante',
      'whatsappMensagemInicial','exibirHorario','horarioSegSexInicio','horarioSegSexFim',
      'horarioSabInicio','horarioSabFim','atendeDOM','mensagemForaHorario','permitirForaHorario',
      'telefone','email','endereco','customizacao','exibirTaxaEntrega','footerTexto','mensagemCarrinhoItem',
      'sliderAutoPlay','sliderInterval','exibirDescontoPix','exibirParcelas',
      'valorMinimoParcela','aceitaDinheiro','aceitaBoleto','observacoesPagamento'
    ];

    const payload = {};
    safeFields.forEach(f => {
      if (config && Object.prototype.hasOwnProperty.call(config, f)) payload[f] = config[f];
    });

    if (format === 'csv') {
      const csv = this.toCSV([payload], safeFields.map(f => ({ key: f, label: f })));
      this.download('config.csv', csv, 'text/csv');
      return;
    }

    this.download('config.json', JSON.stringify(payload, null, 2), 'application/json');
  },

  async exportAuditLogs(format = 'json', limit = 500) {
    if (window.RbacService) {
      const role = RbacService.role || '';
      if (String(role).toLowerCase() !== 'admin') {
        alert('Acesso negado para exportar audit_logs.');
        return;
      }
    }

    try {
      const snapshot = await firebaseDb
        .collection('audit_logs')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const logs = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        logs.push({
          id: doc.id,
          action: d.action || '',
          entity: d.entity || '',
          entityId: d.entityId || '',
          userId: d.userId || '',
          role: d.role || '',
          timestamp: d.timestamp && typeof d.timestamp.toDate === 'function'
            ? d.timestamp.toDate().toISOString()
            : '',
          userAgent: d.userAgent || ''
        });
      });

      if (format === 'csv') {
        const csv = this.toCSV(logs, [
          { key: 'id', label: 'ID' },
          { key: 'action', label: 'Action' },
          { key: 'entity', label: 'Entity' },
          { key: 'entityId', label: 'EntityId' },
          { key: 'userId', label: 'UserId' },
          { key: 'role', label: 'Role' },
          { key: 'timestamp', label: 'Timestamp' },
          { key: 'userAgent', label: 'UserAgent' }
        ]);
        this.download('audit_logs.csv', csv, 'text/csv');
        return;
      }

      this.download('audit_logs.json', JSON.stringify(logs, null, 2), 'application/json');
    } catch (error) {
      console.error('Erro ao exportar audit_logs:', error);
    }
  }
};

window.ExportService = ExportService;
