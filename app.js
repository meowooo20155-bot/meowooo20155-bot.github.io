(() => {
  const app = document.querySelector('#app');
  const catalog = Array.isArray(window.SIBGARD_CATALOG) ? window.SIBGARD_CATALOG : [];
  const groups = Array.isArray(window.SIBGARD_GROUPS) ? window.SIBGARD_GROUPS : [];
  const branches = Array.isArray(window.SIBGARD_BRANCHES) ? window.SIBGARD_BRANCHES : [];
  const branchMap = new Map(branches.map((branch) => [branch.id, branch]));
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const fallbackImage = 'assets/sibgard-logo.jpg';
  const gardenCenters = [
    {city: 'Иркутск', address: 'ул. Николаева, 8/1', phone: '+7 (983) 466-39-36', tel: '+79834663936'},
    {city: 'пос. Молодежный', address: 'Иркутский р-н, ул. Кузнецовой, 11', phone: '+7 (950) 118-53-27', tel: '+79501185327'},
    {city: 'Красноярск', address: 'ул. 9 Мая, 77', phone: '+7 (914) 915-81-86', tel: '+79149158186'},
    {city: 'Новосибирск', address: 'ул. Военная, 5', phone: '+7 (950) 118-53-27', tel: '+79501185327'},
  ];
  const analyticsEndpoint = window.location.hostname === 'meowooo20155-bot.github.io'
    ? 'https://sibgard-smart-plants.jekakharitonov.chatgpt.site/api/analytics/track'
    : '/api/analytics/track';
  const analyticsSiteSource = window.location.hostname === 'meowooo20155-bot.github.io' ? 'github' : 'sites';
  const supportPanel = document.querySelector('#support-panel');
  const supportLog = document.querySelector('#support-log');
  const supportInput = document.querySelector('#support-input');

  const state = {
    screen: 'home',
    groupId: null,
    branchId: null,
    questionIndex: 0,
    answers: [],
    helperId: null,
    searchQuery: '',
  };

  const helperFlows = {
    'fruit-helper': {
      title: 'Помогите выбрать плодовое дерево',
      group: 'fruit',
      intro: 'Ответьте на шесть бытовых вопросов — помощник предложит подходящую культуру.',
      questions: [
        helperQuestion('Что больше хочется собирать?', 'Представьте идеальный урожай.',
          helperOption('Хрустящие плоды, которые удобно хранить', { apple: 4 }),
          helperOption('Мягкие сочные плоды прямо с дерева', { apricot: 3, 'sweet-cherry': 2 }),
          helperOption('Небольшие сладкие ягоды горстями', { 'sweet-cherry': 4 })),
        helperQuestion('Когда нужен урожай?', 'Срок поможет выбрать между культурами.',
          helperOption('В начале или середине лета', { 'sweet-cherry': 3, apricot: 2 }),
          helperOption('В конце лета или осенью', { apple: 3, apricot: 1 }),
          helperOption('Хочу растянуть сезон', { apple: 2, apricot: 1, 'sweet-cherry': 1 })),
        helperQuestion('Что будете делать с плодами?', 'Выберите самое частое применение.',
          helperOption('Есть свежими всей семьёй', { 'sweet-cherry': 2, apple: 2, apricot: 2 }),
          helperOption('Варенье, компоты, выпечка', { apricot: 3, apple: 2 }),
          helperOption('Хранить зимой', { apple: 5 })),
        helperQuestion('Насколько важно компактное дерево?', 'Оцените свободное место на участке.',
          helperOption('Очень важно — места мало', { apple: 3, 'sweet-cherry': 1 }),
          helperOption('Место для обычного дерева есть', { apricot: 2, apple: 1, 'sweet-cherry': 2 }),
          helperOption('Не знаю', { apple: 1, apricot: 1, 'sweet-cherry': 1 })),
        helperQuestion('Готовы посадить два дерева ради урожая?', 'Сосед-опылитель часто помогает плодоношению.',
          helperOption('Да, можно два', { 'sweet-cherry': 3, apricot: 2 }),
          helperOption('Нет, место только для одного', { apple: 3 }),
          helperOption('Решу после подбора', { apple: 1, apricot: 1, 'sweet-cherry': 1 })),
        helperQuestion('Что для вас важнее всего?', 'Последнее уточнение определит рекомендацию.',
          helperOption('Надёжность и много разных сортов', { apple: 4 }),
          helperOption('Редкий солнечный фрукт', { apricot: 4 }),
          helperOption('Самый сладкий летний урожай', { 'sweet-cherry': 4 })),
      ],
    },
    'berry-helper': {
      title: 'Помогите выбрать ягодный кустарник',
      group: 'berries',
      intro: 'Шесть простых вопросов помогут понять, какая ягодная культура вам ближе.',
      questions: [
        helperQuestion('Когда хочется первых ягод?', 'От очень ранней жимолости до поздней малины.',
          helperOption('Как можно раньше', { honeysuckle: 5, cherry: 2 }),
          helperOption('В разгар лета', { currant: 2, gooseberry: 2, raspberry: 2, blackberry: 1, jostaberry: 2 }),
          helperOption('До самой осени', { raspberry: 4, blackberry: 2, 'sea-buckthorn': 3, svg: 3 })),
        helperQuestion('Какой размер ягод радует больше?', 'Большие ягоды удобнее есть свежими.',
          helperOption('Очень крупные', { blackberry: 4, raspberry: 3, gooseberry: 1, svg: 5, jostaberry: 3 }),
          helperOption('Средние, но много', { currant: 3, honeysuckle: 2, cherry: 2, 'sea-buckthorn': 2 }),
          helperOption('Размер не важен', { blueberry: 2, currant: 1, honeysuckle: 1, 'sea-buckthorn': 1 })),
        helperQuestion('Какой вкус предпочитаете?', 'Выберите наиболее близкий вариант.',
          helperOption('Сладкий, есть с куста', { raspberry: 3, blueberry: 3, honeysuckle: 2, svg: 4, 'sea-buckthorn': 2 }),
          helperOption('Кисло-сладкий, яркий', { currant: 3, gooseberry: 3, cherry: 2, jostaberry: 4, 'sea-buckthorn': 3 }),
          helperOption('Люблю разные вкусы', { blackberry: 2, raspberry: 1, currant: 1, jostaberry: 2, svg: 2 })),
        helperQuestion('Что будете делать с урожаем?', 'Основное назначение помогает выбрать культуру.',
          helperOption('Сразу есть свежим', { blueberry: 3, raspberry: 3, honeysuckle: 2, svg: 3, jostaberry: 2 }),
          helperOption('Варенье, желе, компоты', { currant: 4, gooseberry: 3, cherry: 3, 'sea-buckthorn': 3, jostaberry: 3, svg: 2 }),
          helperOption('Замораживать', { blackberry: 3, raspberry: 2, honeysuckle: 2, 'sea-buckthorn': 3, jostaberry: 2 })),
        helperQuestion('Колючки на кустах допустимы?', 'Вопрос особенно важен для крыжовника и ежевики.',
          helperOption('Лучше без колючек', { currant: 2, honeysuckle: 2, blueberry: 2, raspberry: 1, jostaberry: 3, svg: 2, 'sea-buckthorn': 2 }),
          helperOption('Колючки не мешают', { gooseberry: 3, blackberry: 3, raspberry: 1 }),
          helperOption('Не знаю', { cherry: 1, currant: 1, honeysuckle: 1, 'sea-buckthorn': 1, svg: 1, jostaberry: 1 })),
        helperQuestion('Какой результат кажется самым привлекательным?', 'Выберите картину будущего урожая.',
          helperOption('Ведро ягод для заготовок', { currant: 4, cherry: 3, gooseberry: 2, 'sea-buckthorn': 4, jostaberry: 2 }),
          helperOption('Долгий сбор понемногу', { raspberry: 4, blackberry: 2, 'sea-buckthorn': 1 }),
          helperOption('Редкая интересная ягода', { honeysuckle: 3, blueberry: 4, svg: 5, jostaberry: 4, 'sea-buckthorn': 2 })),
      ],
    },
  };

  function helperQuestion(title, hint, ...options) {
    return { title, hint, options };
  }

  function helperOption(label, points) {
    return { label, points };
  }

  function escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function readCookie(name) {
    const prefix = `${name}=`;
    return document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix))?.slice(prefix.length) || '';
  }

  function analyticsId(name, maxAge) {
    const current = readCookie(name);
    const id = /^[a-zA-Z0-9_-]{16,80}$/.test(current)
      ? current
      : (crypto.randomUUID?.() || `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`);
    document.cookie = `${name}=${id}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
    return id;
  }

  const analyticsVisitorId = analyticsId('sibgard_visitor', 60 * 60 * 24 * 400);
  let analyticsSessionId = analyticsId('sibgard_session', 60 * 30);

  function analyticsDeviceType() {
    const userAgent = navigator.userAgent || '';
    if (/iphone|ipod/i.test(userAgent)) return 'iphone';
    if (/ipad/i.test(userAgent) || (/macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1)) return 'ipad';
    if (/android/i.test(userAgent)) return 'android';
    if (/mobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  function trackAnalytics(eventName, details = {}) {
    analyticsSessionId = analyticsId('sibgard_session', 60 * 30);
    const params = new URLSearchParams(window.location.search);
    const payload = {
      event: eventName,
      visitorId: analyticsVisitorId,
      sessionId: analyticsSessionId,
      path: `${window.location.pathname}${window.location.search}`.slice(0, 180),
      referrer: document.referrer,
      source: params.get('utm_source') || '',
      siteSource: analyticsSiteSource,
      deviceType: analyticsDeviceType(),
      target: details.target || '',
      species: details.species || state.branchId || '',
    };
    const body = JSON.stringify(payload);
    let queued = false;
    if (analyticsEndpoint.startsWith('https://') && typeof navigator.sendBeacon === 'function') {
      try {
        queued = navigator.sendBeacon(
          analyticsEndpoint,
          new Blob([body], {type: 'text/plain;charset=UTF-8'}),
        );
      } catch {
        queued = false;
      }
    }
    if (queued) return;
    fetch(analyticsEndpoint, {
      method: 'POST',
      mode: 'cors',
      credentials: analyticsEndpoint.startsWith('/') ? 'same-origin' : 'omit',
      keepalive: true,
      headers: {'Content-Type': 'text/plain;charset=UTF-8'},
      body,
    }).catch(() => {});
  }

  function gardenCenterContactsMarkup() {
    return `<div class="inline-garden-centers">${gardenCenters.map((center) => `
      <span><b>${escapeHtml(center.city)}:</b> ${escapeHtml(center.address)} — <a href="tel:${center.tel}">${escapeHtml(center.phone)}</a></span>
    `).join('')}</div>`;
  }

  function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(price || 0) + ' ₽';
  }

  function isDiscounted(product) {
    return Boolean(product?.promotion?.label);
  }

  function regularPriceMarkup(product) {
    return isDiscounted(product) && product.promotion.regularPrice > product.price
      ? `<del class="old-price">${formatPrice(product.promotion.regularPrice)}</del>`
      : '';
  }

  function fallbackForSpecies(species) {
    const branch = branchMap.get(species);
    return groupMap.get(branch?.group)?.image || fallbackImage;
  }

  function currentGroup() {
    return groupMap.get(state.groupId);
  }

  function currentBranch() {
    return branchMap.get(state.branchId);
  }

  function setScreen(screen) {
    state.screen = screen;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    requestAnimationFrame(() => app.focus({ preventScroll: true }));
  }

  function toggleSupport(open) {
    if (!supportPanel) return;
    supportPanel.hidden = !open;
    supportPanel.setAttribute('aria-hidden', String(!open));
    document.querySelectorAll('[data-action="support-open"]').forEach((button) => {
      button.setAttribute('aria-expanded', String(open));
    });
    if (open) supportInput?.focus();
  }

  function appendSupportMessage(role, content) {
    if (!supportLog) return;
    const wrapper = document.createElement('div');
    wrapper.className = `support-message ${role === 'user' ? 'user-message' : 'bot-message'}`;
    wrapper.innerHTML = role === 'user'
      ? `<p>${escapeHtml(content)}</p>`
      : `<img src="${fallbackImage}" alt=""><div>${content}</div>`;
    supportLog.append(wrapper);
    supportLog.scrollTop = supportLog.scrollHeight;
  }

  function branchMentionedIn(query) {
    const normalized = query.toLocaleLowerCase('ru').replace(/ё/g, 'е');
    return branches.find((branch) => {
      const firstWord = branch.title.toLocaleLowerCase('ru').replace(/ё/g, 'е').split(/[\s/]+/)[0];
      const stem = firstWord.length <= 4 ? firstWord.slice(0, 3) : firstWord.slice(0, -1);
      return stem.length >= 3 && normalized.includes(stem);
    });
  }

  function supportAnswer(question) {
    const normalized = question.toLocaleLowerCase('ru');
    if (/цен|стоим|налич/.test(normalized)) {
      return `<p>Цена показана в карточке каждого сорта. Точную цену и актуальное наличие подтвердит выбранный садовый центр:</p>${gardenCenterContactsMarkup()}`;
    }
    if (/помог|подоб|выбр|не знаю|не могу определ/.test(normalized)) {
      return `<p>Выберите, что хочется посадить — открою подходящую ветку вопросов:</p><div class="support-category-links">${groups.map((group) => `<button type="button" data-group="${group.id}">${group.icon} ${escapeHtml(group.title)}</button>`).join('')}</div>`;
    }

    const mentionedBranch = branchMentionedIn(question);
    const stopWords = new Set(['найди', 'найти', 'покажи', 'показать', 'ищу', 'нужен', 'нужна', 'нужно', 'хочу', 'сорт', 'растение']);
    const cleaned = question.toLocaleLowerCase('ru').split(/\s+/).filter((word) => !stopWords.has(word)).join(' ').trim();
    const directResults = searchCatalog(cleaned || question, 3);
    const results = directResults.length
      ? directResults
      : mentionedBranch ? groupByVariety(catalog.filter((product) => product.species === mentionedBranch.id)).slice(0, 3) : [];

    if (results.length) {
      return `<p>Нашла подходящие позиции. Можно открыть подбор по этому виду:</p><div class="support-product-links">${results.map((product) => `<button type="button" data-branch="${product.species}"><img src="${escapeHtml(product.picture || fallbackForSpecies(product.species))}" alt="" style="background-image:url('${escapeHtml(fallbackForSpecies(product.species))}')" data-fallback data-fallback-src="${escapeHtml(fallbackForSpecies(product.species))}"><span><b>${escapeHtml(product.variety)}</b><small>${formatPrice(product.price)}${isDiscounted(product) ? ' · Скидка' : ''} · Есть в наличии</small></span></button>`).join('')}</div>`;
    }
    return `<p>По такому запросу точного результата нет. Попробуйте написать только название вида или сорта — например, «жимолость», «роза Моника» или «яблоня Уралец».</p>`;
  }

  function askSupport(question) {
    const value = question.trim();
    if (!value) return;
    appendSupportMessage('user', value);
    appendSupportMessage('bot', supportAnswer(value));
  }

  function breadcrumbs(...items) {
    const parts = [
      '<nav class="breadcrumbs" aria-label="Хлебные крошки">',
      '<button type="button" data-action="categories">Категории</button>',
    ];
    items.filter(Boolean).forEach((item) => parts.push('<span>›</span>', `<span>${escapeHtml(item)}</span>`));
    parts.push('</nav>');
    return parts.join('');
  }

  function renderHome() {
    app.innerHTML = `
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">SIBGARD / Сады Сибири</p>
          <h1>Здравствуйте! Что вы хотите посадить?</h1>
          <p>Ответьте на 6 простых вопросов. Помощник проверит каждый ответ по реальным описаниям сортов и покажет только точные совпадения.</p>
          <button class="primary-button" type="button" data-action="categories">Начать подбор <span>→</span></button>
          <div class="catalog-note">Подбор основан на подтверждённых характеристиках ${catalog.length} товаров каталога</div>
        </div>
        <div class="hero-panel">
          <strong>Как работает подбор</strong>
          <ol>
            <li>Выберите категорию и вид растения</li>
            <li>Расскажите о своих пожеланиях простыми словами</li>
            <li>Получите до 10 сортов с фото и объяснением</li>
          </ol>
        </div>
      </section>`;
  }

  function renderGroups() {
    app.innerHTML = `
      <section class="section-shell">
        <div class="section-head">
          <p class="eyebrow">Шаг 1</p>
          <h1>Что вы хотите посадить?</h1>
          <p>Выберите большую категорию. На следующем шаге можно указать конкретный вид или попросить помощника определиться.</p>
        </div>
        <form class="quick-search" id="quick-search-form" role="search">
          <label for="plant-search">Или найдите растение сразу</label>
          <div class="quick-search-field">
            <span aria-hidden="true">⌕</span>
            <input id="plant-search" type="search" autocomplete="off" placeholder="Например: яблоня Уралец, голубика, розовая гортензия" value="${escapeHtml(state.searchQuery)}">
            <button type="submit">Найти</button>
          </div>
          <small>Простой поиск по названию вида, сорта и описанию</small>
        </form>
        <div class="quick-search-results" id="quick-search-results" aria-live="polite"></div>
        <div class="groups-grid">
          ${groups.map((group) => `
            <button class="group-card" type="button" data-group="${group.id}">
              <span class="group-photo-wrap">
                <img class="group-photo" src="${escapeHtml(group.image)}" alt="${escapeHtml(group.title)}" loading="lazy" data-fallback>
                <span class="group-icon" aria-hidden="true">${group.icon}</span>
              </span>
              <span class="group-card-copy">
                <strong>${escapeHtml(group.title)}</strong>
                <small>${escapeHtml(group.subtitle)}</small>
              </span>
            </button>`).join('')}
        </div>
      </section>`;
    if (state.searchQuery) renderQuickSearchResults(state.searchQuery);
  }

  function searchCatalog(query, limit = 10) {
    const normalized = query.trim().toLocaleLowerCase('ru');
    if (normalized.length < 2) return [];
    const tokens = normalized.split(/\s+/).filter((token) => token.length > 1);
    const scored = catalog.map((product) => {
      const name = `${product.variety} ${product.name}`.toLocaleLowerCase('ru');
      const description = product.description.toLocaleLowerCase('ru');
      if (!tokens.every((token) => name.includes(token) || description.includes(token))) return null;
      let score = name.includes(normalized) ? 100 : 0;
      score += tokens.reduce((sum, token) => sum + (name.includes(token) ? 12 : 2), 0);
      return { product, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.product.variety.localeCompare(b.product.variety, 'ru'));

    const unique = new Map();
    for (const item of scored) {
      const key = item.product.variety.toLocaleLowerCase('ru');
      if (!unique.has(key)) unique.set(key, item.product);
      if (unique.size >= limit) break;
    }
    return [...unique.values()];
  }

  function renderQuickSearchResults(query) {
    const container = document.querySelector('#quick-search-results');
    if (!container) return;
    const results = searchCatalog(query, 8);
    if (query.trim().length < 2) {
      container.innerHTML = '';
      return;
    }
    if (!results.length) {
      container.innerHTML = `<div class="search-empty">Ничего не найдено. Попробуйте написать только вид растения или часть названия сорта.</div>`;
      return;
    }
    container.innerHTML = `
      <div class="search-result-head"><strong>Найдено: ${results.length}</strong><button type="button" data-action="search-clear">Очистить</button></div>
      <div class="search-result-list">
        ${results.map((product) => {
          const branch = branchMap.get(product.species);
          return `<article class="search-result-card">
            <img src="${escapeHtml(product.picture || fallbackForSpecies(product.species))}" alt="${escapeHtml(product.variety)}" style="background-image:url('${escapeHtml(fallbackForSpecies(product.species))}')" data-fallback data-fallback-src="${escapeHtml(fallbackForSpecies(product.species))}">
            <div><small>${escapeHtml(branch?.title || '')}</small><strong>${escapeHtml(product.variety)}</strong><span>${formatPrice(product.price)} ${regularPriceMarkup(product)}</span>${isDiscounted(product) ? '<mark class="discount-inline">Скидка</mark>' : ''}<em>Есть в наличии</em></div>
            <button type="button" data-branch="${product.species}">Подобрать похожие</button>
            <a href="${escapeHtml(product.purchaseUrl)}" target="_blank" rel="noopener" aria-label="Открыть ${escapeHtml(product.variety)} на сайте">На сайт ↗</a>
          </article>`;
        }).join('')}
      </div>`;
  }

  function renderSpecies() {
    const group = currentGroup();
    const items = branches.filter((branch) => branch.group === group.id);
    const helper = group.helper ? helperFlows[group.helper] : null;
    const helperCard = helper ? `
      <button class="species-card helper-card" type="button" data-helper="${group.helper}">
        <span class="species-image-wrap" aria-hidden="true">?</span>
        <span class="species-card-content">
          <strong>${group.id === 'fruit' ? 'Не знаю — помогите выбрать' : 'Не могу определиться'}</strong>
          <small>Шесть простых вопросов, после которых помощник предложит подходящий вид.</small>
        </span>
      </button>` : '';

    app.innerHTML = `
      <section class="section-shell">
        ${breadcrumbs(group.title)}
        <div class="section-head">
          <p class="eyebrow">Шаг 2</p>
          <h1>${escapeHtml(group.title)}</h1>
          <p>Выберите вид. У каждого — собственная ветка из шести вопросов, подходящих именно этому растению.</p>
        </div>
        <div class="species-grid">
          ${items.map((branch) => speciesCard(branch)).join('')}
          ${helperCard}
        </div>
      </section>`;
  }

  function speciesCard(branch) {
    const products = catalog.filter((product) => product.species === branch.id);
    const photo = products.find((product) => product.picture)?.picture || fallbackImage;
    const varieties = new Set(products.map((product) => product.variety.toLocaleLowerCase('ru'))).size;
    return `
      <button class="species-card" type="button" data-branch="${branch.id}">
        <img class="species-image" src="${escapeHtml(photo)}" alt="${escapeHtml(branch.title)}" style="background-image:url('${escapeHtml(fallbackForSpecies(branch.id))}')" data-fallback data-fallback-src="${escapeHtml(fallbackForSpecies(branch.id))}">
        <span class="species-card-content">
          <strong>${escapeHtml(branch.title)}</strong>
          <small>${escapeHtml(branch.intro)}</small>
          <small class="species-count">${pluralize(varieties, 'сорт', 'сорта', 'сортов')} в каталоге</small>
        </span>
      </button>`;
  }

  function pluralize(number, one, few, many) {
    const mod10 = number % 10;
    const mod100 = number % 100;
    const word = mod10 === 1 && mod100 !== 11 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many;
    return `${number} ${word}`;
  }

  function startBranch(branchId) {
    const branch = branchMap.get(branchId);
    if (!branch) return;
    state.groupId = branch.group;
    state.branchId = branchId;
    state.helperId = null;
    state.questionIndex = 0;
    state.answers = [];
    trackAnalytics('branch_open', {species: branchId});
    setScreen('quiz');
  }

  function startHelper(helperId) {
    const helper = helperFlows[helperId];
    if (!helper) return;
    state.groupId = helper.group;
    state.helperId = helperId;
    state.branchId = null;
    state.questionIndex = 0;
    state.answers = [];
    trackAnalytics('helper_start', {target: helperId});
    setScreen('helper-quiz');
  }

  function renderQuiz() {
    const branch = currentBranch();
    const question = branch.questions[state.questionIndex];
    renderQuestionShell({
      groupTitle: currentGroup().title,
      branchTitle: branch.title,
      intro: branch.intro,
      question,
      total: branch.questions.length,
      helper: false,
    });
  }

  function renderHelperQuiz() {
    const helper = helperFlows[state.helperId];
    const question = helper.questions[state.questionIndex];
    renderQuestionShell({
      groupTitle: currentGroup().title,
      branchTitle: helper.title,
      intro: helper.intro,
      question,
      total: helper.questions.length,
      helper: true,
    });
  }

  function renderQuestionShell({ groupTitle, branchTitle, intro, question, total, helper }) {
    const progress = Math.round(((state.questionIndex + 1) / total) * 100);
    const visibleOptions = question.options
      .map((answer, index) => ({ answer, index }))
      .filter(({ answer }) => helper || answer.neutral || candidateCountForAnswer(answer) > 0);
    app.innerHTML = `
      <section class="section-shell quiz-shell">
        ${breadcrumbs(groupTitle, branchTitle)}
        <div class="progress-meta">
          <span>${escapeHtml(intro)}</span>
          <strong>${progress}%</strong>
        </div>
        <div class="progress-track" aria-hidden="true"><div class="progress-value" style="width:${progress}%"></div></div>
        <div class="question-card">
          <div class="question-number">Вопрос ${state.questionIndex + 1} из ${total}</div>
          <h1>${escapeHtml(question.title)}</h1>
          <p class="question-hint">${escapeHtml(question.hint)}</p>
          <div class="answer-list">
            ${visibleOptions.map(({ answer, index }) => {
              const count = helper ? null : candidateCountForAnswer(answer);
              return `
                <button class="answer-button${answer.neutral ? ' neutral' : ''}" type="button" data-answer="${index}" data-helper-answer="${helper ? 'true' : 'false'}">
                  <span>${escapeHtml(answer.label)}</span>
                  ${helper ? '' : `<small>${answer.neutral ? 'Без ограничения' : pluralize(count, 'сорт подтверждает', 'сорта подтверждают', 'сортов подтверждают')}</small>`}
                </button>`;
            }).join('')}
          </div>
          ${helper ? '' : '<p class="question-source-note">Показаны только ответы, которые подтверждены описанием хотя бы одного сорта. Если выбранные пожелания не сочетаются в одном сорте, помощник предложит ближайшие варианты по 2–3 подтверждённым критериям.</p>'}
          <div class="quiz-actions">
            <button class="secondary-button" type="button" data-action="quiz-back">← Назад</button>
            <button class="secondary-button" type="button" data-action="species">Сменить вид</button>
          </div>
        </div>
      </section>`;
  }

  function chooseAnswer(index, isHelper) {
    const source = isHelper ? helperFlows[state.helperId] : currentBranch();
    const question = source.questions[state.questionIndex];
    state.answers[state.questionIndex] = question.options[index];
    state.questionIndex += 1;
    if (state.questionIndex >= source.questions.length) {
      trackAnalytics(isHelper ? 'helper_complete' : 'selection_complete', {
        target: isHelper ? state.helperId : '',
        species: isHelper ? '' : state.branchId,
      });
      setScreen(isHelper ? 'helper-results' : 'results');
    } else {
      render();
    }
  }

  function goQuizBack() {
    if (state.questionIndex > 0) {
      state.questionIndex -= 1;
      state.answers = state.answers.slice(0, state.questionIndex);
      render();
    } else {
      setScreen('species');
    }
  }

  function textForProduct(product) {
    return `${product.name} ${product.variety} ${product.description}`.toLocaleLowerCase('ru');
  }

  function candidateCountForAnswer(answer) {
    const products = catalog.filter((product) => product.species === state.branchId);
    const matching = products.filter((product) => matchOption(product, answer).matches);
    return groupByVariety(matching).length;
  }

  function findTerm(text, term) {
    try {
      const pattern = new RegExp(term, 'igu');
      for (const match of text.matchAll(pattern)) {
        const leftContext = text.slice(Math.max(0, (match.index || 0) - 55), match.index || 0).split(/[.!?;,:]/).pop() || '';
        const rightContext = text.slice((match.index || 0) + match[0].length, (match.index || 0) + match[0].length + 45).split(/[.!?;,:]/)[0] || '';
        const negatedBefore = /(?:^|\s)(?:без|нет|не\s+(?:имеет|образует|да[её]т|переносит|подтвержда[а-яё]*|рекоменду[а-яё]*|установлен[а-яё]*|классифицирован[а-яё]*)|(?:плохо|слабо)\s+переносит|отсутств[а-яё]*)\s+(?:\S+\s+){0,5}$/iu.test(leftContext);
        const negatedAfter = /^\s+(?:не|нет)\s+(?:подтвержден[а-яё]*|установлен[а-яё]*|опубликован[а-яё]*|классифицирован[а-яё]*|использу[а-яё]*|участву[а-яё]*|рекоменду[а-яё]*)/iu.test(rightContext);
        const negated = negatedBefore || negatedAfter;
        if (!negated) return match[0];
      }
      return null;
    } catch {
      return text.includes(String(term).toLocaleLowerCase('ru')) ? term : null;
    }
  }

  function matchingSegments(product, option) {
    const catalogSegments = [product.name, ...product.description.split(/[.!?;]+/)]
      .map((text) => ({ text: text.trim(), origin: 'catalog', source: null }))
      .filter((segment) => segment.text);
    const relevantFacts = [...(product.sourcedFacts || [])]
      .sort((a, b) => (a.priority ?? 20) - (b.priority ?? 20))
      .filter((fact) => !fact.characteristicIds?.length || fact.characteristicIds.includes(option.questionId));
    const externalSegments = relevantFacts
      .map((fact) => ({ text: fact.text, origin: 'external', source: fact.source }));
    // A reviewed fact can explicitly replace obsolete catalog wording for its
    // scoped characteristic. Older audits keep source-first fallback behavior
    // until their facts are upgraded to the same strict standard.
    return relevantFacts.some((fact) => fact.supersedesCatalog)
      ? externalSegments
      : [...externalSegments, ...catalogSegments];
  }

  function matchOption(product, option) {
    if (!option || option.neutral) {
      return { matches: true, evidence: null };
    }
    if (Array.isArray(option.allTerms) && option.allTerms.length) {
      const fullText = matchingSegments(product, option).map((segment) => segment.text).join(' ').toLocaleLowerCase('ru');
      const matchedAll = option.allTerms.every((term) => Boolean(findTerm(fullText, term)));
      return { matches: matchedAll, evidence: matchedAll ? option.allTerms.join(' + ') : null };
    }
    if (!Array.isArray(option.terms) || option.terms.length === 0) return { matches: true, evidence: null };
    for (const segment of matchingSegments(product, option)) {
      for (const term of option.terms) {
        const evidence = findTerm(segment.text.toLocaleLowerCase('ru'), term);
        if (evidence) return { matches: true, evidence };
      }
    }
    return { matches: false, evidence: null };
  }

  function exactProductMatches(product) {
    return state.answers.every((answer) => matchOption(product, answer).matches);
  }

  function selectedCriteria() {
    return state.answers.filter((answer) => answer && !answer.neutral);
  }

  function evidenceSnippet(product, option) {
    if (option.allTerms?.length) {
      const sources = [product.description, product.name].filter(Boolean);
      const evidenceParts = option.allTerms.map((term) => {
        for (const source of sources) {
          const sentence = source.split(/[.!?;]+/).map((item) => item.trim()).find((item) => findTerm(item.toLocaleLowerCase('ru'), term));
          if (sentence) return sentence;
        }
        return '';
      }).filter(Boolean);
      const combined = [...new Set(evidenceParts)].join(' • ');
      return { text: combined.length > 260 ? `${combined.slice(0, 257).trim()}…` : combined, source: null };
    }
    for (const segment of matchingSegments(product, option)) {
      if (option.terms.some((term) => findTerm(segment.text.toLocaleLowerCase('ru'), term))) {
        const text = segment.text.length > 230 ? `${segment.text.slice(0, 227).trim()}…` : segment.text;
        return { text, source: segment.source };
      }
    }
    return { text: '', source: null };
  }

  function confirmedCriteria(product, criteria = selectedCriteria()) {
    return criteria
      .filter((answer) => matchOption(product, answer).matches)
      .map((answer) => {
        const evidence = evidenceSnippet(product, answer);
        return { label: answer.label, questionId: answer.questionId, evidence: evidence.text, evidenceSource: evidence.source };
      });
  }

  function groupByVariety(products) {
    const map = new Map();
    for (const product of products) {
      const key = product.variety.toLocaleLowerCase('ru');
      const previous = map.get(key);
      if (!previous || (product.picture && !previous.picture) || product.price < previous.price) {
        map.set(key, product);
      }
    }
    return [...map.values()].sort((a, b) => a.variety.localeCompare(b.variety, 'ru'));
  }

  function partialRecommendations(products, criteria) {
    if (criteria.length < 2) return [];
    const scored = products
      .map((product) => ({ product, matches: confirmedCriteria(product, criteria) }))
      .filter((candidate) => candidate.matches.length >= 2 && candidate.matches.length < criteria.length)
      .sort((a, b) => b.matches.length - a.matches.length || a.product.variety.localeCompare(b.product.variety, 'ru'));

    const unique = new Map();
    for (const candidate of scored) {
      const key = candidate.product.variety.toLocaleLowerCase('ru');
      const previous = unique.get(key);
      if (!previous || candidate.matches.length > previous.matches.length || candidate.product.price < previous.product.price) {
        unique.set(key, candidate);
      }
    }
    return [...unique.values()].sort((a, b) => b.matches.length - a.matches.length || a.product.variety.localeCompare(b.product.variety, 'ru'));
  }

  function generalRecommendations(products) {
    return groupByVariety(products).slice(0, 10).map((product) => ({ product, matches: [] }));
  }

  function renderResults() {
    const branch = currentBranch();
    const allForSpecies = catalog.filter((product) => product.species === branch.id);
    const exact = groupByVariety(allForSpecies.filter(exactProductMatches));
    const criteria = selectedCriteria();
    const partial = exact.length ? [] : partialRecommendations(allForSpecies, criteria);
    const mode = exact.length ? 'exact' : partial.length ? 'partial' : 'general';
    const candidates = mode === 'exact'
      ? exact.map((product) => ({ product, matches: confirmedCriteria(product, criteria) }))
      : mode === 'partial' ? partial : generalRecommendations(allForSpecies);
    const shown = candidates.slice(0, 10);
    const heading = mode === 'exact' ? 'Подходящие сорта' : mode === 'partial' ? 'Ближайшие подходящие сорта' : `Рекомендации: ${branch.title}`;
    const eyebrow = mode === 'exact' ? 'Точный результат' : mode === 'partial' ? 'Подбор по подтверждённым критериям' : 'Рекомендации помощника';
    const resultText = mode === 'exact'
      ? `${pluralize(exact.length, 'сорт соответствует', 'сорта соответствуют', 'сортов соответствуют')} всем выбранным ответам`
      : mode === 'partial'
        ? `${pluralize(partial.length, 'сорт совпал', 'сорта совпали', 'сортов совпали')} минимум по двум выбранным критериям`
        : 'Сортов с двумя подтверждёнными совпадениями не найдено — показываем варианты выбранного вида для сравнения';

    const notice = mode === 'exact'
      ? exact.length < 5
        ? `Найдено меньше пяти полных совпадений. Помощник не добавляет сорта, которые противоречат вашим ответам. Другие варианты, точную цену и наличие уточняйте в выбранном <a href="#garden-centers">садовом центре</a>.`
        : `Показано до 10 полных совпадений. Точную цену и актуальное наличие уточняйте в выбранном <a href="#garden-centers">садовом центре</a>.`
      : mode === 'partial'
        ? `Сорта, полностью совпадающего со всеми ответами, нет. Поэтому ниже показаны ближайшие варианты: у каждого описанием подтверждены 2–3 или больше выбранных характеристик. Неподтверждённые условия помощник совпадением не считает.`
        : `Полного совпадения и вариантов с двумя подтверждёнными критериями нет. Ниже — рекомендации для сравнения. Получить персональную консультацию можно в онлайн-поддержке, а цену и наличие уточнить в выбранном <a href="#garden-centers">садовом центре</a>.`;

    app.innerHTML = `
      <section class="section-shell">
        ${breadcrumbs(currentGroup().title, branch.title)}
        <div class="results-top">
          <div>
            <p class="eyebrow">${eyebrow}</p>
            <h1>${escapeHtml(heading)}</h1>
            <p class="result-count">${escapeHtml(resultText)}</p>
          </div>
          <button class="secondary-button" type="button" data-action="restart-quiz">Изменить ответы</button>
        </div>
        <div class="criteria-list">
          ${criteria.length ? criteria.map((answer) => `<span class="criterion-chip">${escapeHtml(answer.label)}</span>`).join('') : '<span class="criterion-chip">Без дополнительных ограничений</span>'}
        </div>
        <div class="notice">
          <span>${notice}</span>
        </div>
        ${shown.length ? `<div class="products-grid">${shown.map((candidate) => productCard(candidate, branch, mode)).join('')}</div>` : noResults(branch)}
      </section>`;
  }

  function productCard(candidate, branch, mode) {
    const { product, matches } = candidate;
    const reasons = matches.length
      ? matches.slice(0, mode === 'partial' ? 3 : 6)
      : [{ label: `Рекомендуем посмотреть сорт из раздела «${branch.title}»`, evidence: (product.description || '').split(/[.!?]/)[0] }];
    const description = product.description.length > 360 ? `${product.description.slice(0, 357).trim()}…` : product.description;
    const image = product.picture || fallbackImage;
    const references = [
      { title: 'Описание товара в каталоге питомника SIBGARD', url: product.purchaseUrl },
      ...(product.references || []),
    ];
    const selectedQuestionIds = new Set(reasons.map((reason) => reason.questionId).filter(Boolean));
    const relevantExternalFacts = (product.sourcedFacts || [])
      .filter((fact) => fact.characteristicIds?.some((id) => selectedQuestionIds.has(id)))
      .filter((fact, index, items) => items.findIndex((item) => item.text === fact.text && item.source.url === fact.source.url) === index);
    return `
      <article class="product-card">
        <div class="product-image-wrap">
          <img class="product-image" src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy" style="background-image:url('${escapeHtml(fallbackForSpecies(product.species))}')" data-fallback data-fallback-src="${escapeHtml(fallbackForSpecies(product.species))}">
          <span class="availability">Есть в наличии</span>
          ${isDiscounted(product) ? '<span class="discount-badge">Скидка</span>' : ''}
          ${mode === 'partial' ? `<span class="match-count">Совпало критериев: ${matches.length}</span>` : ''}
        </div>
        <div class="product-content">
          <h2>${escapeHtml(product.variety)}</h2>
          <div class="price-row">
            <span class="price-stack"><span class="price">${formatPrice(product.price)}</span>${regularPriceMarkup(product)}</span>
            <span class="price-note">${isDiscounted(product) ? 'Акционная цена' : 'точную цену уточните'}</span>
          </div>
          <p class="product-description">${escapeHtml(description || 'Описание сорта подтверждается карточкой каталога.')}</p>
          ${product.description.length > 360 ? `<details class="product-details"><summary>Полное описание</summary><p>${escapeHtml(product.description)}</p></details>` : ''}
          ${references.length ? `
            <div class="product-references">
              <strong>Проверенные источники характеристик</strong>
              <ul>${references.map((reference) => `<li><a href="${escapeHtml(reference.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(reference.title)} ↗</a></li>`).join('')}</ul>
            </div>` : ''}
          <div class="why-box">
            <strong>${mode === 'partial' ? 'Подтверждённые совпадения' : 'Почему помощник выбрал этот сорт'}</strong>
            <ul>${reasons.map((reason) => `<li><b>${escapeHtml(reason.label)}</b>${reason.evidence ? `<span>${reason.evidenceSource ? 'По внешнему источнику' : 'В описании каталога'}: «${escapeHtml(reason.evidence)}»${reason.evidenceSource ? ` <a href="${escapeHtml(reason.evidenceSource.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(reason.evidenceSource.title)} ↗</a>` : ''}</span>` : ''}</li>`).join('')}</ul>
          </div>
          <div class="external-evidence-box">
            <strong>Какие данные взяты из внешних источников для этого результата</strong>
            ${relevantExternalFacts.length
              ? `<ul>${relevantExternalFacts.map((fact) => {
                  const labels = reasons.filter((reason) => fact.characteristicIds.includes(reason.questionId)).map((reason) => reason.label).join(', ');
                  return `<li><b>${escapeHtml(labels)}:</b> ${escapeHtml(fact.text)} <a href="${escapeHtml(fact.source.url)}" target="_blank" rel="noopener noreferrer">Источник: ${escapeHtml(fact.source.title)} ↗</a></li>`;
                }).join('')}</ul>`
              : '<p>Для совпадений по выбранным критериям внешние данные не использовались — вывод сделан по описанию сорта в каталоге питомника.</p>'}
          </div>
          <div class="product-actions">
            <a class="buy-link" href="${escapeHtml(product.purchaseUrl)}" target="_blank" rel="noopener">Купить на сайте ↗</a>
            <a class="call-link" href="#garden-centers">Телефоны центров</a>
          </div>
        </div>
      </article>`;
  }

  function noResults(branch) {
    return `
      <div class="no-results">
        <h2>Слишком точное сочетание пожеланий</h2>
        <p>В описаниях сортов «${escapeHtml(branch.title)}» нет позиции, которая подтверждает сразу все выбранные характеристики. Измените один ответ на «Не важно» — помощник сохранит остальные условия.</p>
        <button class="primary-button green" type="button" data-action="restart-quiz">Вернуться к вопросам</button>
      </div>`;
  }

  function renderHelperResults() {
    const helper = helperFlows[state.helperId];
    const scores = new Map();
    state.answers.forEach((answer) => {
      Object.entries(answer.points || {}).forEach(([id, points]) => scores.set(id, (scores.get(id) || 0) + points));
    });
    const recommendations = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => branchMap.get(id))
      .filter(Boolean);

    app.innerHTML = `
      <section class="section-shell quiz-shell">
        ${breadcrumbs(currentGroup().title, helper.title)}
        <div class="section-head">
          <p class="eyebrow">Помощник определился</p>
          <h1>Начните с этих культур</h1>
          <p>Они лучше всего совпали с вашими ответами. Выберите одну — дальше будут шесть вопросов уже о сортах.</p>
        </div>
        <div class="helper-results">
          ${recommendations.map((branch, index) => `
            <div class="helper-result">
              <div>
                <h3>${index + 1}. ${escapeHtml(branch.title)}</h3>
                <p>${escapeHtml(branch.intro)}</p>
              </div>
              <button class="primary-button green" type="button" data-branch="${branch.id}">Подобрать сорта →</button>
            </div>`).join('')}
        </div>
        <div class="quiz-actions">
          <button class="secondary-button" type="button" data-action="helper-restart">Изменить ответы</button>
          <button class="secondary-button" type="button" data-action="species">Посмотреть все виды</button>
        </div>
      </section>`;
  }

  function resetToCategories() {
    state.groupId = null;
    state.branchId = null;
    state.helperId = null;
    state.questionIndex = 0;
    state.answers = [];
    setScreen('groups');
  }

  function render() {
    if (!catalog.length || !branches.length) {
      app.innerHTML = '<div class="notice"><span>Каталог не загрузился. Убедитесь, что папка data находится рядом с index.html.</span></div>';
      return;
    }
    const renders = {
      home: renderHome,
      groups: renderGroups,
      species: renderSpecies,
      quiz: renderQuiz,
      results: renderResults,
      'helper-quiz': renderHelperQuiz,
      'helper-results': renderHelperResults,
    };
    (renders[state.screen] || renderHome)();
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('button, a');
    if (!target) return;

    if (target.matches('.buy-link')) {
      const product = target.closest('.product-card')?.querySelector('h2')?.textContent || '';
      trackAnalytics('buy_click', {target: product, species: state.branchId});
    }
    if (target.matches('.call-link, a[href="#garden-centers"], a[href^="tel:"]')) {
      trackAnalytics('center_contacts_click', {species: state.branchId});
    }
    if (target.tagName === 'A' && !target.dataset.action) return;

    if (target.dataset.group) {
      trackAnalytics('category_open', {target: target.dataset.group});
      toggleSupport(false);
      state.groupId = target.dataset.group;
      setScreen('species');
      return;
    }
    if (target.dataset.branch) {
      toggleSupport(false);
      startBranch(target.dataset.branch);
      return;
    }
    if (target.dataset.helper) {
      startHelper(target.dataset.helper);
      return;
    }
    if (target.dataset.answer !== undefined) {
      chooseAnswer(Number(target.dataset.answer), target.dataset.helperAnswer === 'true');
      return;
    }
    if (target.dataset.supportQuestion) {
      askSupport(target.dataset.supportQuestion);
      return;
    }

    switch (target.dataset.action) {
      case 'home':
        state.screen = 'home';
        state.groupId = null;
        state.branchId = null;
        state.helperId = null;
        state.answers = [];
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'categories':
        trackAnalytics('assistant_start');
        resetToCategories();
        break;
      case 'species':
        state.branchId = null;
        state.helperId = null;
        state.questionIndex = 0;
        state.answers = [];
        setScreen('species');
        break;
      case 'quiz-back':
        goQuizBack();
        break;
      case 'restart-quiz':
        state.questionIndex = 0;
        state.answers = [];
        setScreen('quiz');
        break;
      case 'helper-restart':
        state.questionIndex = 0;
        state.answers = [];
        setScreen('helper-quiz');
        break;
      case 'search-clear':
        state.searchQuery = '';
        renderQuickSearchResults('');
        document.querySelector('#plant-search')?.focus();
        break;
      case 'support-open':
        trackAnalytics('support_open');
        toggleSupport(true);
        break;
      case 'support-close':
        toggleSupport(false);
        document.querySelector('.support-fab')?.focus();
        break;
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && supportPanel && !supportPanel.hidden) toggleSupport(false);
  });

  document.addEventListener('input', (event) => {
    if (event.target.id !== 'plant-search') return;
    state.searchQuery = event.target.value;
    renderQuickSearchResults(state.searchQuery);
  });

  document.addEventListener('submit', (event) => {
    if (event.target.id === 'quick-search-form') {
      event.preventDefault();
      state.searchQuery = document.querySelector('#plant-search')?.value || '';
      trackAnalytics('catalog_search');
      renderQuickSearchResults(state.searchQuery);
    }
    if (event.target.id === 'support-form') {
      event.preventDefault();
      const value = supportInput?.value || '';
      askSupport(value);
      if (supportInput) supportInput.value = '';
    }
  });

  document.addEventListener('error', (event) => {
    const image = event.target;
    if (image instanceof HTMLImageElement && image.hasAttribute('data-fallback') && !image.dataset.failed) {
      image.dataset.failed = 'true';
      image.src = image.dataset.fallbackSrc || fallbackImage;
    }
  }, true);

  const initialParams = new URLSearchParams(window.location.search);
  const initialBranch = branchMap.get(initialParams.get('branch'));
  const initialGroup = groupMap.get(initialParams.get('group'));
  if (initialBranch) {
    state.screen = 'quiz';
    state.branchId = initialBranch.id;
    state.groupId = initialBranch.group;
  } else if (initialGroup) {
    state.screen = 'species';
    state.groupId = initialGroup.id;
  } else if (initialParams.get('view') === 'categories') {
    state.screen = 'groups';
  }
  if (initialParams.get('q')) state.searchQuery = initialParams.get('q').trim();
  render();
  trackAnalytics('page_view');
  if (initialParams.get('support') === 'open') {
    trackAnalytics('support_open');
    toggleSupport(true);
  }
})();
