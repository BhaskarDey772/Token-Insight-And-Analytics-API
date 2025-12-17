/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Invalid request parameters',
      details: err.array(),
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;

