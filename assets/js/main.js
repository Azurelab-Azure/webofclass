/* ============================================
   我的课表 · 公共脚本 (最终整合版)
   ============================================ */

// ============================================
// 全局数据缓存
// ============================================
const SiteData = {
  site: null,
  links: null,
  changelog: null
};

// ============================================
// 全局主题 API
// ============================================
window.MyClassroomTheme = {
  apply: function (theme, ui) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-ui', ui);

    try {
      localStorage.setItem('theme', theme);
      localStorage.setItem('ui', ui);
    } catch (e) {}

    var icon = document.querySelector('.theme-toggle i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }

    document.querySelectorAll('.ui-switcher button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-ui') === ui);
    });

    window.dispatchEvent(new CustomEvent('myclassroom:themechange', {
      detail: { theme: theme, ui: ui }
    }));
  },
  get: function () {
    return {
      theme: document.documentElement.getAttribute('data-theme') || 'light',
      ui: document.documentElement.getAttribute('data-ui') || 'light'
    };
  }
};

// ============================================
// JSON 加载与替换
// ============================================
async function loadJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error('加载失败 ' + path);
    return await res.json();
  } catch (err) {
    console.warn('JSON 读取失败', path, err);
    return null;
  }
}

async function loadAllData() {
  const results = await Promise.all([
    loadJSON('assets/data/site.json'),
    loadJSON('assets/data/links.json'),
    loadJSON('assets/data/changelog.json')
  ]);
  SiteData.site = results[0] || {};
  SiteData.links = results[1] || {};
  SiteData.changelog = results[2] || null;
}

function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce(function (acc, key) {
    return acc && acc[key] !== undefined ? acc[key] : undefined;
  }, obj);
}

function applyLinks() {
  document.querySelectorAll('[data-link]').forEach(function (el) {
    const path = el.getAttribute('data-link');
    const url = getByPath(SiteData.links, path);
    if (url) el.setAttribute('href', url);
  });
}

function applyTexts() {
  document.querySelectorAll('[data-text]').forEach(function (el) {
    const path = el.getAttribute('data-text');
    const val = getByPath(SiteData.site, path);
    if (val !== undefined && val !== null) el.textContent = val;
  });
}

function applyLogos() {
  var logoMap = {
    main: 'assets/img/logo/logo.png',
    beta: 'assets/img/logo/logobeta.png'
  };
  if (SiteData.links && SiteData.links.logos) {
    if (SiteData.links.logos.main) logoMap.main = SiteData.links.logos.main;
    if (SiteData.links.logos.beta) logoMap.beta = SiteData.links.logos.beta;
  }
  document.querySelectorAll('[data-logo]').forEach(function (el) {
    var key = el.getAttribute('data-logo');
    var src = logoMap[key];
    if (src && el.tagName === 'IMG') el.setAttribute('src', src);
  });
}

function renderChangelog() {
  if (!SiteData.changelog) return;
  const currentBox = document.getElementById('changelogCurrent');
  if (currentBox && SiteData.changelog.current) {
    const c = SiteData.changelog.current;
    let html = '<h3>v' + c.version + ' · ' + c.date + '</h3><ul>';
    c.items.forEach(function (item) { html += '<li>' + item + '</li>'; });
    html += '</ul>';
    currentBox.innerHTML = html;
  }
  const historyBox = document.getElementById('changelogHistory');
  if (historyBox && SiteData.changelog.history) {
    let html = '<table class="tree-table"><thead><tr><th>版本</th><th>日期</th><th>说明</th></tr></thead><tbody>';
    SiteData.changelog.history.forEach(function (row) {
      html += '<tr><td>v' + row.version + '</td><td>' + row.date + '</td><td>' + row.note + '</td></tr>';
    });
    html += '</tbody></table>';
    historyBox.innerHTML = html;
  }
}

// ============================================
// 主题
// ============================================
function initTheme() {
  let theme = localStorage.getItem('theme');
  let ui = localStorage.getItem('ui');
  if (!theme) theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  if (!ui) ui = 'light';
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-ui', ui);
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-toggle i');
  if (!icon) return;
  icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function bindUISwitcher() {
  const buttons = document.querySelectorAll('.ui-switcher button');
  if (!buttons.length) return;
  const currentUI = document.documentElement.getAttribute('data-ui');
  buttons.forEach(function (btn) {
    if (btn.getAttribute('data-ui') === currentUI) btn.classList.add('active');
    btn.addEventListener('click', function () {
      const uiVal = btn.getAttribute('data-ui');
      const themeVal = uiVal === 'dark' ? 'dark' : 'light';
      window.MyClassroomTheme.apply(themeVal, uiVal);
    });
  });
}

function bindThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', function () {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    const uiVal = next === 'dark' ? 'dark' : 'light';
    window.MyClassroomTheme.apply(next, uiVal);
  });
  updateThemeIcon(document.documentElement.getAttribute('data-theme'));
}

