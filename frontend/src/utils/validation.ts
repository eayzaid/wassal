export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const isValidPhoneNumber = (phone: string): boolean => {
  return /^\+?[0-9]{10,15}$/.test(phone.trim().replace(/[\s-]/g, ''));
};

export interface PasswordRuleCheck {
  id: string;
  label: string;
  met: boolean;
}

export const checkPasswordConstraints = (password: string): {
  rules: PasswordRuleCheck[];
  allMet: boolean;
  score: number; // 0 to 5
} => {
  const rules: PasswordRuleCheck[] = [
    {
      id: 'length',
      label: 'Au moins 8 caractères',
      met: password.length >= 8,
    },
    {
      id: 'lowercase',
      label: 'Au moins une lettre minuscule (a-z)',
      met: /[a-z]/.test(password),
    },
    {
      id: 'uppercase',
      label: 'Au moins une lettre majuscule (A-Z)',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'number',
      label: 'Au moins un chiffre (0-9)',
      met: /\d/.test(password),
    },
    {
      id: 'special',
      label: 'Au moins un caractère spécial (@$!%*?&...)',
      met: /[@$!%*?&#^()_+={}\[\]:;"'<>,.~`|\/\\]/.test(password),
    },
  ];

  const score = rules.filter((r) => r.met).length;
  const allMet = score === rules.length;

  return { rules, allMet, score };
};

export const isValidPassword = (password: string): {
  valid: boolean;
  errors: string[];
} => {
  const { rules, allMet } = checkPasswordConstraints(password);
  const errors = rules.filter((r) => !r.met).map((r) => r.label);

  return {
    valid: allMet,
    errors,
  };
};
