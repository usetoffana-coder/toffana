/**
 * AdminShell - inicializa layout, menu mobile e hardening de links
 */
const AdminShell = {
  init() {
    if (window.ThemeService) {
      ThemeService.init();
      this.setupThemeToggle();
    }

    this.setupMobileMenu();
    this.hardenExternalLinks();
    this.captureGlobalErrors();
    this.setupAlertCenter();
  },

  setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggleAdmin');
    if (!themeToggle) return;
    themeToggle.addEventListener('click', () => ThemeService.toggle());
  },

  setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggleAdmin');
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('menuOverlayAdmin');
    const closeBtn = document.getElementById('btnCloseSidebar');

    if (!menuToggle || !sidebar) return;

    const toggleMenu = () => {
      const isOpen = sidebar.classList.contains('mobile-open');
      sidebar.classList.toggle('mobile-open');
      if (overlay) overlay.classList.toggle('active');
      document.body.style.overflow = isOpen ? '' : 'hidden';
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
    };

    menuToggle.addEventListener('click', toggleMenu);
    if (closeBtn) closeBtn.addEventListener('click', toggleMenu);
    if (overlay) overlay.addEventListener('click', toggleMenu);
  },

  hardenExternalLinks() {
    const links = document.querySelectorAll('a[target="_blank"]');
    links.forEach(link => {
      const rel = link.getAttribute('rel') || '';
      if (!/\bnoopener\b/i.test(rel)) {
        const nextRel = `${rel} noopener noreferrer`.trim();
        link.setAttribute('rel', nextRel);
      }
    });
  }
  ,
  captureGlobalErrors() {
    window.LastError = null;
    window.addEventListener('error', (e) => {
      window.LastError = e.error || e.message || 'Erro desconhecido';
    });
    window.addEventListener('unhandledrejection', (e) => {
      window.LastError = e.reason || 'Rejeição não tratada';
    });
  },

  async setupAlertCenter() {
    if (!window.AlertsService) return;

    const container = document.createElement('div');
    container.id = 'alertCenter';
    container.className = 'alert-center';

    const toggle = document.createElement('button');
    toggle.className = 'alert-center-toggle';
    toggle.textContent = 'Alertas';

    const panel = document.createElement('div');
    panel.className = 'alert-center-panel';
    panel.style.display = 'none';

    toggle.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    container.appendChild(toggle);
    container.appendChild(panel);
    document.body.appendChild(container);

    const dismissed = new Set(this.getDismissedAlerts());
    const alerts = await AlertsService.listarAlertas();
    const visible = alerts.filter(a => !dismissed.has(a.id));

    if (window.DomUtils) {
      DomUtils.clear(panel);
    } else {
      while (panel.firstChild) panel.removeChild(panel.firstChild);
    }
    if (visible.length === 0) {
      const p = document.createElement('p');
      p.className = 'text-secondary';
      p.textContent = 'Nenhum alerta ativo.';
      panel.appendChild(p);
      toggle.textContent = 'Alertas (0)';
      return;
    }

    toggle.textContent = `Alertas (${visible.length})`;

    visible.forEach(alerta => {
      const card = document.createElement('div');
      card.className = `alert-center-card ${alerta.severidade || 'info'}`;

      const title = document.createElement('strong');
      title.textContent = alerta.tipo || 'Alerta';

      const origin = document.createElement('small');
      origin.className = 'alert-origin';
      origin.textContent = `Origem: ${alerta.origem || 'geral'}`;

      const msg = document.createElement('p');
      msg.textContent = alerta.mensagem || '';

      const rec = document.createElement('p');
      rec.className = 'alert-recomendacao';
      rec.textContent = alerta.recomendacao || 'Corrigir agora';

      const actions = document.createElement('div');
      actions.className = 'alert-actions';

      if (alerta.actionUrl) {
        const link = document.createElement('a');
        link.href = alerta.actionUrl;
        link.className = 'btn btn-secondary';
        link.textContent = 'Corrigir agora';
        actions.appendChild(link);
      }

      const dismiss = document.createElement('button');
      dismiss.className = 'btn btn-secondary';
      dismiss.textContent = 'Dispensar';
      dismiss.addEventListener('click', () => {
        this.dismissAlert(alerta.id);
        card.remove();
      });
      actions.appendChild(dismiss);

      card.appendChild(title);
      card.appendChild(origin);
      card.appendChild(msg);
      card.appendChild(rec);
      card.appendChild(actions);
      panel.appendChild(card);
    });
  },

  getDismissedAlerts() {
    try {
      const raw = localStorage.getItem('alert_center_dismissed');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  dismissAlert(id) {
    if (!id) return;
    const current = new Set(this.getDismissedAlerts());
    current.add(id);
    localStorage.setItem('alert_center_dismissed', JSON.stringify([...current]));
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AdminShell.init();
});

window.AdminShell = AdminShell;