// ============================================
// 动画与交互
// ============================================
function initScrollProgress() {
  if (document.querySelector('.scroll-progress')) return;
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  function update() {
    const doc = document.documentElement;
    const total = doc.scrollHeight - doc.clientHeight;
    const current = doc.scrollTop;
    bar.style.width = (total > 0 ? (current / total) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

function initStatCounters() {
  const nums = document.querySelectorAll('.stat-3d .num[data-target]');
  if (!nums.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.getAttribute('data-target'));
      const suffix = el.getAttribute('data-suffix') || '';
      const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / 1200, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.4 });
  nums.forEach(function (el) { io.observe(el); });
}

function initCardTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.card-3d').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(900px) rotateX(${((0.5 - y) * 14).toFixed(2)}deg) rotateY(${((x - 0.5) * 14).toFixed(2)}deg)`;
      el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });
    el.addEventListener('mouseleave', function () {
      el.style.transform = '';
      el.style.setProperty('--mx', '50%');
      el.style.setProperty('--my', '50%');
    });
  });
}

function initReveal() {
  const items = document.querySelectorAll('.reveal, .stat-3d');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('visible'); });
    return;
  }
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  items.forEach(function (el) { io.observe(el); });
}

// ============================================
// Cookie 条
// ============================================
function initCookieBanner() {
  const SESSION_KEY = 'myclassroom_cookie_shown';
  const CONSENT_KEY = 'myclassroom_cookie_consent';
  try { if (sessionStorage.getItem(SESSION_KEY) === '1') return; } catch (e) {}

  function setConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ value: value, time: Date.now() }));
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch (e) {}
  }

  const mask = document.createElement('div');
  mask.className = 'cookie-mask';
  document.body.appendChild(mask);

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.innerHTML = `
    <div class="cookie-inner">
      <div class="cookie-icon"><i class="fa-solid fa-cookie-bite"></i></div>
      <div class="cookie-text">
        <strong>本站只使用必要的本地存储。</strong>用于记住你的主题偏好，不做追踪、不做广告。
      </div>
      <div class="cookie-actions">
        <button type="button" class="btn btn-secondary" data-cookie="decline">仅必要</button>
        <button type="button" class="btn btn-primary" data-cookie="accept">知道了</button>
      </div>
    </div>`;
  document.body.appendChild(banner);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      mask.classList.add('show');
      banner.classList.add('show');
    });
  });

  banner.addEventListener('click', function (e) {
    const t = e.target.closest('[data-cookie]');
    if (!t) return;
    setConsent(t.getAttribute('data-cookie'));
    banner.classList.remove('show');
    mask.classList.remove('show');
    setTimeout(() => { banner.remove(); mask.remove(); }, 500);
  });
}

function initSmoothAnchor() {
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href === '#' || href === '#top') return;
    const el = document.querySelector(href);
    if (!el) return;
    e.preventDefault();
    const top = el.getBoundingClientRect().top + window.pageYOffset - 100;
    window.scrollTo({ top: top, behavior: 'smooth' });
    history.replaceState(null, '', href);
  });
}

// ============================================
// 移动端菜单 (最终修复版)
// ============================================
function initMobileMenu() {
  var navbarRight = document.querySelector('.navbar-right');
  var navLinks = document.querySelector('.navbar-links');
  
  if (!navbarRight || !navLinks) return;
  if (document.getElementById('mobileMenuToggle')) return;

  // 1. 创建顶部汉堡按钮
  var toggleBtn = document.createElement('button');
  toggleBtn.className = 'mobile-menu-toggle';
  toggleBtn.id = 'mobileMenuToggle';
  toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
  navbarRight.appendChild(toggleBtn);

  // 2. 创建遮罩与抽屉
  var overlay = document.createElement('div');
  overlay.className = 'mobile-menu-overlay';
  overlay.id = 'mobileMenuOverlay';

  var menu = document.createElement('div');
  menu.className = 'mobile-menu';
  menu.id = 'mobileMenu';

  // 3. 组装抽屉内容
  var closeBtn = document.createElement('button');
  closeBtn.className = 'mobile-menu-close';
  closeBtn.id = 'mobileMenuClose';
  closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';

  var title = document.createElement('span');
  title.className = 'mobile-menu-title';
  title.textContent = '菜单';

  var header = document.createElement('div');
  header.className = 'mobile-menu-header';
  header.appendChild(title);
  header.appendChild(closeBtn);

  var ul = document.createElement('ul');
  ul.className = 'mobile-menu-links';
  ul.innerHTML = navLinks.innerHTML;

  menu.appendChild(header);
  menu.appendChild(ul);

  document.body.appendChild(overlay);
  document.body.appendChild(menu);

  // 4. 绑定事件
  function openMenu() {
    menu.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);

  ul.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('active')) closeMenu();
  });
}

// ============================================
// 主入口
// ============================================
async function bootstrap() {
  try { initTheme(); } catch (e) {}
  try { await loadAllData(); } catch (e) {}
  try { applyLinks(); } catch (e) {}
  try { applyTexts(); } catch (e) {}
  try { applyLogos(); } catch (e) {}
  try { renderChangelog(); } catch (e) {}
  try { bindUISwitcher(); } catch (e) {}
  try { bindThemeToggle(); } catch (e) {}
  try { initScrollProgress(); } catch (e) {}
  try { initStatCounters(); } catch (e) {}
  try { initCardTilt(); } catch (e) {}
  try { initReveal(); } catch (e) {}
  try { initCookieBanner(); } catch (e) {}
  try { initSmoothAnchor(); } catch (e) {}
  try { initMobileMenu(); } catch (e) { console.warn('移动端菜单初始化失败', e); }

  document.documentElement.classList.remove('js-loading');
  document.body.classList.add('body-ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}