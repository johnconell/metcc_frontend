export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRequired(value) {
  return value && String(value).trim().length > 0;
}

export function validatePassword(password) {
  return password && password.length >= 8;
}
