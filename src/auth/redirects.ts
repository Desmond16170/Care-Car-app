const PWA_URL = 'https://desmond16170.github.io/Care-Car-app/';

export const authRedirectUrl = (route: 'login' | 'reset-password') => {
  const base = window.location.protocol === 'file:'
    ? PWA_URL
    : `${window.location.origin}${window.location.pathname}`;

  return `${base}#/${route}`;
};
