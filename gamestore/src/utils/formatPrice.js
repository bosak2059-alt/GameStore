const currencies = {
  RUB: { rate: 1, locale: 'ru-RU', code: 'RUB' },
  USD: { rate: 0.011, locale: 'en-US', code: 'USD' },
  EUR: { rate: 0.010, locale: 'de-DE', code: 'EUR' },
  KZT: { rate: 5.2, locale: 'kk-KZ', code: 'KZT' },
};

let currentCurrency = localStorage.getItem('gamestore_currency') || 'RUB';

export function setCurrency(currency) {
  if (currencies[currency]) {
    currentCurrency = currency;
    localStorage.setItem('gamestore_currency', currency);
  }
}
export function getCurrency() { return currentCurrency; }
export function getAvailableCurrencies() { return Object.keys(currencies); }

export function formatPrice(priceInRub) {
  if (priceInRub === 0) return 'Free';
  const currency = currencies[currentCurrency];
  const convertedPrice = priceInRub * currency.rate;
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    maximumFractionDigits: 0,
  }).format(convertedPrice);
}