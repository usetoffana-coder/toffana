/**
 * DOM and sanitization helpers (client-side safety)
 */

const DomUtils = {
  escapeHtml(value) {
    const text = String(value ?? '');
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  sanitizeText(value, maxLen) {
    let text = String(value ?? '').trim();
    if (maxLen && text.length > maxLen) {
      text = text.slice(0, maxLen);
    }
    return text;
  },

  sanitizeUrl(value) {
    const url = String(value ?? '').trim();
    if (!url) return '';

    if (url.startsWith('#') || url.startsWith('/')) {
      return url;
    }

    try {
      const parsed = new URL(url, window.location.origin);
      if (['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
        return parsed.href;
      }
    } catch {
      return '';
    }

    return '';
  },

  isExternalUrl(value) {
    try {
      const parsed = new URL(value, window.location.origin);
      return parsed.origin !== window.location.origin;
    } catch {
      return false;
    }
  },

  clear(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  }
};

window.DomUtils = DomUtils;

