const site = document.querySelector('#site');
const toggle = document.querySelector('#contrast');
const field = document.querySelector('#guest');
const status = document.querySelector('#render-status');
const ratio = document.querySelector('#ratio');
const pivot = 207;
const gain = 6;
let enhanced = false;

function remap(value) {
  return Math.min(255, Math.max(0, 128 + (value - pivot) * gain));
}

function luminance(rgb) {
  const [r, g, b] = rgb.map(value => {
    const s = value / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function showMode(label, filtered = false) {
  status.textContent = label;
  toggle.setAttribute('aria-pressed', String(enhanced));
  const style = getComputedStyle(site);
  const colors = [style.color, style.backgroundColor].map(color => {
    const rgb = color.match(/\d+/g).slice(0, 3).map(Number);
    return luminance(filtered ? rgb.map(remap) : rgb);
  }).sort((a, b) => a - b);
  ratio.textContent = ((colors[1] + .05) / (colors[0] + .05)).toLocaleString('ru', {maximumFractionDigits: 2}) + ':1';
}

const surface = makeSurface(document.querySelector('#site-host'), site, ctx => {
  const frame = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const {data} = frame;
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) data[i + c] = 128 + (data[i + c] - pivot) * gain;
  }
  ctx.putImageData(frame, 0, 0);
}, mode => {
  site.classList.toggle('html-contrast', enhanced && !mode);
  showMode(mode ? 'HTML in Canvas' : enhanced ? 'HTML-фолбек' : 'HTML', Boolean(mode));
});

toggle.addEventListener('click', () => {
  enhanced = !enhanced;
  if (enhanced && new URLSearchParams(location.search).get('mode') !== 'html') surface.enable('2d');
  else surface.html();
});
site.querySelector('a').addEventListener('click', event => {
  event.preventDefault();
  field.focus();
});
site.querySelector('form').addEventListener('submit', event => {
  event.preventDefault();
  document.querySelector('#result').textContent = field.value.trim() + ', вы записаны на 21:00.';
  surface.render();
});
site.addEventListener('input', surface.render);
site.addEventListener('focusin', surface.render);
site.addEventListener('focusout', surface.render);
showMode('HTML');
toggle.disabled = false;
