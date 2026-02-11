/**
 * Sanitize Service - helpers seguros para DOM
 */
const SanitizeService = {
  escapeHTML(value = '') {
    const str = String(value);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  sanitizeText(value = '', max = 500) {
    const str = String(value || '')
      .replace(/<[^>]*>/g, '')
      .trim();
    if (!str) return '';
    return str.length > max ? str.slice(0, max) : str;
  },

  sanitizeURL(url = '') {
    const raw = String(url || '').trim();
    if (!raw) return '';

    try {
      const parsed = new URL(raw, window.location.origin);
      const protocol = parsed.protocol.toLowerCase();
      if (protocol !== 'http:' && protocol !== 'https:') return '';
      const regex = window.SecurityConstants?.regex?.url
        ? new RegExp(window.SecurityConstants.regex.url)
        : null;
      if (regex && !regex.test(parsed.href)) return '';
      return parsed.href;
    } catch (e) {
      return '';
    }
  },

  createElement(tag, options = {}) {
    const el = document.createElement(tag);
    if (options.className) el.className = options.className;
    if (options.text !== undefined && options.text !== null) {
      el.textContent = String(options.text);
    }
    if (options.attrs && typeof options.attrs === 'object') {
      Object.entries(options.attrs).forEach(([key, val]) => {
        if (val === undefined || val === null) return;
        el.setAttribute(key, String(val));
      });
    }
    return el;
  },

  appendChildren(parent, children = []) {
    if (!parent || !Array.isArray(children)) return;
    children.forEach(child => {
      if (child) parent.appendChild(child);
    });
  }
};

window.SanitizeService = SanitizeService;
