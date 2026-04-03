class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  toJSON() {
    return {
      ok: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details || undefined
      }
    };
  }
}

module.exports = {
  AppError
};
