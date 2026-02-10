/**
 * DOM utilities (sanitization + helpers)
 */
const DomUtils = {
  escapeHTML(value = '') {
    if (window.SanitizeService) return SanitizeService.escapeHTML(value);
    const str = String(value);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  sanitizeUrl(url = '') {
    if (window.SanitizeService) return SanitizeService.sanitizeURL(url);
    const raw = String(url || '').trim();
    if (!raw) return '';

    try {
      const parsed = new URL(raw, window.location.origin);
      const protocol = parsed.protocol.toLowerCase();
      if (protocol !== 'http:' && protocol !== 'https:') {
        return '';
      }
      return parsed.href;
    } catch (e) {
      return '';
    }
  },

  sanitizeText(value = '', max = 500) {
    if (window.SanitizeService) return SanitizeService.sanitizeText(value, max);
    const str = String(value || '').trim();
    if (!str) return '';
    return str.length > max ? str.slice(0, max) : str;
  },

  setText(el, text) {
    if (!el) return;
    el.textContent = text ?? '';
  },

  setSafeHTML(el, html = '') {
    if (!el) return;
    el.innerHTML = DomUtils.escapeHTML(html);
  },

  create(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  },

  clear(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  },

  debounce(fn, wait = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), wait);
    };
  }
};

window.DomUtils = DomUtils;
