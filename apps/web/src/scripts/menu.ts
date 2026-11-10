// The mobile menu is a <details>: it opens without JavaScript. This only closes it after a link is
// followed (an anchor on the same page would leave it open) and on Escape.
for (const menu of document.querySelectorAll<HTMLDetailsElement>('[data-menu]')) {
  menu.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a') !== null) {
      menu.open = false;
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
  });
}
