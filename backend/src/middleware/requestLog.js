'use strict';

const { randomUUID } = require('node:crypto');

// NFR-09: one structured line per request: id, method, path, status, latency.
// NFR-04: never the body, headers, token or query string. No route has a path parameter,
// so the plain path is safe to log.
function requestLog(logger = console) {
  return (req, res, next) => {
    const start = process.hrtime.bigint();
    req.id = randomUUID();
    res.setHeader('X-Request-Id', req.id);
    res.on('finish', () => {
      logger.info?.(
        JSON.stringify({
          request_id: req.id,
          method: req.method,
          path: req.originalUrl.split('?')[0],
          status: res.statusCode,
          ms: Math.round(Number(process.hrtime.bigint() - start) / 1e6),
        }),
      );
    });
    next();
  };
}

module.exports = { requestLog };
