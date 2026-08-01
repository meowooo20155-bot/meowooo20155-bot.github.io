(() => {
  const loader = document.currentScript;
  const appSource = loader?.dataset.appSrc || 'app.js';
  const isGitHubPages = window.location.hostname === 'meowooo20155-bot.github.io';
  const endpoint = 'https://sibgard-smart-plants.jekakharitonov.chatgpt.site/api/catalog/changes';

  async function applyLiveChanges() {
    const base = Array.isArray(window.SIBGARD_CATALOG) ? window.SIBGARD_CATALOG : [];
    const response = await fetch(endpoint, {mode: 'cors', cache: 'no-store'});
    if (!response.ok) throw new Error('live_catalog_unavailable');
    const result = await response.json();
    if (!result?.ok || !Array.isArray(result.records)) throw new Error('invalid_live_catalog');
    const merged = new Map(base.map((product) => [product.id, product]));
    for (const record of result.records) {
      if (!record?.productId) continue;
      if (record.status === 'archived') merged.delete(record.productId);
      else if (record.status === 'active' && record.product) {
        merged.set(record.productId, {...merged.get(record.productId), ...record.product, id: record.productId});
      }
    }
    window.SIBGARD_CATALOG = [...merged.values()];
  }

  function startAssistant() {
    const script = document.createElement('script');
    script.src = appSource;
    script.onload = () => { window.__SIBGARD_LIVE_CATALOG_READY__ = true; };
    script.onerror = () => {
      const app = document.querySelector('#app');
      if (app) app.innerHTML = '<div class="notice"><span>Не удалось запустить помощника. Обновите страницу.</span></div>';
    };
    document.body.append(script);
  }

  if (!isGitHubPages) {
    startAssistant();
    return;
  }

  applyLiveChanges().catch(() => {
    // If the online database is temporarily unreachable, keep the complete reviewed static catalog.
  }).finally(startAssistant);
})();
