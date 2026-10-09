const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('#primary-nav');

toggle.addEventListener('click', () => {
  const isOpen = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!isOpen));
  toggle.querySelector('[aria-hidden="true"]').textContent = isOpen ? '☰' : '×';
  nav.classList.toggle('open', !isOpen);
});

nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('[aria-hidden="true"]').textContent = '☰';
  });
});
