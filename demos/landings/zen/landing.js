const picker = document.querySelector('.theme-picker');
const buttons = picker.querySelectorAll('[data-theme]');

function setTheme(theme) {
  for (const button of buttons) {
    const active = button.dataset.theme === theme;
    document.getElementById(button.dataset.theme).media = active ? 'all' : 'not all';
    button.setAttribute('aria-pressed', String(active));
  }
}

if (new URLSearchParams(location.search).get('theme') === 'wiggles') setTheme('wiggles');
for (const button of buttons) button.addEventListener('click', () => setTheme(button.dataset.theme));
picker.hidden = false;

const form = document.querySelector('form');
const output = form.querySelector('output');
form.addEventListener('submit', event => {
  event.preventDefault();
  output.textContent = 'Демо-запись подтверждена.';
});
form.addEventListener('input', () => { output.textContent = ''; });
form.hidden = false;
