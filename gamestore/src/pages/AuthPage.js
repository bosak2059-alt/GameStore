import { t } from '../utils/i18n.js';
import { authActions } from '../core/store.js';
import { navigate } from '../core/router.js';

export class AuthPage {
  constructor(params) {
    this.mode = params.mode || 'login';
    this.formData = { email: '', password: '', passwordConfirm: '', username: '' };
    this.errors = {};
    this.isLoading = false;
  }

  async render() {
    const isLogin = this.mode === 'login';
    return `
      <div class="auth-page">
        <div class="auth__container">
          <div class="auth__bg">
            <div class="auth__bg-circle auth__bg-circle--1"></div>
            <div class="auth__bg-circle auth__bg-circle--2"></div>
            <div class="auth__bg-circle auth__bg-circle--3"></div>
          </div>
          <div class="auth__card">
            <div class="auth__header">
              <div class="auth__logo">🎮</div>
              <h1 class="auth__title">${isLogin ? t('loginTitle') : t('registerTitle')}</h1>
              <p class="auth__subtitle">${isLogin ? t('loginSubtitle') : t('registerSubtitle')}</p>
            </div>
            <div class="auth__tabs">
              <button class="auth__tab ${isLogin ? 'auth__tab--active' : ''}" data-mode="login">${t('login')}</button>
              <button class="auth__tab ${!isLogin ? 'auth__tab--active' : ''}" data-mode="register">${t('register')}</button>
              <div class="auth__tab-indicator" style="left: ${isLogin ? '0' : '50%'}"></div>
            </div>
            <form class="auth__form" id="auth-form" novalidate>
              <div class="form-group ${this.mode === 'register' ? '' : 'hidden'}" id="username-group">
                <label class="form-label">${t('username')}</label>
                <div class="input-wrapper">
                  <span class="input-icon">👤</span>
                  <input type="text" name="username" class="form-input" placeholder="${t('usernamePlaceholder')}" value="${this.formData.username}" autocomplete="username" />
                </div>
                <div class="form-error" id="error-username">${this.errors.username || ''}</div>
              </div>
              <div class="form-group">
                <label class="form-label">${t('email')}</label>
                <div class="input-wrapper">
                  <span class="input-icon">📧</span>
                  <input type="email" name="email" class="form-input" placeholder="${t('emailPlaceholder')}" value="${this.formData.email}" autocomplete="email" />
                </div>
                <div class="form-error" id="error-email">${this.errors.email || ''}</div>
              </div>
              <div class="form-group">
                <label class="form-label">${t('password')}</label>
                <div class="input-wrapper">
                  <span class="input-icon">🔒</span>
                  <input type="password" name="password" class="form-input" placeholder="${t('passwordPlaceholder')}" value="${this.formData.password}" autocomplete="${isLogin ? 'current-password' : 'new-password'}" />
                  <button type="button" class="password-toggle" data-toggle="password">👁</button>
                </div>
                <div class="form-error" id="error-password">${this.errors.password || ''}</div>
                ${!isLogin ? `<div class="password-strength" id="password-strength"></div>` : ''}
              </div>
              <div class="form-group ${this.mode === 'register' ? '' : 'hidden'}" id="password-confirm-group">
                <label class="form-label">${t('passwordConfirm')}</label>
                <div class="input-wrapper">
                  <span class="input-icon">🔒</span>
                  <input type="password" name="passwordConfirm" class="form-input" placeholder="${t('passwordConfirmPlaceholder')}" value="${this.formData.passwordConfirm}" autocomplete="new-password" />
                </div>
                <div class="form-error" id="error-passwordConfirm">${this.errors.passwordConfirm || ''}</div>
              </div>
              <div class="auth__global-error" id="global-error"></div>
              <button type="submit" class="btn btn--primary btn--big btn--full auth__submit" id="auth-submit-btn" ${this.isLoading ? 'disabled' : ''}>
                ${this.isLoading ? `<span class="spinner"></span> ${t('processing')}` : (isLogin ? t('loginButton') : t('registerButton'))}
              </button>
            </form>
            <div class="auth__footer">
              ${isLogin ? `${t('noAccount')} <a href="/register" data-link>${t('registerNow')}</a>` : `${t('haveAccount')} <a href="/login" data-link>${t('loginNow')}</a>`}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  mountEvents() {
    const form = document.getElementById('auth-form');
    const tabs = document.querySelectorAll('.auth__tab');

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const newMode = tab.dataset.mode;
        if (newMode === this.mode) return;
        this.errors = {};
        navigate(`/${newMode}`);
      });
    });

    const footerLink = document.querySelector('.auth__footer a');
    if (footerLink) {
      footerLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.errors = {};
        navigate(this.mode === 'login' ? '/register' : '/login');
      });
    }

    form.querySelectorAll('input[name]').forEach(input => {
      input.addEventListener('input', (e) => {
        this.formData[e.target.name] = e.target.value;
        const errorEl = document.getElementById(`error-${e.target.name}`);
        if (errorEl) errorEl.textContent = '';
        if (e.target.name === 'password' && this.mode === 'register') this.updatePasswordStrength(e.target.value);
      });
    });

    document.querySelectorAll('.password-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  updatePasswordStrength(password) {
    const el = document.getElementById('password-strength');
    if (!el) return;
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    const levels = [
      { text: '', color: '' },
      { text: t('weak'), color: '#ef4444' },
      { text: t('weak'), color: '#f97316' },
      { text: t('medium'), color: '#eab308' },
      { text: t('strong'), color: '#22c55e' },
      { text: t('strong'), color: '#10b981' },
    ];
    const level = levels[strength];
    el.innerHTML = `<div class="strength-bar"><div class="strength-bar__fill" style="width: ${(strength / 5) * 100}%; background: ${level.color}"></div></div><span style="color: ${level.color}; font-size: 12px;">${level.text}</span>`;
  }

  validate() {
    this.errors = {};
    const { email, password, passwordConfirm, username } = this.formData;
    const isLogin = this.mode === 'login';
    if (!email) this.errors.email = t('emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) this.errors.email = t('emailInvalid');
    if (!password) this.errors.password = t('passwordRequired');
    else if (password.length < 6) this.errors.password = t('passwordTooShort');
    if (!isLogin) {
      if (!username) this.errors.username = t('usernameRequired');
      else if (username.length < 3) this.errors.username = t('usernameTooShort');
      if (password !== passwordConfirm) this.errors.passwordConfirm = t('passwordMismatch');
    }
    Object.keys(this.errors).forEach(key => {
      const el = document.getElementById(`error-${key}`);
      if (el) el.textContent = this.errors[key];
    });
    return Object.keys(this.errors).length === 0;
  }

  async handleSubmit() {
    if (!this.validate()) return;
    this.isLoading = true;
    const btn = document.getElementById('auth-submit-btn');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${t('processing')}`;
    await new Promise(r => setTimeout(r, 800));

    let result;
    if (this.mode === 'login') {
      result = authActions.login({ email: this.formData.email, password: this.formData.password });
    } else {
      result = authActions.register({
        email: this.formData.email,
        password: this.formData.password,
        username: this.formData.username,
      });
    }

    this.isLoading = false;
    if (!result.success) {
      btn.disabled = false;
      btn.textContent = this.mode === 'login' ? t('loginButton') : t('registerButton');
      return;
    }
    btn.innerHTML = `<span class="success-check">✓</span> ${t('success')}`;
    btn.classList.add('btn--success');
    setTimeout(() => navigate('/'), 600);
  }
}