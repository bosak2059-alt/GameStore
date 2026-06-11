import { GameCard } from '../components/GameCard.js';
import { CartModal } from '../components/CartModal.js';
import { debounce } from '../utils/debounce.js';
import { store, filterActions } from '../core/store.js';
import { t } from '../utils/i18n.js';

export class HomePage {
  constructor() { this.games = []; this.filteredGames = []; }

  async render() {
    const res = await fetch('/src/data/games.json');
    this.games = await res.json();
    this.filteredGames = this.games;
    const allTags = new Set();
    this.games.forEach((g) => g.tags.forEach((tag) => allTags.add(tag)));
    const categories = ['all', ...Array.from(allTags)];

    return `
      <div class="home">
        <section class="hero">
          <h1 class="hero__title">${t('heroTitle')} <span class="gradient-text">${t('heroTitleAccent')}</span></h1>
          <p class="hero__subtitle">${t('heroSubtitle')}</p>
          <div class="search-box">
            <input type="text" id="search-input" placeholder="${t('searchPlaceholder')}" class="search-input" />
          </div>
        </section>
        <div class="categories" id="categories">
          ${categories.map((c) => `
            <button class="category-btn ${c === 'all' ? 'category-btn--active' : ''}" data-cat="${c}">
              ${c === 'all' ? t('all') : c}
            </button>
          `).join('')}
        </div>
        <section class="games-grid" id="games-grid"></section>
        ${new CartModal().render()}
      </div>
    `;
  }

  mountEvents() {
    const grid = document.getElementById('games-grid');
    const searchInput = document.getElementById('search-input');
    const categories = document.getElementById('categories');

    const renderGrid = () => {
      if (this.filteredGames.length === 0) {
        grid.innerHTML = `<p class="empty-state">${t('nothingFound')}</p>`;
        return;
      }
      grid.innerHTML = this.filteredGames.map((g) => new GameCard(g).render()).join('');
      this.filteredGames.forEach((g) => new GameCard(g).mountEvents());
    };

    const applyFilters = () => {
      const { searchQuery, activeCategory } = store.getState();
      this.filteredGames = this.games.filter((g) => {
        const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = activeCategory === 'all' || g.tags.includes(activeCategory);
        return matchesSearch && matchesCat;
      });
      renderGrid();
    };

    searchInput.addEventListener('input', debounce((e) => {
      filterActions.setSearch(e.target.value);
      applyFilters();
    }, 300));

    categories.addEventListener('click', (e) => {
      const btn = e.target.closest('.category-btn');
      if (!btn) return;
      categories.querySelectorAll('.category-btn').forEach((b) => b.classList.remove('category-btn--active'));
      btn.classList.add('category-btn--active');
      filterActions.setCategory(btn.dataset.cat);
      applyFilters();
    });

    renderGrid();
    new CartModal().mountEvents();
  }
}