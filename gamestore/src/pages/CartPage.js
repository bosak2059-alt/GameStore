import { store, cartActions, purchaseActions, walletActions } from '../core/store.js';
import { formatPrice } from '../utils/formatPrice.js';
import { t } from '../utils/i18n.js';
import { auth } from '../core/auth.js';
import { toast } from '../components/Toast.js';

export class CartPage {
  render() {
    const user = auth.getCurrentUser();
    const balance = user ? walletActions.getBalance() : 0;

    return `
      <div class="cart-page">
        <h1 class="cart-page__title">${t('yourCart')}</h1>
        ${user ? `
          <div class="wallet-banner">
            <div class="wallet-banner__icon">💰</div>
            <div class="wallet-banner__info">
              <div class="wallet-banner__label">${t('balance')}</div>
              <div class="wallet-banner__amount">${formatPrice(balance)}</div>
            </div>
            <a href="/profile" data-link class="btn btn--ghost btn--small">${t('topupBalance')}</a>
          </div>
        ` : ''}
        <div class="cart-page__layout">
          <div class="cart-page__items" id="cart-items"></div>
          <aside class="cart-page__summary">
            <h3>${t('total')}</h3>
            <div class="summary-row">
              <span>${t('items')}:</span>
              <span id="summary-count">0</span>
            </div>
            <div class="summary-row summary-row--total">
              <span>${t('total')}:</span>
              <strong id="summary-total">${formatPrice(0)}</strong>
            </div>
            ${user && balance > 0 ? `
              <div class="payment-method-selector">
                <label class="payment-option">
                  <input type="radio" name="payment" value="wallet" checked />
                  <span class="payment-option__icon">💰</span>
                  <span class="payment-option__text">${t('balance')} (${formatPrice(balance)})</span>
                </label>
                <label class="payment-option">
                  <input type="radio" name="payment" value="card" />
                  <span class="payment-option__icon">💳</span>
                  <span class="payment-option__text">${t('paymentCard')}</span>
                </label>
              </div>
            ` : ''}
            <button class="btn btn--primary btn--full" id="checkout-page-btn">
              <span></span><span>${t('checkout')}</span>
            </button>
            <button class="btn btn--ghost btn--full" id="clear-cart-btn">${t('clearCart')}</button>
          </aside>
        </div>
      </div>
    `;
  }

  mountEvents() {
    const itemsEl = document.getElementById('cart-items');
    const countEl = document.getElementById('summary-count');
    const totalEl = document.getElementById('summary-total');
    const checkoutBtn = document.getElementById('checkout-page-btn');
    const clearBtn = document.getElementById('clear-cart-btn');

    const renderItems = (state) => {
      const { cart } = state;
      countEl.textContent = cart.length;
      const total = cart.reduce((s, g) => s + g.price, 0);
      totalEl.textContent = formatPrice(total);

      if (cart.length === 0) {
        itemsEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-state__icon">🛒</div>
            <h3>${t('emptyCart')}</h3>
            <p>Добавьте игры из каталога</p>
            <a href="/" data-link class="btn btn--primary">${t('goToCatalog')}</a>
          </div>
        `;
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
      }

      itemsEl.innerHTML = cart.map((g) => `
        <article class="cart-card" data-id="${g.id}">
          <img src="${g.image}" alt="${g.title}" class="cart-card__img" />
          <div class="cart-card__info">
            <a href="/game/${g.id}" data-link class="cart-card__title">${g.title}</a>
            <div class="cart-card__tags">
              ${g.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
            </div>
          </div>
          <div class="cart-card__price">${formatPrice(g.price)}</div>
          <button class="btn btn--ghost btn--small" data-remove="${g.id}">${t('remove')}</button>
        </article>
      `).join('');
      if (checkoutBtn) checkoutBtn.disabled = false;
    };

    store.subscribe(renderItems);

    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', async () => {
        const cart = store.getState().cart;
        if (cart.length === 0) { toast.warning('Корзина пуста'); return; }

        const user = auth.getCurrentUser();
        const total = cart.reduce((s, g) => s + g.price, 0);
        const paymentMethodEl = document.querySelector('input[name="payment"]:checked');
        const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'card';

        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<span class="spinner"></span><span>Обработка...</span>';

        await new Promise(resolve => setTimeout(resolve, 1000));

        if (user) {
          if (paymentMethod === 'wallet') {
            const walletResult = walletActions.pay(total);
            if (!walletResult.success) {
              checkoutBtn.disabled = false;
              checkoutBtn.innerHTML = `<span></span><span>${t('checkout')}</span>`;
              return;
            }
          }
          purchaseActions.addPurchase({
            type: 'games',
            items: cart.map((g) => ({ id: g.id, title: g.title, image: g.image, price: g.price })),
            total,
            paymentMethod,
          });
          cartActions.clearCart();
          toast.success(`Заказ оформлен! ${cart.length} игр добавлено в библиотеку 🎮`, 5000);
          setTimeout(() => import('../core/router.js').then(({ navigate }) => navigate('/profile')), 2000);
        } else {
          cartActions.clearCart();
          toast.success('Заказ оформлен! Спасибо за покупку! 🎉', 4000);
          setTimeout(() => import('../core/router.js').then(({ navigate }) => navigate('/login')), 2000);
        }

        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = `<span></span><span>${t('checkout')}</span>`;
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const cart = store.getState().cart;
        if (cart.length === 0) return;
        if (confirm(`${t('confirmClear')} (${cart.length})`)) {
          cartActions.clearCart();
          toast.info('Корзина очищена');
        }
      });
    }

    itemsEl.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-remove]');
      if (removeBtn) {
        const gameId = Number(removeBtn.dataset.remove);
        const game = store.getState().cart.find(g => g.id === gameId);
        cartActions.removeFromCart(gameId);
        if (game) toast.info(`${game.title} удалена из корзины`);
      }
    });
  }
}