const { test } = require('node:test');
const assert = require('node:assert/strict');

const { getCorsOrigins, getJwtSecret } = require('../src/config');

test('production requires an explicit strong JWT secret', () => {
  assert.throws(() => getJwtSecret({ NODE_ENV: 'production' }), /JWT_SECRET is required/);
  assert.throws(
    () => getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'short' }),
    /at least 32 bytes/
  );
});

test('development secret is random and stable for the process', () => {
  const first = getJwtSecret({ NODE_ENV: 'development' });
  const second = getJwtSecret({ NODE_ENV: 'development' });
  assert.equal(first, second);
  assert.ok(Buffer.byteLength(first, 'utf8') >= 32);
  assert.notEqual(first, 'parking-management-secret-key-2024');
});

test('CORS origins are explicit, trimmed and deduplicated', () => {
  assert.deepEqual(
    getCorsOrigins({ CORS_ORIGIN: 'http://localhost:5173, http://example.test,http://localhost:5173' }),
    ['http://localhost:5173', 'http://example.test']
  );
  assert.ok(!getCorsOrigins({}).includes('*'));
});

test('server only emits CORS headers for configured origins', async () => {
  process.env.JWT_SECRET = 'test-secret-that-is-longer-than-thirty-two-bytes';
  process.env.CORS_ORIGIN = 'http://allowed.test';
  const { createApp } = require('../src/server');
  const server = createApp().listen(0);

  try {
    const address = server.address();
    const url = `http://127.0.0.1:${address.port}/api/health`;
    const allowed = await fetch(url, { headers: { Origin: 'http://allowed.test' } });
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://allowed.test');
    const denied = await fetch(url, { headers: { Origin: 'http://denied.test' } });
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
  } finally {
    await new Promise(resolve => server.close(resolve));
    delete process.env.JWT_SECRET;
    delete process.env.CORS_ORIGIN;
  }
});
