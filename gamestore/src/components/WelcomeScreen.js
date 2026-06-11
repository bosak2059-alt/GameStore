export class WelcomeScreen {
  constructor() {
    this.progress = 0;
    this.isComplete = false;
    this.onComplete = null;
  }

  render() {
    return `
      <div class="welcome-screen" id="welcome-screen">
        <!-- Анимированный фон с частицами -->
        <div class="welcome-bg">
          <div class="particle particle--1"></div>
          <div class="particle particle--2"></div>
          <div class="particle particle--3"></div>
          <div class="particle particle--4"></div>
          <div class="particle particle--5"></div>
          <div class="particle particle--6"></div>
          <div class="welcome-bg__glow"></div>
        </div>

        <div class="welcome-content">
          <!-- Логотип с анимацией -->
          <div class="welcome-logo">
            <div class="welcome-logo__icon">🎮</div>
            <h1 class="welcome-logo__title">
              <span class="welcome-logo__title--gradient">GameStore</span>
            </h1>
          </div>

          <!-- Приветственный текст с эффектом печатной машинки -->
          <div class="welcome-text">
            <p class="welcome-text__greeting" id="welcome-greeting"></p>
            <p class="welcome-text__subtitle">
              Тысячи игр по лучшим ценам. Мгновенная доставка ключей.
            </p>
          </div>

          <!-- Ползунок загрузки -->
          <div class="welcome-progress">
            <div class="welcome-progress__bar">
              <div class="welcome-progress__fill" id="progress-fill"></div>
              <div class="welcome-progress__shine"></div>
            </div>
            <div class="welcome-progress__info">
              <span class="welcome-progress__percent" id="progress-percent">0%</span>
              <span class="welcome-progress__status" id="progress-status">Загрузка...</span>
            </div>
          </div>

          <!-- Кнопка пропуска -->
          <button class="welcome-skip" id="welcome-skip">
            Пропустить →
          </button>
        </div>
      </div>
    `;
  }

  mountEvents() {
    const skipBtn = document.getElementById('welcome-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.complete());
    }

    // Запускаем анимацию
    this.startAnimation();
  }

  startAnimation() {
    // Анимация печатной машинки
    this.typeWriter('Добро пожаловать в мир игр!', 'welcome-greeting', 50);

    // Анимация прогресс-бара
    this.animateProgress();
  }

  typeWriter(text, elementId, speed = 50) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let i = 0;
    element.classList.add('typing');
    
    const type = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        element.classList.remove('typing');
        element.classList.add('typing-cursor');
      }
    };
    
    setTimeout(type, 800);
  }

  animateProgress() {
    const fill = document.getElementById('progress-fill');
    const percent = document.getElementById('progress-percent');
    const status = document.getElementById('progress-status');

    const stages = [
      { at: 0, text: 'Инициализация...' },
      { at: 20, text: 'Загрузка каталога...' },
      { at: 45, text: 'Подготовка интерфейса...' },
      { at: 70, text: 'Загрузка стилей...' },
      { at: 90, text: 'Почти готово...' },
      { at: 100, text: 'Добро пожаловать!' },
    ];

    const duration = 3500; // 3.5 секунды
    const startTime = Date.now();

    const update = () => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min((elapsed / duration) * 100, 100);
      
      // Нелинейная анимация (ease-out)
      this.progress = 100 * (1 - Math.pow(1 - rawProgress / 100, 3));
      
      if (fill) fill.style.width = `${this.progress}%`;
      if (percent) percent.textContent = `${Math.floor(this.progress)}%`;

      // Обновляем текст статуса
      for (const stage of stages) {
        if (this.progress >= stage.at && status) {
          status.textContent = stage.text;
        }
      }

      if (this.progress < 100) {
        requestAnimationFrame(update);
      } else {
        setTimeout(() => this.complete(), 400);
      }
    };

    requestAnimationFrame(update);
  }

  complete() {
    if (this.isComplete) return;
    this.isComplete = true;

    const screen = document.getElementById('welcome-screen');
    if (!screen) return;

    screen.classList.add('welcome-screen--exit');

    setTimeout(() => {
      screen.remove();
      if (this.onComplete) this.onComplete();
    }, 800);
  }

  setOnComplete(callback) {
    this.onComplete = callback;
  }
}