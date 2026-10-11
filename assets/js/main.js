/* ============================================
   我的课表 · 公共脚本
   功能：主题切换、UI 模式、JSON 数据加载、
        链接替换、滚动进度条、数字滚动、
        卡片 3D 倾斜、滚动淡入、Cookie 条、
        平滑锚点
   ============================================ */

// 全局数据缓存
const SiteData = {
  site: null,
  links: null,
  changelog: null
};

/**
 * 读取 JSON 文件
 * 输入路径返回解析后的对象
 * 读取失败返回 null 不抛异常
 */
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

/**
 * 批量加载站点数据
 * 依次读取 site、links、changelog
 * 任意一个失败都不影响其他
 */
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

/**
 * 按点分路径取值
 * 例如 getByPath(obj, 'download.installer')
 */
function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce(function (acc, key) {
    return acc && acc[key] !== undefined ? acc[key] : undefined;
  }, obj);
}

/**
 * 替换页面中所有 data-link 元素的 href
 * 元素写法 a data-link 等于 github
 */
function applyLinks() {
  document.querySelectorAll('[data-link]').forEach(function (el) {
    const path = el.getAttribute('data-link');
    const url = getByPath(SiteData.links, path);
    if (url) el.setAttribute('href', url);
  });
}

/**
 * 替换页面中所有 data-text 元素的文本
 * 用于版本号、版权年份、品牌名
 */
function applyTexts() {
  document.querySelectorAll('[data-text]').forEach(function (el) {
    const path = el.getAttribute('data-text');
    const val = getByPath(SiteData.site, path);
    if (val !== undefined && val !== null) el.textContent = val;
  });
}

/**
 * 渲染更新日志与历史版本
 * 用于 download.html 的 changelogCurrent 与 changelogHistory
 */
function renderChangelog() {
  if (!SiteData.changelog) return;

  const currentBox = document.getElementById('changelogCurrent');
  if (currentBox && SiteData.changelog.current) {
    const c = SiteData.changelog.current;
    let html = '<h3>v' + c.version + ' · ' + c.date + '</h3><ul>';
    c.items.forEach(function (item) {
      html += '<li>' + item + '</li>';
    });
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

/**
 * 初始化主题和 UI 模式
 * 优先读取本地存储否则跟随系统
 */
function initTheme() {
  let theme = localStorage.getItem('theme');
  let ui = localStorage.getItem('ui');

  if (!theme) {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  if (!ui) ui = 'light';

  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-ui', ui);
}

/**
 * 更新主题切换按钮的图标
 * 暗色显示太阳亮色显示月亮
 */
function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-toggle i');
  if (!icon) return;
  icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

/**
 * 绑定 UI 模式切换器
 * 四个圆点分别对应亮色暗色通透清新
 */
function bindUISwitcher() {
  const buttons = document.querySelectorAll('.ui-switcher button');
  if (!buttons.length) return;

  const currentUI = document.documentElement.getAttribute('data-ui');
  buttons.forEach(function (btn) {
    if (btn.getAttribute('data-ui') === currentUI) btn.classList.add('active');

    btn.addEventListener('click', function () {
      buttons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      const uiVal = btn.getAttribute('data-ui');
      document.documentElement.setAttribute('data-ui', uiVal);
      localStorage.setItem('ui', uiVal);

      // 通透和清新属于浅色系同步主题
      if (uiVal === 'clear' || uiVal === 'fresh') {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        updateThemeIcon('light');
      }
      // 暗色模式同步主题
      if (uiVal === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateThemeIcon('dark');
      }
    });
  });
}

/**
 * 绑定亮暗切换按钮
 * 点击时同步更新 UI 模式的选中状态
 */
function bindThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', function () {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);

    const uiVal = next === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-ui', uiVal);
    localStorage.setItem('ui', uiVal);
    document.querySelectorAll('.ui-switcher button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-ui') === uiVal);
    });
  });

  updateThemeIcon(document.documentElement.getAttribute('data-theme'));
}

/**
 * 滚动进度条
 * 页面顶部一条细线随滚动增长
 */
function initScrollProgress() {
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

/**
 * 数字滚动
 * 元素进入视口时从 0 跳到目标值
 * 用 easeOutCubic 缓动
 */
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
      const duration = 1200;
      const start = performance.now();

      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = val.toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.4 });

  nums.forEach(function (el) { io.observe(el); });
}

/**
 * 卡片 3D 倾斜
 * 鼠标在卡片上移动时轻微旋转
 * 同时更新光晕位置变量
 */
function initCardTilt() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  document.querySelectorAll('.card-3d').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const rx = (0.5 - y) * 14;
      const ry = (x - 0.5) * 14;
      el.style.transform =
        'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
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

