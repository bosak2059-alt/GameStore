import { HomePage } from '../pages/HomePage.js';
import { GameDetailsPage } from '../pages/GameDetailsPage.js';
import { CartPage } from '../pages/CartPage.js';
import { TopUpPage } from '../pages/TopUpPage.js';
import { WalletTopUpPage } from '../pages/WalletTopUpPage.js'; // ← НОВОЕ
import { AuthPage } from '../pages/AuthPage.js';
import { ProfilePage } from '../pages/ProfilePage.js';
import { Header } from '../components/Header.js';
import { t } from '../utils/i18n.js';
import { auth } from '../core/auth.js';

const routes = [
  { path: '/', component: HomePage },
  { path: '/game/:id', component: GameDetailsPage },
  { path: '/cart', component: CartPage },
  { path: '/topup', component: TopUpPage, authRequired: true },
  { path: '/wallet-topup', component: WalletTopUpPage, authRequired: true }, // ← НОВОЕ
  { path: '/profile', component: ProfilePage, authRequired: true },
  { path: '/login', component: () => new AuthPage({ mode: 'login' }) },
  { path: '/register', component: () => new AuthPage({ mode: 'register' }) },
];

function normalizePath(path) {
  if (path.includes('index.html')) return '/';
  if (path === '' || path === '/') return '/';
  return path;
}

function matchRoute(path) {
  path = normalizePath(path);
  if (path === '/') return { component: routes[0].component, params: {} };
  for (const route of routes) {
    const paramNames = [];
    const pattern = route.path.replace(/:(\w+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    const regex = new RegExp(`^${pattern}$`);
    const match = path.match(regex);
    if (match) {
      const params = {};
      paramNames.forEach((name, i) => (params[name] = match[i + 1]));
      return { component: route.component, params, authRequired: route.authRequired };
    }
  }
  return null;
}

function createComponent(Component, params) {
  const str = Component.toString();
  if (typeof Component === 'function' && !str.startsWith('class ')) {
    return Component(params);
  }
  return new Component(params);
}

let currentRenderPromise = null;

export async function render() {
  const path = window.location.pathname;
  const app = document.getElementById('app');

  if (!document.getElementById('site-header')) {
    const header = new Header();
    app.innerHTML = '';
    const headerEl = document.createElement('header');
    headerEl.id = 'site-header';
    headerEl.innerHTML = header.render();
    app.appendChild(headerEl);
    header.mountEvents();

    const main = document.createElement('main');
    main.id = 'main-content';
    main.className = 'main-content';
    app.appendChild(main);
  }

  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="loader"><span class="spinner"></span>${t('loading')}</div>`;

  const matched = matchRoute(path);

  if (matched && matched.authRequired && !auth.isAuthenticated()) {
    main.innerHTML = `
      <div class="auth-required">
        <div class="auth-required__icon">🔒</div>
        <h2>${t('authRequired')}</h2>
        <p>${t('authRequiredText')}</p>
        <a href="/login" data-link class="btn btn--primary btn--big">${t('login')}</a>
      </div>
    `;
    return;
  }

  if (!matched) {
    main.innerHTML = `<div class="not-found">${t('notFound')}</div>`;
    return;
  }

  const page = createComponent(matched.component, matched.params);
  const html = await page.render();
  main.innerHTML = html;
  if (typeof page.mountEvents === 'function') page.mountEvents();
  window.scrollTo(0, 0);
}

export function rerender() {
  if (currentRenderPromise) return;
  currentRenderPromise = render().finally(() => { currentRenderPromise = null; });
}

export function navigate(path) {
  history.pushState({}, '', path);
  render();
}

export function initRouter() {
  window.addEventListener('popstate', render);
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-link]');
    if (link) {
      e.preventDefault();
      navigate(link.getAttribute('href'));
    }
  });
  render();
}