const USERS_KEY = 'gamestore_users';
const SESSION_KEY = 'gamestore_session';
const PURCHASES_KEY = 'gamestore_purchases';

function getUsers() { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function getPurchases() { return JSON.parse(localStorage.getItem(PURCHASES_KEY) || '[]'); }
function savePurchases(purchases) { localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases)); }

function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

export const auth = {
  register({ email, password, username }) {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'emailExists' };
    }
    const newUser = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      email, username,
      password: hashPassword(password),
      createdAt: new Date().toISOString(),
      balance: 0,
    };
    users.push(newUser);
    saveUsers(users);
    return { success: true, user: newUser };
  },

  login({ email, password }) {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, error: 'userNotFound' };
    if (user.password !== hashPassword(password)) return { success: false, error: 'wrongPassword' };
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, loginAt: Date.now() }));
    return { success: true, user };
  },

  logout() { localStorage.removeItem(SESSION_KEY); },

  getCurrentUser() {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (!session) return null;
    return getUsers().find(u => u.id === session.userId) || null;
  },

  isAuthenticated() { return !!this.getCurrentUser(); },

  updateUser(userId, updates) {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
    return users[idx];
  },

  getBalance(userId) {
    const user = getUsers().find(u => u.id === userId);
    return user ? (user.balance || 0) : 0;
  },

  addBalance(userId, amount) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'userNotFound' };
    user.balance = (user.balance || 0) + amount;
    saveUsers(users);
    return { success: true, balance: user.balance };
  },

  payFromBalance(userId, amount) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'userNotFound' };
    const currentBalance = user.balance || 0;
    if (currentBalance < amount) return { success: false, error: 'insufficientFunds', balance: currentBalance };
    user.balance = currentBalance - amount;
    saveUsers(users);
    return { success: true, balance: user.balance };
  },

  addPurchase(purchase) {
    const purchases = getPurchases();
    const currentUser = this.getCurrentUser();
    purchases.unshift({
      ...purchase,
      id: Date.now().toString(36),
      date: new Date().toISOString(),
      userId: currentUser?.id,
    });
    savePurchases(purchases);
    return purchases;
  },

  getUserPurchases() {
    const user = this.getCurrentUser();
    if (!user) return [];
    return getPurchases().filter(p => p.userId === user.id);
  },

  getTransactions(userId) {
    return getPurchases()
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },
};