import { formatPrice } from '../utils/formatPrice.js';
import { cartActions } from '../core/store.js';
import { t } from '../utils/i18n.js';

export class GameCard {
  constructor(game) { this.game = game; }

  render() {
    const inCart = cartActions.isInCart(this.game.id);
    const discount = this.game.oldPrice
      ? Math.round(((this.game.oldPrice - this.game.price) / this.game.oldPrice) * 100)
      : 0;

    return `
      <article class="game-card" data-id="${this.game.id}">
        <a href="/game/${this.game.id}" data-link class="game-card__media">
          <img src="${this.game.image}" alt="${this.game.title}" loading="lazy" />
          ${discount ? `<span class="game-card__discount">-${discount}%</span>` : ''}
          ${this.game.price === 0 ? `<span class="game-card__free">${t('free')}</span>` : ''}
        </a>
        <div class="game-card__body">
          <div class="game-card__tags">
            ${this.game.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <a href="/game/${this.game.id}" data-link class="game-card__title">${this.game.title}</a>
          <div class="game-card__footer">
            <div class="game-card__price">
              ${this.game.oldPrice ? `<span class="price-old">${formatPrice(this.game.oldPrice)}</span>` : ''}
              <span class="price-current">${formatPrice(this.game.price)}</span>
            </div>
            <button class="btn btn--primary add-to-cart-btn" data-id="${this.game.id}" ${inCart ? 'disabled' : ''}>
              ${inCart ? t('inCart') : t('addToCart')}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  mountEvents() {
    const btn = document.querySelector(`.add-to-cart-btn[data-id="${this.game.id}"]`);
    if (!btn) return;
    btn.addEventListener('click', () => {
      cartActions.addToCart(this.game);
      btn.textContent = t('inCart');
      btn.disabled = true;
    });
  }
}