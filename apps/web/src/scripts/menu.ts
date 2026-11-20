// The phone's drawer is a <details>: it opens without JavaScript and its links are in the HTML. This only
// closes it: after a link is followed (an anchor on the same page would leave it open), on Escape and on
// a click outside.
const menu = document.querySelector<HTMLDetailsElement>('[data-menu]');

if (menu) {
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

  document.addEventListener('click', (event) => {
    if (menu.open && event.target instanceof Node && !menu.contains(event.target)) {
      menu.open = false;
    }
  });
}
