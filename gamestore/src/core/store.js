import { setLocale, getLocale } from '../utils/i18n.js';
import { setCurrency, getCurrency, formatPrice } from '../utils/formatPrice.js';
import { auth } from './auth.js';
import { toast } from '../components/Toast.js';

export class Store {
  constructor(initialState) {
    this.state = initialState;
    this.listeners = new Set();
  }
  getState() { return this.state; }
  setState(partial) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }
  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }
  notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }
}

const savedCart = JSON.parse(localStorage.getItem('gamestore_cart') || '[]');
const currentUser = auth.getCurrentUser();

export const store = new Store({
  cart: savedCart,
  searchQuery: '',
  activeCategory: 'all',
  locale: getLocale(),
  currency: getCurrency(),
  user: currentUser,
  purchases: currentUser ? auth.getUserPurchases() : [],
});

store.subscribe((state) => {
  localStorage.setItem('gamestore_cart', JSON.stringify(state.cart));
});

export const cartActions = {
  addToCart: (game) => {
    const { cart } = store.getState();
    if (cart.find((g) => g.id === game.id)) return;
    store.setState({ cart: [...cart, game] });
    toast.success(`${game.title} добавлена в корзину`);
  },
  removeFromCart: (id) => {
    const { cart } = store.getState();
    store.setState({ cart: cart.filter((g) => g.id !== id) });
  },
  clearCart: () => store.setState({ cart: [] }),
  isInCart: (id) => store.getState().cart.some((g) => g.id === id),
};

export const filterActions = {
  setSearch: (query) => store.setState({ searchQuery: query }),
  setCategory: (cat) => store.setState({ activeCategory: cat }),
};

export const settingsActions = {
  setLocale: (locale) => { setLocale(locale); store.setState({ locale }); },
  setCurrency: (currency) => { setCurrency(currency); store.setState({ currency }); },
};

export const authActions = {
  login: (credentials) => {
    const result = auth.login(credentials);
    if (result.success) {
      store.setState({ user: result.user, purchases: auth.getUserPurchases() });
      toast.success(`С возвращением, ${result.user.username}! 👋`);
    } else {
      toast.error(result.error === 'userNotFound' ? 'Пользователь не найден' : 'Неверный пароль');
    }
    return result;
  },
  register: (data) => {
    const result = auth.register(data);
    if (result.success) {
      const loginResult = auth.login({ email: data.email, password: data.password });
      if (loginResult.success) {
        store.setState({ user: loginResult.user, purchases: auth.getUserPurchases() });
        toast.success('Аккаунт создан! Добро пожаловать! 🎉');
      }
    } else {
      toast.error('Этот email уже зарегистрирован');
    }
    return result;
  },
  logout: () => {
    auth.logout();
    store.setState({ user: null, purchases: [] });
    toast.info('Вы вышли из аккаунта');
  },
  refreshUser: () => {
    const user = auth.getCurrentUser();
    if (user) store.setState({ user, purchases: auth.getUserPurchases() });
  },
};

export const purchaseActions = {
  addPurchase: (purchase) => {
    auth.addPurchase(purchase);
    authActions.refreshUser();
  },
};

export const walletActions = {
  topup: (amount) => {
    const user = auth.getCurrentUser();
    if (!user) { toast.error('Сначала войдите в аккаунт'); return { success: false }; }
    const result = auth.addBalance(user.id, amount);
    if (result.success) {
      authActions.refreshUser();
      toast.success(`Кошелёк пополнен на ${formatPrice(amount)}! 💰`);
    }
    return result;
  },
  pay: (amount) => {
    const user = auth.getCurrentUser();
    if (!user) { toast.error('Требуется авторизация'); return { success: false }; }
    const result = auth.payFromBalance(user.id, amount);
    if (result.success) {
      authActions.refreshUser();
      toast.success(`Оплата ${formatPrice(amount)} прошла успешно! ✓`);
      return { success: true, balance: result.balance };
    } else if (result.error === 'insufficientFunds') {
      toast.error(`Недостаточно средств. Баланс: ${formatPrice(result.balance)}`);
      return { success: false, balance: result.balance };
    }
    return result;
  },
  getBalance: () => {
    const user = auth.getCurrentUser();
    return user ? auth.getBalance(user.id) : 0;
  },
  getTransactions: () => {
    const user = auth.getCurrentUser();
    return user ? auth.getTransactions(user.id) : [];
  },
};