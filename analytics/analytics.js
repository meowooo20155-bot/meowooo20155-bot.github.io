(() => {
  const root = document.querySelector('#analytics-root');
  const WRAPPED_SECRET = {iterations:600000,salt:'0gtxJXLfOCPSuZ/AA7uUSA==',iv:'gTQD2YzD60NQCAGW',ciphertext:'wjgTWsATvcIdQfmRqkcvuvEgq94XcZ4LBtHZx6IjXGuMfNV0W0N8Lu29lI3Sj5UD'};
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const secretSession = 'sibgard_owner_secret_v1';
  const fromBase64 = (value) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  const toBase64 = (bytes) => { let binary=''; for(const byte of bytes) binary+=String.fromCharCode(byte); return btoa(binary); };
  const escapeHtml = (value='') => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const number = (value) => new Intl.NumberFormat('ru-RU').format(Number(value || 0));

  async function unwrapSecret(password) {
    const material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);
    const key=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:fromBase64(WRAPPED_SECRET.salt),iterations:WRAPPED_SECRET.iterations},material,{name:'AES-GCM',length:256},false,['decrypt']);
    const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromBase64(WRAPPED_SECRET.iv)},key,fromBase64(WRAPPED_SECRET.ciphertext));
    return toBase64(new Uint8Array(plaintext));
  }

  async function decryptSnapshot(secret) {
    const response=await fetch(`../data/analytics.enc.json?v=${Date.now()}`,{cache:'no-store'});
    if(!response.ok) throw new Error('Статистика ещё обновляется. Попробуйте через минуту.');
    const sealed=await response.json();
    const material=await crypto.subtle.digest('SHA-256',encoder.encode(`snapshot:${secret}`));
    const key=await crypto.subtle.importKey('raw',material,{name:'AES-GCM'},false,['decrypt']);
    const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromBase64(sealed.iv)},key,fromBase64(sealed.ciphertext));
    return JSON.parse(decoder.decode(plaintext));
  }

  function card(label,value,note){return `<article class="metric"><span>${escapeHtml(label)}</span><strong>${number(value)}</strong><small>${escapeHtml(note)}</small></article>`;}
  function bars(rows,labels={}){if(!rows?.length)return '<p class="empty">Данные пока не собраны.</p>';const max=Math.max(...rows.map(row=>Number(row.value||0)),1);return `<div class="bar-list">${rows.map(row=>`<div class="bar-row"><div><span>${escapeHtml(labels[row.label]||row.label||'Не определено')}</span><strong>${number(row.value)}</strong></div><i style="width:${Math.max(4,Math.round(Number(row.value||0)/max*100))}%"></i></div>`).join('')}</div>`;}

  function renderDashboard(payload){
    const s=payload.stats;const updated=new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Novosibirsk',dateStyle:'medium',timeStyle:'short'}).format(new Date(payload.generatedAt));
    const deviceLabels={iphone:'iPhone',ipad:'iPad',android:'Android',mobile:'Другие телефоны',desktop:'Компьютеры',tablet:'Другие планшеты',unknown:'Не определено'};
    const siteLabels={sites:'Основной сайт',github:'GitHub Pages'};
    root.innerHTML=`<main class="wrap"><header class="top"><div><p class="eyebrow">Только для владельца</p><h1>Онлайн-статистика SIBGARD</h1><p>Новосибирск (UTC+7) · данные обновлены ${escapeHtml(updated)}</p></div><nav class="actions"><a href="/admin/">Админ-панель</a><button data-refresh>Обновить</button><button data-logout>Выйти</button></nav></header><section class="metrics">
    ${card('Всего пользователей',s.totalVisitors,'уникальные браузеры')}${card('Сегодня',s.todayVisitors,'уникальные пользователи')}${card('За 7 дней',s.weekVisitors,'уникальные пользователи')}${card('За 30 дней',s.monthVisitors,'уникальные пользователи')}${card('Всего входов',s.pageViews,'каждое открытие помощника')}${card('Входов сегодня',s.todayEntries,'включая повторные')}${card('Входов за 7 дней',s.weekEntries,'включая повторные')}${card('Входов за 30 дней',s.monthEntries,'включая повторные')}${card('Сеансы',s.totalSessions,'отдельные визиты')}${card('Начали подбор',s.startedVisitors,'уникальные пользователи')}${card('Завершили подбор',s.completedVisitors,'уникальные пользователи')}${card('Открыли поддержку',s.supportOpens,'все открытия')}${card('Перешли к покупке',s.buyClicks,'нажатия на покупку')}${card('Открыли телефоны',s.contactsClicks,'переходы к контактам')}</section><section class="grid"><article class="panel"><h2>Устройства</h2><p>iPhone, Android и компьютеры</p>${bars(s.devices,deviceLabels)}</article><article class="panel"><h2>Версии сайта</h2><p>Просмотры GitHub Pages и основной версии</p>${bars(s.sites,siteLabels)}</article><article class="panel"><h2>Популярные растения</h2><p>Какие ветки открывают чаще</p>${bars(s.species)}</article><article class="panel"><h2>Источники посещений</h2><p>Откуда пришли пользователи</p>${bars(s.sources)}</article></section><p class="privacy">Страница и зашифрованные данные размещены на GitHub Pages и открываются без VPN. Снимок автоматически обновляется примерно каждые 10 минут.</p></main>`;
  }

  function renderLogin(message=''){
    root.innerHTML=`<main class="login"><section class="login-card"><p class="brand">SIBGARD · САДЫ СИБИРИ</p><h1>Вход в статистику</h1><p>Страница работает через GitHub и открывается без VPN.</p>${message?`<p class="error" role="alert">${escapeHtml(message)}</p>`:''}<form id="login-form"><label for="password">Пароль</label><input id="password" type="password" autocomplete="current-password" required autofocus><button type="submit">Войти</button></form></section></main>`;
    document.querySelector('#login-form').addEventListener('submit',async(event)=>{event.preventDefault();try{const secret=await unwrapSecret(document.querySelector('#password').value);sessionStorage.setItem(secretSession,secret);renderDashboard(await decryptSnapshot(secret));}catch{renderLogin('Неверный пароль или данные ещё обновляются.');}});
  }

  document.addEventListener('click',async(event)=>{if(event.target.closest('[data-logout]')){sessionStorage.removeItem(secretSession);renderLogin();}if(event.target.closest('[data-refresh]')){try{renderDashboard(await decryptSnapshot(sessionStorage.getItem(secretSession)));}catch(error){alert(error.message);}}});
  const saved=sessionStorage.getItem(secretSession);if(saved){decryptSnapshot(saved).then(renderDashboard).catch(()=>{sessionStorage.removeItem(secretSession);renderLogin();});}else renderLogin();
})();
