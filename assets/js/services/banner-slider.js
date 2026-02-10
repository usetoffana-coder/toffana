/**
 * Banner Slider Service
 */

const BannerSlider = {
  slides: [],
  currentIndex: 0,
  intervalId: null,
  autoPlay: true,
  interval: 5000,

  init(banners, options = {}) {
    if (!banners || banners.length === 0) {
      const slider = document.getElementById('bannerSlider');
      if (slider) slider.style.display = 'none';
      return;
    }

    this.stopAutoPlay();
    this.currentIndex = 0;
    this.autoPlay = options.sliderAutoPlay !== false;
    const desiredInterval = Number(options.sliderInterval) || 5000;
    this.interval = Math.min(Math.max(desiredInterval, 3000), 15000);

    this.slides = banners.filter(b => b.ativo !== false);
    if (this.slides.length === 0) {
      const slider = document.getElementById('bannerSlider');
      if (slider) slider.style.display = 'none';
      return;
    }

    this.render();
    this.setupControls();
    if (this.autoPlay && this.slides.length > 1) {
      this.startAutoPlay();
    }

    console.info('BannerSlider ready:', this.slides.length);
  },

  render() {
    const container = document.getElementById('sliderContainer');
    const dotsContainer = document.getElementById('sliderDots');

    if (!container) return;

    container.innerHTML = this.slides.map((slide, index) => {
      const title = DomUtils.escapeHtml(slide.titulo || '');
      const text = DomUtils.escapeHtml(slide.texto || '');
      const linkUrl = DomUtils.sanitizeUrl(slide.linkUrl || '');
      const imageUrl = DomUtils.sanitizeUrl(slide.imagemUrl || '');
      const hasContent = title || text;
      const linkAttrs = linkUrl
        ? `href="${linkUrl}" target="_blank" rel="noopener noreferrer"`
        : 'href="#"';

      return `
        <div class="slider-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
          <a ${linkAttrs} class="slide-link">
            <img src="${imageUrl}" alt="${title || 'Banner'}" class="slide-image">
            ${hasContent ? `
              <div class="slide-content">
                ${title ? `<h2 class="slide-title">${title}</h2>` : ''}
                ${text ? `<p class="slide-text">${text}</p>` : ''}
              </div>
            ` : ''}
          </a>
        </div>
      `;
    }).join('');

    if (dotsContainer && this.slides.length > 1) {
      dotsContainer.innerHTML = this.slides.map((_, index) => `
        <button class="slider-dot ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Slide ${index + 1}"></button>
      `).join('');
    }

    const slider = document.getElementById('bannerSlider');
    if (slider) slider.style.display = 'block';
  },

  setupControls() {
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    const dots = document.querySelectorAll('.slider-dot');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prev());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.next());
    }

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => this.goTo(index));
    });

    const slider = document.getElementById('bannerSlider');
    if (slider) {
      slider.addEventListener('mouseenter', () => this.stopAutoPlay());
      slider.addEventListener('mouseleave', () => {
        if (this.autoPlay && this.slides.length > 1) {
          this.startAutoPlay();
        }
      });
    }
  },

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
    this.updateSlide();
  },

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.slides.length;
    this.updateSlide();
  },

  goTo(index) {
    this.currentIndex = index;
    this.updateSlide();
  },

  updateSlide() {
    const slides = document.querySelectorAll('.slider-slide');
    const dots = document.querySelectorAll('.slider-dot');

    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === this.currentIndex);
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentIndex);
    });
  },

  startAutoPlay() {
    this.stopAutoPlay();
    this.intervalId = setInterval(() => {
      this.next();
    }, this.interval);
  },

  stopAutoPlay() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
};

window.BannerSlider = BannerSlider;