/**
 * 滚动淡入
 * 元素进入视口时加 visible 类
 * 同时触发数字 3D 翻转动画
 */
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

/**
 * Cookie 同意条
 * 记录用户是否已确认本地存储使用
 * 一年内不再弹出
 */
function initCookieBanner() {
  const KEY = 'myclassroom_cookie_consent';
  const DAYS = 365;

  function getConsent() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.time) return null;
      if ((Date.now() - obj.time) / 86400000 > DAYS) {
        localStorage.removeItem(KEY);
        return null;
      }
      return obj;
    } catch (e) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ value: value, time: Date.now() }));
    } catch (e) {}
  }

  if (getConsent()) return;

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.innerHTML =
    '<div class="cookie-inner">' +
      '<div class="cookie-icon"><i class="fa-solid fa-cookie-bite"></i></div>' +
      '<div class="cookie-text">' +
        '<strong>本站只使用必要的本地存储。</strong>' +
        '用于记住你的主题偏好，不做追踪、不做广告。详见 ' +
        '<a href="cookie.html">Cookie 说明</a>。' +
      '</div>' +
      '<div class="cookie-actions">' +
        '<button type="button" class="btn btn-secondary" data-cookie="decline">仅必要</button>' +
        '<button type="button" class="btn btn-primary" data-cookie="accept">知道了</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(banner);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () { banner.classList.add('show'); });
  });

  banner.addEventListener('click', function (e) {
    const t = e.target.closest('[data-cookie]');
    if (!t) return;
    setConsent(t.getAttribute('data-cookie'));
    banner.classList.remove('show');
    setTimeout(function () { banner.remove(); }, 500);
  });
}

/**
 * 平滑锚点滚动
 * 自动避开导航栏高度
 */
function initCookieBanner() {
  const SESSION_KEY = 'myclassroom_cookie_shown';
  const CONSENT_KEY = 'myclassroom_cookie_consent';
  const DAYS = 365;

  // 本次会话已经弹过就直接返回
  try {
    if (sessionStorage.getItem(SESSION_KEY) === '1') return;
  } catch (e) {}

  function setConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        value: value,
        time: Date.now()
      }));
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch (e) {}
  }

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-modal', 'true');
  banner.innerHTML =
    '<div class="cookie-inner">' +
      '<div class="cookie-icon"><i class="fa-solid fa-cookie-bite"></i></div>' +
      '<div class="cookie-text">' +
        '<strong>本站只使用必要的本地存储。</strong>' +
        '用于记住你的主题偏好，不做追踪、不做广告。详见 ' +
        '<a href="cookie.html">Cookie 说明</a>。' +
      '</div>' +
      '<div class="cookie-actions">' +
        '<button type="button" class="btn btn-secondary" data-cookie="decline">仅必要</button>' +
        '<button type="button" class="btn btn-primary" data-cookie="accept">知道了</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(banner);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () { banner.classList.add('show'); });
  });

  banner.addEventListener('click', function (e) {
    const t = e.target.closest('[data-cookie]');
    if (!t) return;
    setConsent(t.getAttribute('data-cookie'));
    banner.classList.remove('show');
    setTimeout(function () { banner.remove(); }, 500);
  });
}


/**
 * 主入口
 * 所有初始化独立 try 保证一项失败不影响其他
 * 最后统一移除 js-loading 加 is-ready
 */
async function bootstrap() {
  try { initTheme(); } catch (e) { console.warn('主题初始化失败', e); }
  try { await loadAllData(); } catch (e) { console.warn('数据加载失败', e); }
  try { applyLinks(); } catch (e) { console.warn('链接替换失败', e); }
  try { applyTexts(); } catch (e) { console.warn('文本替换失败', e); }
  try { renderChangelog(); } catch (e) { console.warn('日志渲染失败', e); }
  try { bindUISwitcher(); } catch (e) { console.warn('UI 切换绑定失败', e); }
  try { bindThemeToggle(); } catch (e) { console.warn('主题切换绑定失败', e); }
  try { initScrollProgress(); } catch (e) { console.warn('滚动进度条失败', e); }
  try { initStatCounters(); } catch (e) { console.warn('数字滚动失败', e); }
  try { initCardTilt(); } catch (e) { console.warn('卡片倾斜失败', e); }
  try { initReveal(); } catch (e) { console.warn('滚动淡入失败', e); }
  try { initCookieBanner(); } catch (e) { console.warn('Cookie 条失败', e); }
  try { initSmoothAnchor(); } catch (e) { console.warn('锚点滚动失败', e); }

  document.documentElement.classList.remove('js-loading');
  document.body.classList.add('is-ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}