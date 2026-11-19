const dialog = document.querySelector('dialog');
const form = dialog.querySelector('form');
const status = dialog.querySelector('[role="status"]');

document.querySelectorAll('[data-book]').forEach(button => {
  button.addEventListener('click', () => {
    status.textContent = '';
    form.hidden = false;
    dialog.showModal();
    form.querySelector('input').focus();
  });
});
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
form.addEventListener('submit', event => {
  event.preventDefault();
  const name = form.querySelector('input').value.trim();
  if (!name) return;
  status.textContent = name + ', вы в списке на 28 ноября. Это демо-запись в этой вкладке.';
  form.hidden = true;
  dialog.querySelector('.close').focus();
});
