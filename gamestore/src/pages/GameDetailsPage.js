import { cartActions } from '../core/store.js';
import { formatPrice } from '../utils/formatPrice.js';
import { CartModal } from '../components/CartModal.js';
import { t } from '../utils/i18n.js';

export class GameDetailsPage {
  constructor(params) { this.gameId = Number(params.id); this.game = null; }

  async render() {
    const res = await fetch('/src/data/games.json');
    const games = await res.json();
    this.game = games.find((g) => g.id === this.gameId);
    if (!this.game) return `<div class="not-found">${t('gameNotFound')}</div>`;

    const inCart = cartActions.isInCart(this.game.id);
    const discount = this.game.oldPrice
      ? Math.round(((this.game.oldPrice - this.game.price) / this.game.oldPrice) * 100)
      : 0;

    return `
      <div class="details">
        <a href="/" data-link class="back-link">${t('backToCatalog')}</a>
        <div class="details__grid">
          <div class="details__media"><img src="${this.game.image}" alt="${this.game.title}" /></div>
          <div class="details__info">
            <div class="details__tags">
              ${this.game.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <h1 class="details__title">${this.game.title}</h1>
            <div class="details__meta">
              <span>⭐ ${this.game.rating}</span>
              <span>🏢 ${t('developer')}: ${this.game.developer}</span>
            </div>
            <p class="details__desc">${this.game.description}</p>
            <div class="details__price-box">
              ${this.game.oldPrice ? `<span class="price-old">${formatPrice(this.game.oldPrice)}</span>` : ''}
              ${discount ? `<span class="discount-badge">-${discount}%</span>` : ''}
              <span class="price-current price-current--big">${formatPrice(this.game.price)}</span>
            </div>
            <div class="details__actions">
              <button class="btn btn--primary btn--big" id="buy-btn" ${inCart ? 'disabled' : ''}>
                ${inCart ? t('alreadyInCart') : t('buy')}
              </button>
              <button class="btn btn--ghost btn--big" data-open-cart>${t('goToCart')}</button>
            </div>
          </div>
        </div>
        ${new CartModal().render()}
      </div>
    `;
  }

  mountEvents() {
    const btn = document.getElementById('buy-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        cartActions.addToCart(this.game);
        btn.textContent = t('alreadyInCart');
        btn.disabled = true;
      });
    }
    new CartModal().mountEvents();
  }
}