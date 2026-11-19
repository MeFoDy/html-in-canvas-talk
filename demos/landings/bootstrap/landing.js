const signupForm = document.querySelector('#signup-form');
const signupStatus = document.querySelector('#signup-status');

signupForm.addEventListener('submit', event => {
  event.preventDefault();
  signupForm.reset();
  signupStatus.className = 'alert alert-success';
  signupStatus.textContent = 'Готово! Форма сработала. Это пробная запись.';
  signupStatus.scrollIntoView({ block: 'nearest' });
});
