import { store, cartActions } from '../core/store.js';
import { formatPrice } from '../utils/formatPrice.js';
import { t } from '../utils/i18n.js';

export class CartModal {
  render() {
    return `
      <div class="cart-modal" id="cart-modal">
        <div class="cart-modal__backdrop" data-close></div>
        <div class="cart-modal__content">
          <div class="cart-modal__header">
            <h3>${t('cart')}</h3>
            <button class="cart-modal__close" data-close aria-label="Close">✕</button>
          </div>
          <div class="cart-modal__body" id="cart-modal-body"></div>
          <div class="cart-modal__footer">
            <div class="cart-modal__total">
              <span>${t('total')}:</span>
              <strong id="cart-total">${formatPrice(0)}</strong>
            </div>
            <button class="btn btn--primary btn--full" id="checkout-btn">${t('checkout')}</button>
          </div>
        </div>
      </div>
    `;
  }

  mountEvents() {
    const modal = document.getElementById('cart-modal');
    const body = document.getElementById('cart-modal-body');
    const totalEl = document.getElementById('cart-total');

    const updateContent = (state) => {
      if (state.cart.length === 0) {
        body.innerHTML = `<p class="empty-cart">${t('cartEmpty')}</p>`;
        totalEl.textContent = formatPrice(0);
        return;
      }
      body.innerHTML = state.cart.map((g) => `
        <div class="cart-item" data-id="${g.id}">
          <img src="${g.image}" alt="${g.title}" />
          <div class="cart-item__info">
            <div class="cart-item__title">${g.title}</div>
            <div class="cart-item__price">${formatPrice(g.price)}</div>
          </div>
          <button class="cart-item__remove" data-remove="${g.id}" aria-label="${t('remove')}">🗑</button>
        </div>
      `).join('');
      const total = state.cart.reduce((sum, g) => sum + g.price, 0);
      totalEl.textContent = formatPrice(total);
    };

    store.subscribe(updateContent);

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-cart]')) modal.classList.add('cart-modal--open');
      if (e.target.closest('[data-close]')) modal.classList.remove('cart-modal--open');
      const removeBtn = e.target.closest('[data-remove]');
      if (removeBtn) cartActions.removeFromCart(Number(removeBtn.dataset.remove));
    });

    document.getElementById('checkout-btn').addEventListener('click', () => {
      if (store.getState().cart.length === 0) return;
      import('../components/Toast.js').then(({ toast }) => {
        toast.success(t('checkoutSuccess'), 4000);
      });
      cartActions.clearCart();
      modal.classList.remove('cart-modal--open');
    });
  }
}