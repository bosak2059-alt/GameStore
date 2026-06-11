import { t } from '../utils/i18n.js';
import { formatPrice } from '../utils/formatPrice.js';
import { store, authActions } from '../core/store.js';
import { navigate } from '../core/router.js';
import { auth } from '../core/auth.js';

export class ProfilePage {
  constructor() {
    this.user = auth.getCurrentUser();
    this.purchases = auth.getUserPurchases();
  }

  async render() {
    if (!this.user) return `<div class="not-found">${t('authRequired')}</div>`;
    const totalSpent = this.purchases.reduce((sum, p) => sum + p.total, 0);
    const totalPurchases = this.purchases.length;

    return `
      <div class="profile-page">
        <a href="/" data-link class="back-link">${t('backToCatalog')}</a>
        <section class="profile__header">
          <div class="profile__avatar">
            ${this.user.username.charAt(0).toUpperCase()}
            <div class="profile__avatar-ring"></div>
          </div>
          <div class="profile__info">
            <h1 class="profile__username">${this.user.username}</h1>
            <p class="profile__email">${this.user.email}</p>
            <p class="profile__joined">${t('joinedOn')} ${new Date(this.user.createdAt).toLocaleDateString(
              store.getState().locale === 'ru' ? 'ru-RU' : 'en-US',
              { year: 'numeric', month: 'long', day: 'numeric' }
            )}</p>
          </div>
        </section>
        <section class="profile__stats">
          <div class="stat-card stat-card--balance">
            <div class="stat-card__icon">💰</div>
            <div class="stat-card__label">${t('balance')}</div>
            <div class="stat-card__value">${formatPrice(this.user.balance || 0)}</div>
            <button class="stat-card__action" id="topup-balance-btn">${t('topupBalance')}</button>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon">🛍️</div>
            <div class="stat-card__label">${t('totalPurchases')}</div>
            <div class="stat-card__value">${totalPurchases}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon">💸</div>
            <div class="stat-card__label">${t('totalSpent')}</div>
            <div class="stat-card__value">${formatPrice(totalSpent)}</div>
          </div>
        </section>
        <section class="profile__purchases">
          <h2 class="section-title">${t('purchaseHistory')}</h2>
          ${this.purchases.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state__icon">📦</div>
              <p>${t('noPurchases')}</p>
              <a href="/" data-link class="btn btn--primary">${t('goToCatalog')}</a>
            </div>
          ` : `
            <div class="purchases-list">
              ${this.purchases.map(p => this.renderPurchaseItem(p)).join('')}
            </div>
          `}
        </section>
        <section class="profile__actions">
          <button class="btn btn--ghost btn--full" id="logout-profile-btn">
            <span></span><span>${t('logout')}</span>
          </button>
        </section>
      </div>
    `;
  }

  renderPurchaseItem(purchase) {
    const date = new Date(purchase.date);
    const dateStr = date.toLocaleDateString(
      store.getState().locale === 'ru' ? 'ru-RU' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
    const itemsHtml = purchase.items.map(item => `
      <div class="purchase-item__product">
        <img src="${item.image}" alt="${item.title}" class="purchase-item__img" />
        <div class="purchase-item__info">
          <div class="purchase-item__title">${item.title}</div>
          <div class="purchase-item__type">${purchase.type === 'topup' ? t('topupLabel') : t('gamePurchase')}</div>
        </div>
        <div class="purchase-item__price">${formatPrice(item.price)}</div>
      </div>
    `).join('');
    return `
      <article class="purchase-item">
        <div class="purchase-item__header">
          <div class="purchase-item__meta">
            <span class="purchase-item__id">#${purchase.id.slice(-6).toUpperCase()}</span>
            <span class="purchase-item__date">${dateStr}</span>
          </div>
          <div class="purchase-item__status">
            <span class="status-badge status-badge--success">${t('completed')}</span>
          </div>
        </div>
        <div class="purchase-item__body">${itemsHtml}</div>
        <div class="purchase-item__footer">
          <span class="purchase-item__total-label">${t('total')}:</span>
          <strong class="purchase-item__total">${formatPrice(purchase.total)}</strong>
        </div>
      </article>
    `;
  }

  mountEvents() {
    const topupBtn = document.getElementById('topup-balance-btn');
    const logoutBtn = document.getElementById('logout-profile-btn');
    if (topupBtn) topupBtn.addEventListener('click', () => navigate('/wallet-topup'));
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
      authActions.logout();
      navigate('/');
    });
  }
}