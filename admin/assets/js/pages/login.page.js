/**
 * Página: Login
 */
const LoginPage = {
  init() {
    if (typeof AuthService === 'undefined') {
      console.error('AuthService não foi carregado');
      return;
    }

    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', (e) => this.onSubmit(e));
  },

  async onSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    errorDiv.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando...';

    try {
      const result = await AuthService.login(email, password);

      if (!result.success) {
        throw new Error(result.error);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get('redirect');
      const safeRedirect = AuthService.getSafeRedirect(redirectParam);
      window.location.href = safeRedirect;

    } catch (err) {
      errorDiv.textContent = err.message || 'Erro ao fazer login';
      errorDiv.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => LoginPage.init());
window.LoginPage = LoginPage;
