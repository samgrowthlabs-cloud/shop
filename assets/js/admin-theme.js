const STORAGE_KEY = 'shoplab_admin_theme';
const root = document.documentElement;

function preferredTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  root.dataset.adminTheme = theme;
  root.style.colorScheme = theme;
  document.querySelectorAll('[data-admin-theme-toggle]').forEach((button) => {
    const dark = theme === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? 'Usar modo claro' : 'Usar modo escuro');
    button.title = dark ? 'Usar modo claro' : 'Usar modo escuro';
    button.innerHTML = `<span aria-hidden="true">${dark ? '☀' : '☾'}</span><span>${dark ? 'Claro' : 'Escuro'}</span>`;
  });
}

function installToggle() {
  if (document.querySelector('[data-admin-theme-toggle]')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn ghost admin-theme-toggle';
  button.dataset.adminThemeToggle = '';
  button.addEventListener('click', () => {
    const next = root.dataset.adminTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  });
  const actions = document.querySelector('.admin-actions');
  if (actions) actions.prepend(button);
  else if (document.querySelector('.login-page')) document.body.append(button);
  else return;
  applyTheme(root.dataset.adminTheme || preferredTheme());
}

applyTheme(preferredTheme());
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installToggle, { once: true });
else installToggle();
new MutationObserver(installToggle).observe(document.documentElement, { childList: true, subtree: true });

