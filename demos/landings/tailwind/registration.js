const registration = document.querySelector('#registration');
const form = registration.querySelector('form');
const confirmation = registration.querySelector('[data-confirmation]');

document.querySelectorAll('[data-register]').forEach((button) => {
  button.addEventListener('click', () => {
    form.hidden = false;
    confirmation.hidden = true;
    registration.showModal();
  });
});

registration.querySelector('[data-close]').addEventListener('click', () => registration.close());

form.elements.guest.addEventListener('input', () => form.elements.guest.setCustomValidity(''));
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const guest = form.elements.guest.value.trim();
  if (!guest) {
    form.elements.guest.setCustomValidity('Введите имя.');
    form.elements.guest.reportValidity();
    return;
  }

  confirmation.textContent = `${guest}, запись подтверждена. Количество гостей — ${form.elements.places.value}. Это пробная запись.`;
  form.reset();
  form.hidden = true;
  confirmation.hidden = false;
  confirmation.focus();
});
