(() => {
  const REPOSITORY = 'meowooo20155-bot/meowooo20155-bot.github.io';
  const BRANCH = 'main';
  const OVERRIDES_PATH = 'data/catalog-overrides.json';
  const TOKEN_STORAGE = 'sibgard_github_token_v1';
  const SECRET_SESSION = 'sibgard_owner_secret_v1';
  const WRAPPED_SECRET = {
    iterations: 600000,
    salt: '0gtxJXLfOCPSuZ/AA7uUSA==',
    iv: 'gTQD2YzD60NQCAGW',
    ciphertext: 'wjgTWsATvcIdQfmRqkcvuvEgq94XcZ4LBtHZx6IjXGuMfNV0W0N8Lu29lI3Sj5UD',
  };
  const nativeFetch = window.fetch.bind(window);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let ownerSecret = sessionStorage.getItem(SECRET_SESSION) || '';
  let githubToken = '';
  let records = [];
  let contentSha = '';

  function fromBase64(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  function toBase64(bytes) {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  function utf8ToBase64(value) {
    return toBase64(encoder.encode(value));
  }

  async function unwrapSecret(password) {
    const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({
      name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64(WRAPPED_SECRET.salt), iterations: WRAPPED_SECRET.iterations,
    }, material, {name: 'AES-GCM', length: 256}, false, ['decrypt']);
    const plaintext = await crypto.subtle.decrypt({name: 'AES-GCM', iv: fromBase64(WRAPPED_SECRET.iv)}, key, fromBase64(WRAPPED_SECRET.ciphertext));
    return toBase64(new Uint8Array(plaintext));
  }

  async function tokenKey() {
    const material = await crypto.subtle.digest('SHA-256', encoder.encode(`github-token:${ownerSecret}`));
    return crypto.subtle.importKey('raw', material, {name: 'AES-GCM'}, false, ['encrypt', 'decrypt']);
  }

  async function saveEncryptedToken(token) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, await tokenKey(), encoder.encode(token));
    localStorage.setItem(TOKEN_STORAGE, JSON.stringify({iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(encrypted))}));
  }

  async function restoreToken() {
    try {
      const saved = JSON.parse(localStorage.getItem(TOKEN_STORAGE) || 'null');
      if (!saved) return '';
      const decrypted = await crypto.subtle.decrypt({name: 'AES-GCM', iv: fromBase64(saved.iv)}, await tokenKey(), fromBase64(saved.ciphertext));
      return decoder.decode(decrypted);
    } catch {
      localStorage.removeItem(TOKEN_STORAGE);
      return '';
    }
  }

  function apiHeaders(token) {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  async function readRemote(token = '') {
    const response = await nativeFetch(`https://api.github.com/repos/${REPOSITORY}/contents/${OVERRIDES_PATH}?ref=${BRANCH}&t=${Date.now()}`, {
      headers: token ? apiHeaders(token) : {Accept: 'application/vnd.github+json'}, cache: 'no-store',
    });
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'GitHub не принял ключ доступа.' : 'Не удалось прочитать изменения каталога.');
    const file = await response.json();
    const text = decoder.decode(fromBase64(String(file.content || '').replace(/\s/g, '')));
    const parsed = JSON.parse(text);
    contentSha = file.sha;
    records = Array.isArray(parsed.records) ? parsed.records : [];
    return records;
  }

  async function connectGithub() {
    const token = prompt('Вставьте fine-grained GitHub token с доступом только к репозиторию meowooo20155-bot.github.io и правом Contents: Read and write. Ключ останется зашифрованным только в этом браузере.');
    if (!token) return false;
    const cleaned = token.trim();
    await readRemote(cleaned);
    githubToken = cleaned;
    await saveEncryptedToken(cleaned);
    updateStatus();
    alert('GitHub подключён. Теперь изменения можно сохранять.');
    return true;
  }

  async function requireToken() {
    if (!githubToken) githubToken = await restoreToken();
    if (!githubToken) await connectGithub();
    if (!githubToken) throw new Error('Для сохранения подключите GitHub.');
    return githubToken;
  }

  async function persist(message) {
    const token = await requireToken();
    const desiredRecords = records;
    await readRemote(token);
    records = desiredRecords;
    const response = await nativeFetch(`https://api.github.com/repos/${REPOSITORY}/contents/${OVERRIDES_PATH}`, {
      method: 'PUT',
      headers: {...apiHeaders(token), 'Content-Type': 'application/json'},
      body: JSON.stringify({message, content: utf8ToBase64(`${JSON.stringify({ok: true, records}, null, 2)}\n`), sha: contentSha, branch: BRANCH}),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        githubToken = '';
        localStorage.removeItem(TOKEN_STORAGE);
        updateStatus();
      }
      throw new Error(response.status === 409 ? 'Каталог изменился в другой вкладке. Обновите страницу и повторите.' : 'GitHub не сохранил изменение. Проверьте доступ ключа к Contents.');
    }
    const result = await response.json();
    contentSha = result.content?.sha || contentSha;
  }

  function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json; charset=utf-8'}});
  }

  async function adminApi(path, options = {}) {
    if (path === '/api/catalog/changes') return jsonResponse({ok: true, records});
    const body = JSON.parse(options.body || '{}');
    const now = new Date().toISOString();
    if (path.endsWith('/save')) {
      const id = body.id || `custom_${crypto.randomUUID().replace(/-/g, '')}`;
      const product = {...body.product, id};
      const isCustom = Boolean(body.isCustom || id.startsWith('custom_'));
      records = records.filter((record) => record.productId !== id);
      records.unshift({productId: id, status: 'active', product, isCustom, createdAt: now, updatedAt: now});
      await persist(`Update catalog: ${product.variety || id}`);
      return jsonResponse({ok: true, productId: id, product, isCustom, updatedAt: now});
    }
    if (path.endsWith('/archive') || path.endsWith('/restore')) {
      const archived = path.endsWith('/archive');
      const current = records.find((record) => record.productId === body.id);
      const record = current || {productId: body.id, product: body.product, isCustom: String(body.id).startsWith('custom_'), createdAt: now};
      records = records.filter((item) => item.productId !== body.id);
      records.unshift({...record, status: archived ? 'archived' : 'active', updatedAt: now});
      await persist(`${archived ? 'Archive' : 'Restore'} catalog card: ${body.id}`);
      return jsonResponse({ok: true, productId: body.id, status: archived ? 'archived' : 'active', updatedAt: now});
    }
    if (path.endsWith('/reset')) {
      records = records.filter((record) => record.productId !== body.id);
      await persist(`Reset catalog card: ${body.id}`);
      return jsonResponse({ok: true, productId: body.id});
    }
    return jsonResponse({ok: false, message: 'Неизвестная команда.'}, 404);
  }

  function updateStatus() {
    const status = document.querySelector('#github-status');
    if (!status) return;
    status.hidden = false;
    status.classList.toggle('ready', Boolean(githubToken));
    status.innerHTML = githubToken
      ? '<span>GitHub подключён · изменения сохраняются прямо в каталог</span><button type="button" data-reconnect>Сменить ключ</button><button type="button" data-owner-logout>Выйти</button>'
      : '<span>Для первого сохранения подключите ключ GitHub с правом Contents: Read and write.</span><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Создать ключ</a><button type="button" data-connect>Подключить GitHub</button><button type="button" data-owner-logout>Выйти</button>';
  }

  async function startAdmin() {
    document.querySelector('#owner-gate').hidden = true;
    const app = document.querySelector('#admin-app');
    app.hidden = false;
    await readRemote();
    githubToken = await restoreToken();
    updateStatus();
    window.fetch = (input, options) => {
      const path = typeof input === 'string' ? input : input.url;
      if (path.startsWith('/api/catalog/changes') || path.startsWith('/api/admin/catalog/')) return adminApi(path, options);
      return nativeFetch(input, options);
    };
    const script = document.createElement('script');
    script.src = '/admin-core.js?v=20260802-1';
    script.onerror = () => { app.innerHTML = '<div class="fatal-error"><h1>Не удалось открыть админ-панель</h1><p>Обновите страницу через минуту.</p></div>'; };
    document.body.append(script);
  }

  document.querySelector('#owner-login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = document.querySelector('#owner-error');
    error.hidden = true;
    try {
      ownerSecret = await unwrapSecret(document.querySelector('#owner-password').value);
      sessionStorage.setItem(SECRET_SESSION, ownerSecret);
      await startAdmin();
    } catch {
      error.hidden = false;
    }
  });

  document.addEventListener('click', async (event) => {
    if (event.target.closest('[data-connect],[data-reconnect]')) {
      try { await connectGithub(); } catch (error) { alert(error.message); }
    }
    if (event.target.closest('[data-owner-logout]') || event.target.closest('a[href^="/owner-logout"]')) {
      event.preventDefault();
      sessionStorage.removeItem(SECRET_SESSION);
      location.reload();
    }
  }, true);

  if (ownerSecret) startAdmin().catch(() => {
    sessionStorage.removeItem(SECRET_SESSION);
    location.reload();
  });
})();
