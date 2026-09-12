export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const isValidPhoneNumber = (phone: string): boolean => {
  return /^\+?[0-9]{10,15}$/.test(phone.trim().replace(/[\s-]/g, ''));
};

export const isValidPassword = (password: string): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Au moins 8 caractères');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Au moins une lettre minuscule');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Au moins une lettre majuscule');
  }
  if (!/\d/.test(password)) {
    errors.push('Au moins un chiffre');
  }
  if (!/[@$!%*?&#^()_+={}\[\]:;"'<>,.~`|\/\\]/.test(password)) {
    errors.push('Au moins un caractère spécial (@$!%*?&...)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
