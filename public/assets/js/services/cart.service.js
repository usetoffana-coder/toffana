/**
 * Cart Service
 */

const CartService = {
  items: [],
  maxItems: 50,
  notes: '',
  deliveryType: null,
  deliveryOptions: [],
  deliveryConfig: {},

  init() {
    this.loadFromStorage();
    this.updateCartUI();
    this.bindNotesInput();
    console.info('CartService ready');
  },

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.items = parsed;
          this.notes = '';
          this.deliveryType = null;
        } else if (parsed && typeof parsed === 'object') {
          this.items = Array.isArray(parsed.items) ? parsed.items : [];
          this.notes = String(parsed.notes || '');
          this.deliveryType = parsed.deliveryType || null;
        }
      }
    } catch (error) {
      console.warn('Failed to load cart:', error);
      this.items = [];
      this.notes = '';
      this.deliveryType = null;
    }
  },

  saveToStorage() {
    try {
      localStorage.setItem('cart', JSON.stringify({
        items: this.items,
        notes: this.notes,
        deliveryType: this.deliveryType
      }));
    } catch (error) {
      console.warn('Failed to save cart:', error);
    }
  },

  addItem(produto, tamanho, pagamento, preco) {
    if (this.items.length >= this.maxItems) {
      if (window.InlineAlert) {
        InlineAlert.show(`Limite de ${this.maxItems} itens no carrinho atingido.`, 'warning');
      }
      return false;
    }

    const item = {
      id: `${produto.id}-${tamanho}-${pagamento}`,
      produtoId: produto.id,
      nome: produto.nome,
      marca: produto.marca,
      imagem: produto.imagemUrl,
      tamanho,
      pagamento,
      preco,
      quantidade: 1,
      timestamp: Date.now()
    };

    const existingIndex = this.items.findIndex(i =>
      i.produtoId === produto.id &&
      i.tamanho === tamanho &&
      i.pagamento === pagamento
    );

    if (existingIndex >= 0) {
      this.items[existingIndex].quantidade += 1;
    } else {
      this.items.push(item);
    }

    this.saveToStorage();
    this.updateCartUI();
    this.showNotification('Produto adicionado ao carrinho!');
    return true;
  },

  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
    this.saveToStorage();
    this.updateCartUI();
  },

  updateQuantity(itemId, quantidade) {
    if (quantidade <= 0) {
      this.removeItem(itemId);
      return;
    }

    const item = this.items.find(i => i.id === itemId);
    if (item) {
      item.quantidade = Math.min(quantidade, 10);
      this.saveToStorage();
      this.updateCartUI();
    }
  },

  clear() {
    this.items = [];
    this.notes = '';
    this.saveToStorage();
    this.updateCartUI();
  },

  getTotalItems() {
    return this.items.reduce((sum, item) => sum + item.quantidade, 0);
  },

  getTotalValue() {
    if (this.items.length === 0) return 0;
    const itensTotal = this.items.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    const taxa = this.deliveryType === 'motoboy'
      ? Number(this.deliveryConfig.taxaMotoboy || 0)
      : 0;
    return itensTotal + taxa;
  },

  updateCartUI() {
    const badge = document.getElementById('cartBadge');
    const cartTotal = document.getElementById('cartTotal');

    const totalItems = this.getTotalItems();

    if (badge) {
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    if (cartTotal) {
      const total = this.getTotalValue();
      cartTotal.textContent = `R$ ${this.formatPrice(total)}`;
    }

    this.renderDeliveryFee();
    this.renderCartItems();
    this.syncNotesUI();
  },

  bindNotesInput() {
    const textarea = document.getElementById('cartObservacoes');
    if (!textarea) return;
    textarea.addEventListener('input', () => {
      this.notes = textarea.value;
      this.saveToStorage();
    });
  },

  syncNotesUI() {
    const textarea = document.getElementById('cartObservacoes');
    if (!textarea) return;
    if (textarea.value !== this.notes) {
      textarea.value = this.notes || '';
    }
  },

  setDeliveryOptions(config = {}) {
    this.deliveryConfig = config || {};
    const options = [];
    if (config.entregaRetiradaAtivo !== false) {
      options.push({ value: 'retirada', label: 'Retirar na Loja' });
    }
    if (config.entregaMotoboyAtivo !== false) {
      options.push({ value: 'motoboy', label: 'Entrega via Motoboy' });
    }

    this.deliveryOptions = options;
    if (!options.length) {
      this.deliveryType = null;
      this.renderDeliveryOptions();
      return;
    }

    if (!this.deliveryType || !options.some(o => o.value === this.deliveryType)) {
      this.deliveryType = options[0].value;
      this.saveToStorage();
    }

    this.renderDeliveryOptions();
  },

  setDeliveryType(value) {
    if (!value || value === this.deliveryType) return;
    this.deliveryType = value;
    this.saveToStorage();
    this.renderDeliveryOptions();
    this.updateCartUI();
  },

  getDeliveryLabel() {
    if (!this.deliveryType) return '';
    const option = this.deliveryOptions.find(o => o.value === this.deliveryType);
    return option ? option.label : '';
  },

  renderDeliveryOptions() {
    const cartWrap = document.getElementById('cartDelivery');
    const cartOptions = document.getElementById('cartDeliveryOptions');
    const catalogOptions = document.getElementById('entregaCatalogoOptions');
    const catalogWrap = document.getElementById('entregaSelector');
    const cardOptions = document.querySelectorAll('[data-entrega-options]');

    if (!this.deliveryOptions.length) {
      if (cartWrap) cartWrap.style.display = 'none';
      if (catalogWrap) catalogWrap.style.display = 'none';
      cardOptions.forEach((el) => {
        el.innerHTML = '';
      });
      return;
    }

    if (cartWrap) cartWrap.style.display = 'flex';
    if (catalogWrap) catalogWrap.style.display = 'flex';

    const renderOptions = (container, name, compact = false) => {
      if (!container) return;
      container.innerHTML = this.deliveryOptions.map(opt => `
        <label class="entrega-option ${compact ? 'entrega-option--compact' : ''} ${this.deliveryType === opt.value ? 'active' : ''}">
          <input type="radio" name="${name}" value="${opt.value}" ${this.deliveryType === opt.value ? 'checked' : ''}>
          <span>${opt.label}</span>
        </label>
      `).join('');

      container.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('change', () => this.setDeliveryType(input.value));
      });
    };

    renderOptions(cartOptions, 'entrega_cart');
    renderOptions(catalogOptions, 'entrega_catalogo');
    cardOptions.forEach((el) => renderOptions(el, 'entrega_global', true));
  },

  renderDeliveryFee() {
    const feeEl = document.getElementById('cartDeliveryFee');
    if (!feeEl) return;
    if (this.deliveryType !== 'motoboy') {
      feeEl.textContent = '';
      return;
    }
    const taxa = Number(this.deliveryConfig.taxaMotoboy || 0);
    if (taxa > 0) {
      feeEl.textContent = `Taxa de entrega: R$ ${this.formatPrice(taxa)}`;
    } else {
      feeEl.textContent = '';
    }
  },

  renderCartItems() {
    const container = document.getElementById('cartItems');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <p>Seu carrinho está vazio</p>
          <small>Adicione produtos para começar</small>
        </div>
      `;
      return;
    }

    container.innerHTML = this.items.map(item => {
      const nome = DomUtils.escapeHtml(item.nome);
      const marca = DomUtils.escapeHtml(item.marca);
      const tamanho = DomUtils.escapeHtml(item.tamanho);
      const pagamento = DomUtils.escapeHtml(item.pagamento);
      const imagem = DomUtils.sanitizeUrl(item.imagem);

      return `
        <div class="cart-item" data-item-id="${item.id}">
          <img src="${imagem}" alt="${nome}" class="cart-item-image">
          <div class="cart-item-info">
            <h4 class="cart-item-name">${nome}</h4>
            <p class="cart-item-details">${marca} • ${tamanho} • ${pagamento}</p>
            <div class="cart-item-controls">
              <button class="btn-quantity" onclick="CartService.updateQuantity('${item.id}', ${item.quantidade - 1})">-</button>
              <span class="cart-item-qty">${item.quantidade}</span>
              <button class="btn-quantity" onclick="CartService.updateQuantity('${item.id}', ${item.quantidade + 1})">+</button>
              <span class="cart-item-price">R$ ${this.formatPrice(item.preco * item.quantidade)}</span>
            </div>
          </div>
          <button class="btn-remove-item" onclick="CartService.removeItem('${item.id}')" aria-label="Remover">✖</button>
        </div>
      `;
    }).join('');
  },

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },

  generateWhatsAppMessage(config) {
    if (this.items.length === 0) return '';

    const total = this.getTotalValue();
    const totalItems = this.getTotalItems();
    const pagamentos = [...new Set(this.items.map(i => i.pagamento))];
    const pagamentoTexto = pagamentos.length === 1 ? pagamentos[0] : 'Variado';
    const freteValor = this.deliveryType === 'motoboy'
      ? Number(config.taxaMotoboy || 0)
      : 0;
    const entregaTexto = this.getDeliveryLabel() || 'Retirar na Loja';
    const totalPix = this.items
      .filter(i => String(i.pagamento).toUpperCase() === 'PIX')
      .reduce((sum, i) => sum + (i.preco * i.quantidade), 0);
    const totalCartao = this.items
      .filter(i => String(i.pagamento).toUpperCase() === 'CARTAO')
      .reduce((sum, i) => sum + (i.preco * i.quantidade), 0);

    const itemTemplate = config.mensagemCarrinhoItem
      || '{numero}. *{produto}* - {marca}\n   Tamanho: {tamanho} | Pagamento: {pagamento}\n   Qtd: {quantidade} | Valor unit.: R$ {valor} | Subtotal: R$ {subtotal}';

    const produtosLista = this.items.map((item, index) => {
      const nome = String(item.nome || '').trim();
      const marca = String(item.marca || '').trim();
      const tamanho = String(item.tamanho || '').trim();
      const pagamento = String(item.pagamento || '').trim();
      const unit = this.formatPrice(item.preco);
      const subtotal = this.formatPrice(item.preco * item.quantidade);
      return itemTemplate
        .replace(/{numero}/g, String(index + 1))
        .replace(/{produto}/g, nome)
        .replace(/{marca}/g, marca)
        .replace(/{tamanho}/g, tamanho)
        .replace(/{pagamento}/g, pagamento)
        .replace(/{quantidade}/g, String(item.quantidade))
        .replace(/{valor}/g, unit)
        .replace(/{subtotal}/g, subtotal);
    }).join('\n\n');

    const itensSimples = this.items.map(item => {
      const nome = String(item.nome || '').trim();
      return `${nome} x${item.quantidade}`;
    }).join('\n');

    const template = config.mensagemCarrinho || config.mensagemPadrao || 'Olá! Gostaria de fazer um pedido:';

    return template
      .replace(/{produtos}/g, produtosLista)
      .replace(/{item}/g, produtosLista)
      .replace(/{itens}/g, itensSimples)
      .replace(/{quantidade}/g, String(totalItems))
      .replace(/{total}/g, this.formatPrice(total))
      .replace(/{total_pix}/g, this.formatPrice(totalPix))
      .replace(/{total_cartao}/g, this.formatPrice(totalCartao))
      .replace(/{pagamento}/g, pagamentoTexto)
      .replace(/{entrega}/g, entregaTexto)
      .replace(/{frete}/g, this.formatPrice(freteValor))
      .replace(/{observacoes}/g, this.notes && String(this.notes).trim() !== ''
        ? String(this.notes).trim()
        : 'Sem observações');
  },

  formatPrice(value) {
    return Number(value || 0).toFixed(2).replace('.', ',');
  }
};

window.CartService = CartService;

