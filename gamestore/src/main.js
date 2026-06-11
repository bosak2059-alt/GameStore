import { initRouter } from './core/router.js';
import { WelcomeScreen } from './components/WelcomeScreen.js';

document.addEventListener('DOMContentLoaded', () => {
  // Добавляем класс для блокировки скролла
  document.body.classList.add('welcome-active');

  // Создаём и показываем приветственный экран
  const welcome = new WelcomeScreen();
  document.body.insertAdjacentHTML('beforeend', welcome.render());
  welcome.mountEvents();

  // Когда welcome завершится — инициализируем роутер
  welcome.setOnComplete(() => {
    document.body.classList.remove('welcome-active');
    initRouter();
  });
});