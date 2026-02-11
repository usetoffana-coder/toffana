/**
 * Tracking Service
 * Supports Facebook Pixel, GTM and GA4
 */

const TrackingService = {
  config: null,
  facebookInitialized: false,
  gtmInitialized: false,
  gaInitialized: false,
  scrollMarks: new Set(),

  init(config) {
    this.config = config || {};

    if (this.config.pixelAtivo && this.config.pixelFacebook) {
      this.initFacebookPixel(String(this.config.pixelFacebook).trim());
    }

    if (this.config.gtmAtivo && this.config.gtmGoogle) {
      this.initGTM(String(this.config.gtmGoogle).trim());
    }

    if (this.config.gaAtivo && this.config.googleAnalytics) {
      this.initGoogleAnalytics(String(this.config.googleAnalytics).trim());
    }

    if (this.config.rastrearScrollDepth) {
      this.setupScrollDepth();
    }

    if (this.config.rastrearTempoNaPagina) {
      this.setupTimeOnPage();
    }

    if (this.config.rastrearCliquesOutbound) {
      this.setupOutboundClicks();
    }
  },

  initFacebookPixel(pixelId) {
    try {
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');

      fbq('init', pixelId);
      fbq('track', 'PageView');

      this.facebookInitialized = true;
      console.info('Facebook Pixel ready');
    } catch (error) {
      console.warn('Facebook Pixel init failed:', error);
    }
  },

  initGTM(gtmId) {
    try {
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer', gtmId);

      this.gtmInitialized = true;
      console.info('GTM ready');
    } catch (error) {
      console.warn('GTM init failed:', error);
    }
  },

  initGoogleAnalytics(gaId) {
    try {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script1);

      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);} // eslint-disable-line
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', gaId);

      this.gaInitialized = true;
      console.info('GA4 ready');
    } catch (error) {
      console.warn('GA4 init failed:', error);
    }
  },

  trackFacebookContact(dados) {
    if (!this.facebookInitialized || typeof fbq === 'undefined') return;

    try {
      fbq('track', 'Contact', {
        content_name: dados.produtoNome,
        content_category: dados.marca,
        value: dados.valor,
        currency: 'BRL'
      });
    } catch (error) {
      console.warn('Facebook event failed:', error);
    }
  },

  trackGTMEvent(eventName, dados) {
    if (!this.gtmInitialized || typeof dataLayer === 'undefined') return;

    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: eventName,
        ...dados
      });
    } catch (error) {
      console.warn('GTM event failed:', error);
    }
  },

  trackGAEvent(eventName, dados) {
    if (!this.gaInitialized || typeof gtag === 'undefined') return;

    try {
      gtag('event', eventName, dados);
    } catch (error) {
      console.warn('GA4 event failed:', error);
    }
  },

  trackWhatsAppClick(dados) {
    this.trackFacebookContact({
      produtoNome: dados.nome,
      marca: dados.marca,
      valor: dados.valor
    });

    this.trackGTMEvent('whatsapp_contact', {
      product_name: dados.nome,
      product_brand: dados.marca,
      product_size: dados.tamanho,
      payment_method: dados.pagamento,
      value: dados.valor,
      currency: 'BRL'
    });

    this.trackGAEvent('contact', {
      event_category: 'WhatsApp',
      event_label: dados.nome,
      value: dados.valor
    });
  },

  trackAddToCart(dados) {
    if (this.facebookInitialized && typeof fbq !== 'undefined') {
      try {
        fbq('track', 'AddToCart', {
          content_name: dados.nome,
          content_category: dados.marca,
          value: dados.valor,
          currency: 'BRL'
        });
      } catch (error) {
        console.warn('Facebook AddToCart failed:', error);
      }
    }

    this.trackGTMEvent('add_to_cart', {
      product_name: dados.nome,
      product_brand: dados.marca,
      product_size: dados.tamanho,
      payment_method: dados.pagamento,
      value: dados.valor,
      currency: 'BRL'
    });

    this.trackGAEvent('add_to_cart', {
      currency: 'BRL',
      value: dados.valor,
      items: [
        {
          item_name: dados.nome,
          item_brand: dados.marca
        }
      ]
    });
  },

  trackBeginCheckout(dados) {
    if (this.facebookInitialized && typeof fbq !== 'undefined') {
      try {
        fbq('track', 'InitiateCheckout', {
          value: dados.total,
          currency: 'BRL'
        });
      } catch (error) {
        console.warn('Facebook checkout failed:', error);
      }
    }

    this.trackGTMEvent('begin_checkout', {
      value: dados.total,
      items_count: dados.items,
      currency: 'BRL'
    });

    this.trackGAEvent('begin_checkout', {
      currency: 'BRL',
      value: dados.total,
      items: []
    });
  },

  setupScrollDepth() {
    const marks = [25, 50, 75, 100];
    const handler = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const percent = Math.round((scrollTop / docHeight) * 100);

      marks.forEach(mark => {
        if (percent >= mark && !this.scrollMarks.has(mark)) {
          this.scrollMarks.add(mark);
          this.trackGTMEvent('scroll_depth', { percent: mark });
          this.trackGAEvent('scroll_depth', { percent: mark });
        }
      });
    };

    window.addEventListener('scroll', handler, { passive: true });
  },

  setupTimeOnPage() {
    const times = [30, 60, 180];
    times.forEach(seconds => {
      setTimeout(() => {
        this.trackGTMEvent('time_on_page', { seconds });
        this.trackGAEvent('time_on_page', { seconds });
      }, seconds * 1000);
    });
  },

  setupOutboundClicks() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link || !link.href) return;

      if (DomUtils.isExternalUrl(link.href)) {
        this.trackGTMEvent('outbound_click', { url: link.href });
        this.trackGAEvent('outbound_click', { url: link.href });
      }
    });
  }
};

window.TrackingService = TrackingService;

