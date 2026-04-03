const PASSWORD_MIN_LENGTH = 8;

const hasAtLeastOneDigit = (value) => /\d/.test(value);

const validatePasswordPolicy = (value) => {
  if (typeof value !== 'string') {
    return { ok: false, code: 'PASSWORD_INVALID_TYPE' };
  }

  if (value.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, code: 'PASSWORD_TOO_SHORT' };
  }

  if (!hasAtLeastOneDigit(value)) {
    return { ok: false, code: 'PASSWORD_DIGIT_REQUIRED' };
  }

  return { ok: true };
};

module.exports = {
  PASSWORD_MIN_LENGTH,
  validatePasswordPolicy
};
