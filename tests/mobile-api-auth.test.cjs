const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { test } = require('node:test');
const ts = require('typescript');

function loadTypeScript(relativePath, mocks) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  const realRequire = createRequire(filename);
  const requireWithMocks = name => Object.hasOwn(mocks, name) ? mocks[name] : realRequire(name);
  new Function('require', 'module', 'exports', compiled)(requireWithMocks, loaded, loaded.exports);
  return loaded.exports;
}

const responses = {
  mobileError: (status, message) => Response.json({ ok: false, message }, { status }),
  mobileSuccess: (data, status = 200) => Response.json({ ok: true, data }, { status }),
};

test('login móvil y Bearer validan credenciales, rol y estado de la cuenta', async () => {
  const previousSecret = process.env.NEXTAUTH_SECRET;
  process.env.NEXTAUTH_SECRET = 'mobile-api-local-test-secret';
  try {
    let loginAccount = null;
    let currentAccount = null;
    const mobileAuth = loadTypeScript('src/lib/mobile-auth.ts', {
      '@/lib/db': { query: async () => ({ rows: currentAccount ? [currentAccount] : [] }) },
      '@/lib/mobile-api': responses,
    });
    const login = loadTypeScript('src/app/api/mobile/auth/login/route.ts', {
      '@/lib/user-auth': { authenticateCredentials: async () => loginAccount },
      '@/lib/mobile-auth': mobileAuth,
      '@/lib/mobile-api': responses,
    });
    const me = loadTypeScript('src/app/api/mobile/auth/me/route.ts', {
      '@/lib/mobile-auth': mobileAuth,
      '@/lib/mobile-api': responses,
    });
    const loginRequest = () => new Request('http://localhost/api/mobile/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'paciente', password: 'clave' }),
    });

    assert.equal((await login.POST(loginRequest())).status, 401);

    loginAccount = { id: '12', username: 'admin', email: 'admin@example.com', rol_id: 1, active: true };
    assert.equal((await login.POST(loginRequest())).status, 403);

    loginAccount = { id: '12', username: 'paciente', email: 'paciente@example.com', rol_id: 2, active: true, password_hash: 'never-expose' };
    const loggedIn = await login.POST(loginRequest());
    assert.equal(loggedIn.status, 200);
    const payload = await loggedIn.json();
    assert.equal(payload.data.user.rol_id, 2);
    assert.equal(JSON.stringify(payload).includes('password_hash'), false);
    assert.equal(JSON.stringify(payload).includes('never-expose'), false);

    const bearerRequest = () => new Request('http://localhost/api/mobile/auth/me', {
      headers: { Authorization: `Bearer ${payload.data.token}` },
    });
    currentAccount = { id: 12, username: 'paciente', email: 'paciente@example.com', rol_id: 2, active: true };
    const currentUser = await me.GET(bearerRequest());
    assert.equal(currentUser.status, 200);
    assert.deepEqual((await currentUser.json()).data, {
      id: '12', username: 'paciente', email: 'paciente@example.com', rol_id: 2,
    });

    currentAccount.active = false;
    assert.equal((await me.GET(bearerRequest())).status, 401);
    currentAccount.active = true;
    currentAccount.rol_id = 1;
    assert.equal((await me.GET(bearerRequest())).status, 403);
    assert.equal((await me.GET(new Request('http://localhost/api/mobile/auth/me'))).status, 401);
  } finally {
    if (previousSecret === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = previousSecret;
  }
});
