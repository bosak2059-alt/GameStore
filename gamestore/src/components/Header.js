import { store, settingsActions, authActions } from '../core/store.js';
import { t } from '../utils/i18n.js';
import { getAvailableCurrencies, getCurrency } from '../utils/formatPrice.js';

export class Header {
  render() {
    const { locale, cart, user } = store.getState();
    const currencies = getAvailableCurrencies();
    const currentCurrency = getCurrency();
    const isAuthenticated = !!user;

    return `
      <div class="header__inner">
        <a href="/" data-link class="header__logo">
          <span class="logo-icon">🎮</span>
          <span class="logo-text">GameStore</span>
        </a>
        <nav class="header__nav">
          <a href="/" data-link class="nav-link">${t('catalog')}</a>
          <a href="/topup" data-link class="nav-link nav-link--topup">⚡ ${t('topup')}</a>
          <a href="/cart" data-link class="nav-link nav-link--cart">
            🛒 ${t('cart')}
            <span class="cart-badge" id="cart-badge">${cart.length}</span>
          </a>
          ${isAuthenticated ? `
            <div class="user-menu" id="user-menu">
              <button class="user-menu__trigger" id="user-menu-btn">
                <span class="user-avatar">${user.username.charAt(0).toUpperCase()}</span>
                <span class="user-name">${user.username}</span>
                <span class="user-menu__arrow">▾</span>
              </button>
              <div class="user-menu__dropdown" id="user-dropdown">
                <div class="user-menu__info">
                  <div class="user-avatar user-avatar--big">${user.username.charAt(0).toUpperCase()}</div>
                  <div>
                    <div class="user-menu__username">${user.username}</div>
                    <div class="user-menu__email">${user.email}</div>
                  </div>
                </div>
                <div class="user-menu__divider"></div>
                <a href="/profile" data-link class="user-menu__item">
                  <span>👤</span><span>${t('profile')}</span>
                </a>
                <button class="user-menu__item" id="logout-btn">
                  <span></span><span>${t('logout')}</span>
                </button>
              </div>
            </div>
          ` : `<a href="/login" data-link class="nav-link">${t('login')}</a>`}
          <select class="header-select" id="locale-select" aria-label="${t('language')}">
            <option value="ru" ${locale === 'ru' ? 'selected' : ''}>🇷🇺 Русский</option>
            <option value="en" ${locale === 'en' ? 'selected' : ''}>🇬🇧 English</option>
            <option value="ja" ${locale === 'ja' ? 'selected' : ''}>🇯🇵 日本語</option>
            <option value="hy" ${locale === 'hy' ? 'selected' : ''}>🇦🇲 Հայերեն</option>
            <option value="es" ${locale === 'es' ? 'selected' : ''}>🇪🇸 Español</option>
            <option value="de" ${locale === 'de' ? 'selected' : ''}>🇩🇪 Deutsch</option>
            <option value="fr" ${locale === 'fr' ? 'selected' : ''}>🇫🇷 Français</option>
          </select>
          <select class="header-select" id="currency-select" aria-label="${t('currency')}">
            ${currencies.map(c => `<option value="${c}" ${c === currentCurrency ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
          <button class="theme-toggle" id="theme-toggle" aria-label="${t('theme')}">🌙</button>
        </nav>
      </div>
    `;
  }

  mountEvents() {
    store.subscribe((state) => {
      const badge = document.getElementById('cart-badge');
      if (badge) {
        badge.textContent = state.cart.length;
        badge.classList.add('cart-badge--bounce');
        setTimeout(() => badge.classList.remove('cart-badge--bounce'), 600);
      }
    });

    const themeBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('gamestore_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.add('theme-transitioning');
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('gamestore_theme', next);
      themeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
      setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 500);
    });

    document.getElementById('locale-select').addEventListener('change', (e) => {
      settingsActions.setLocale(e.target.value);
      this.rerenderHeader();
      import('../core/router.js').then(({ rerender }) => rerender());
    });

    document.getElementById('currency-select').addEventListener('change', (e) => {
      settingsActions.setCurrency(e.target.value);
      import('../core/router.js').then(({ rerender }) => rerender());
    });

    const userBtn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');
    if (userBtn && dropdown) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('user-menu__dropdown--open');
      });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#user-menu')) dropdown.classList.remove('user-menu__dropdown--open');
      });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        authActions.logout();
        this.rerenderHeader();
        import('../core/router.js').then(({ navigate }) => navigate('/'));
      });
    }
  }

  rerenderHeader() {
    const headerEl = document.getElementById('site-header');
    if (!headerEl) return;
    headerEl.innerHTML = this.render();
    this.mountEvents();
  }
}