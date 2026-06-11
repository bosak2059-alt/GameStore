import { t } from '../utils/i18n.js';
import { formatPrice } from '../utils/formatPrice.js';
import { navigate } from '../core/router.js';
import { auth } from '../core/auth.js';
import { authActions, walletActions } from '../core/store.js';
import { toast } from '../components/Toast.js';

const POPULAR_AMOUNTS = [100, 300, 500, 1000, 2000, 5000];
const MIN_AMOUNT = 50;
const MAX_AMOUNT = 50000;
const PAYMENT_METHODS = [
  { id: 'card', icon: '💳', nameKey: 'paymentCard' },
  { id: 'sbp', icon: '🏦', nameKey: 'paymentSbp' },
  { id: 'crypto', icon: '₿', nameKey: 'paymentCrypto' },
  { id: 'qiwi', icon: '🥝', nameKey: 'paymentQiwi' },
];

export class WalletTopUpPage {
  constructor() {
    this.selectedAmount = 1000;
    this.customAmount = '';
    this.paymentMethod = 'card';
    this.isProcessing = false;
    this.isSuccess = false;
    this.user = auth.getCurrentUser();
  }

  async render() {
    if (!this.user) {
      return `<div class="not-found">${t('authRequired')}</div>`;
    }

    const currentBalance = this.user.balance || 0;

    return `
      <div class="topup">
        <a href="/profile" data-link class="back-link">← ${t('profile')}</a>
        <section class="topup__hero">
          <div class="topup__hero-icon"></div>
          <h1 class="topup__title">${t('walletTopupTitle')}</h1>
          <p class="topup__subtitle">${t('walletTopupSubtitle')}</p>
          <div class="current-balance-badge">
            <span class="current-balance-badge__label">${t('currentBalance')}:</span>
            <span class="current-balance-badge__amount">${formatPrice(currentBalance)}</span>
          </div>
        </section>
        <div class="topup__layout">
          <div class="topup__form">
            <div class="form-section">
              <label class="form-label">${t('amountLabel')}</label>
              <div class="amounts-grid" id="amounts-grid">
                ${POPULAR_AMOUNTS.map(amount => `
                  <button class="amount-btn ${amount === this.selectedAmount && !this.customAmount ? 'amount-btn--active' : ''}" data-amount="${amount}">
                    ${formatPrice(amount)}
                  </button>
                `).join('')}
              </div>
              <div class="custom-amount">
                <input type="number" id="custom-amount-input" class="form-input" placeholder="${t('customAmountPlaceholder')}" min="${MIN_AMOUNT}" max="${MAX_AMOUNT}" value="${this.customAmount}" />
                <span class="custom-amount__suffix">${t('rub')}</span>
              </div>
              <div class="form-hint">${t('amountHint')}</div>
              <div class="form-error" id="amount-error"></div>
            </div>
            <div class="form-section">
              <label class="form-label">${t('paymentMethodLabel')}</label>
              <div class="payment-methods">
                ${PAYMENT_METHODS.map(method => `
                  <label class="payment-method ${method.id === this.paymentMethod ? 'payment-method--active' : ''}">
                    <input type="radio" name="payment-method" value="${method.id}" ${method.id === this.paymentMethod ? 'checked' : ''} class="payment-method__input" />
                    <span class="payment-method__icon">${method.icon}</span>
                    <span class="payment-method__name">${t(method.nameKey)}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>
          <aside class="topup__summary">
            <h3 class="summary-title">${t('orderSummary')}</h3>
            <div class="summary-row"><span>${t('amountLabel')}</span><span class="summary-value" id="summary-amount">${formatPrice(this.selectedAmount)}</span></div>
            <div class="summary-row"><span>${t('paymentMethodLabel')}</span><span class="summary-value" id="summary-method">${t(PAYMENT_METHODS.find(m => m.id === this.paymentMethod).nameKey)}</span></div>
            <div class="summary-divider"></div>
            <div class="summary-row summary-row--total"><span>${t('totalToPay')}</span><strong class="summary-total" id="summary-total">${formatPrice(this.selectedAmount)}</strong></div>
            <button class="btn btn--primary btn--big btn--full" id="pay-btn" disabled>${t('payButton')}</button>
            <div class="topup__security">
              <span> ${t('securePayment')}</span>
              <span>⚡ ${t('instantDelivery')}</span>
            </div>
          </aside>
        </div>
        ${this.isSuccess ? this.renderSuccessModal() : ''}
      </div>
    `;
  }

  renderSuccessModal() {
    return `
      <div class="success-modal success-modal--open">
        <div class="success-modal__backdrop"></div>
        <div class="success-modal__content">
          <div class="success-modal__icon">✅</div>
          <h2 class="success-modal__title">${t('walletTopupSuccessTitle')}</h2>
          <p class="success-modal__text">${t('walletTopupSuccessText', { amount: formatPrice(this.selectedAmount) })}</p>
          <p class="success-modal__note">${t('walletTopupSuccessNote')}</p>
          <div class="success-modal__actions">
            <button class="btn btn--primary btn--big" id="success-close-btn">${t('backToProfile')}</button>
          </div>
        </div>
      </div>
    `;
  }

  mountEvents() {
    const customAmountInput = document.getElementById('custom-amount-input');
    const amountsGrid = document.getElementById('amounts-grid');
    const payBtn = document.getElementById('pay-btn');

    amountsGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.amount-btn');
      if (!btn) return;
      this.selectedAmount = Number(btn.dataset.amount);
      this.customAmount = '';
      customAmountInput.value = '';
      this.updateAmountButtons();
      this.validate();
      this.updateSummary();
    });

    customAmountInput.addEventListener('input', (e) => {
      this.customAmount = e.target.value;
      this.selectedAmount = Number(e.target.value) || 0;
      this.updateAmountButtons();
      this.validate();
      this.updateSummary();
    });

    document.querySelectorAll('.payment-method__input').forEach(input => {
      input.addEventListener('change', (e) => {
        this.paymentMethod = e.target.value;
        document.querySelectorAll('.payment-method').forEach(el => {
          const input = el.querySelector('input');
          el.classList.toggle('payment-method--active', input.checked);
        });
        this.updateSummary();
      });
    });

    payBtn.addEventListener('click', () => this.handlePay());
    const closeBtn = document.getElementById('success-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => navigate('/profile'));
    this.validate();
    this.updateSummary();
  }

  updateAmountButtons() {
    document.querySelectorAll('.amount-btn').forEach(btn => {
      const amount = Number(btn.dataset.amount);
      btn.classList.toggle('amount-btn--active', amount === this.selectedAmount && !this.customAmount);
    });
  }

  validate() {
    const amountError = document.getElementById('amount-error');
    const payBtn = document.getElementById('pay-btn');
    let isValid = true;

    if (!this.selectedAmount || this.selectedAmount < MIN_AMOUNT) {
      if (amountError) amountError.textContent = t('amountTooSmall');
      isValid = false;
    } else if (this.selectedAmount > MAX_AMOUNT) {
      if (amountError) amountError.textContent = t('amountTooBig');
      isValid = false;
    } else if (amountError) {
      amountError.textContent = '';
    }

    if (payBtn) {
      payBtn.disabled = !isValid || this.isProcessing;
      if (this.isProcessing) payBtn.textContent = t('processing');
      else payBtn.textContent = t('payButton');
    }
    return isValid;
  }

  updateSummary() {
    const amountEl = document.getElementById('summary-amount');
    const methodEl = document.getElementById('summary-method');
    const totalEl = document.getElementById('summary-total');
    if (amountEl) amountEl.textContent = formatPrice(this.selectedAmount);
    if (methodEl) {
      const method = PAYMENT_METHODS.find(m => m.id === this.paymentMethod);
      methodEl.textContent = method ? t(method.nameKey) : '';
    }
    if (totalEl) totalEl.textContent = formatPrice(this.selectedAmount);
  }

  async handlePay() {
    if (!this.validate()) return;
    this.isProcessing = true;
    this.validate();
    await new Promise(resolve => setTimeout(resolve, 1500));

    const user = auth.getCurrentUser();
    if (user) {
      // Зачисляем баланс в магазин (не Steam!)
      auth.addBalance(user.id, this.selectedAmount);
      
      // Сохраняем в историю покупок
      auth.addPurchase({
        type: 'balance_topup',
        items: [{ 
          id: 'balance_topup', 
          title: `${t('walletTopupLabel')} — ${formatPrice(this.selectedAmount)}`, 
          image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600',
          price: this.selectedAmount 
        }],
        total: this.selectedAmount,
        paymentMethod: this.paymentMethod,
      });
      
      authActions.refreshUser();
      toast.success(`Баланс магазина пополнен на ${formatPrice(this.selectedAmount)}! 💰`, 5000);
    }

    this.isProcessing = false;
    this.isSuccess = true;
    const main = document.getElementById('main-content');
    main.innerHTML = await this.render();
    this.mountEvents();
  }
}