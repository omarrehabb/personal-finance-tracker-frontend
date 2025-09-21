/* Dev proxy to forward SPA requests on :3000 to Django on :8000.
 * Requires: npm i -D http-proxy-middleware
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  const target = 'http://localhost:8000';

  app.use(
    ['/api', '/api-auth', '/accounts', '/admin'],
    createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: true,
      logLevel: 'silent',
      cookieDomainRewrite: 'localhost',
    })
  );
};

