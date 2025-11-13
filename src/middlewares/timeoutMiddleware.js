/**
 * Timeout Middleware for long-running operations
 * Extends request timeout for routes that need more processing time
 */
const extendTimeout = (minutes = 10) => {
  return (req, res, next) => {
    const timeoutMs = minutes * 60 * 1000;

    // Set timeout for this specific request
    req.setTimeout(timeoutMs);
    res.setTimeout(timeoutMs);

    // Add timeout event handler
    req.on('timeout', () => {
      console.error(`⚠️ Request timeout after ${minutes} minutes:`, {
        method: req.method,
        url: req.url,
        ip: req.ip,
      });
    });

    next();
  };
};

module.exports = {
  extendTimeout,
};
