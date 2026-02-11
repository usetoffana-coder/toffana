/**
 * ThemeService - tema claro/escuro para o painel
 */
const ThemeService = {
  currentTheme: 'dark',

  init() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    this.applyTheme(this.currentTheme);
  },

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.updateToggleIcon();
  },

  toggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    return newTheme;
  },

  updateToggleIcon() {
    const toggleBtn = document.getElementById('themeToggleAdmin');
    if (!toggleBtn) return;
    const icon = toggleBtn.querySelector('.theme-icon') || toggleBtn;
    icon.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
  },

  getCurrentTheme() {
    return this.currentTheme;
  }
};

window.ThemeService = ThemeService;
