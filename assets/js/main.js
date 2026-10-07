/* ============================================
   我的课表 · 官网脚本 v1.2
   主题 + UI 模式 + 轮播 + 滚动淡入
   ============================================ */

// ---------- 主题 & UI 模式初始化 ----------
(function () {
  var theme = localStorage.getItem('theme');
  var ui = localStorage.getItem('ui');

  if (!theme) {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  if (!ui) ui = 'light';

  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-ui', ui);
})();

document.addEventListener('DOMContentLoaded', function () {

  // ---------- UI 模式切换器 ----------
  var uiButtons = document.querySelectorAll('.ui-switcher button');
  uiButtons.forEach(function (btn) {
    var ui = btn.getAttribute('data-ui');
    if (ui === document.documentElement.getAttribute('data-ui')) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', function () {
      uiButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      var uiVal = btn.getAttribute('data-ui');
      document.documentElement.setAttribute('data-ui', uiVal);
      localStorage.setItem('ui', uiVal);

      // 通透/清新是浅色系，切到这两个时把 data-theme 也同步为 light
      if (uiVal === 'clear' || uiVal === 'fresh') {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        updateThemeIcon('light');
      }
      // 点 dark 时同步主题为 dark
      if (uiVal === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateThemeIcon('dark');
      }
    });
  });

  // ---------- 亮/暗切换按钮（保留） ----------
  var toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      updateThemeIcon(next);

      // 亮/暗切换时，UI 模式同步
      var uiVal = next === 'dark' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-ui', uiVal);
      localStorage.setItem('ui', uiVal);
      uiButtons.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-ui') === uiVal);
      });
    });
    updateThemeIcon(document.documentElement.getAttribute('data-theme'));
  }

  function updateThemeIcon(theme) {
    var icon = document.querySelector('.theme-toggle i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
  }

  // ---------- 轮播 ----------
  document.querySelectorAll('.carousel').forEach(function (carousel) {
    var track = carousel.querySelector('.carousel-track');
    var slides = carousel.querySelectorAll('.carousel-slide');
    var prev = carousel.querySelector('.carousel-btn.prev');
    var next = carousel.querySelector('.carousel-btn.next');
    var dots = carousel.querySelectorAll('.carousel-dot');
    var index = 0;

    function go(i) {
      if (i < 0) i = slides.length - 1;
      if (i >= slides.length) i = 0;
      index = i;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      dots.forEach(function (d, di) {
        d.classList.toggle('active', di === index);
      });
    }

    if (prev) prev.addEventListener('click', function () { go(index - 1); });
    if (next) next.addEventListener('click', function () { go(index + 1); });
    dots.forEach(function (d, di) {
      d.addEventListener('click', function () { go(di); });
    });

    // 自动播放（可选）
    if (slides.length > 1) {
      var timer = setInterval(function () { go(index + 1); }, 6000);
      carousel.addEventListener('mouseenter', function () { clearInterval(timer); });
      carousel.addEventListener('mouseleave', function () {
        timer = setInterval(function () { go(index + 1); }, 6000);
      });
    }

    // 触摸滑动
    var startX = 0;
    track.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      if (dx > 50) go(index - 1);
      else if (dx < -50) go(index + 1);
    });

    go(0);
  });


  // ---------- 插件广场：分类 Tab 滚动 ----------
  var storeTabs = document.querySelectorAll('#storeTabs .store-tab');
  if (storeTabs.length) {
    storeTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        storeTabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');

        var target = tab.getAttribute('data-target');
        if (target === 'all') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        var el = document.getElementById(target);
        if (el) {
          var top = el.getBoundingClientRect().top + window.pageYOffset - 70;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });
  }

  // ---------- 获取按钮点击反馈 ----------
  document.querySelectorAll('.get-btn, .rank-action').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (btn.classList.contains('installed')) return;
      var original = btn.textContent;
      btn.textContent = '即将开放';
      btn.classList.add('installed');
      setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove('installed');
      }, 1600);
    });
  });

  // ---------- 滚动淡入 ----------
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }


});


/* ============================================
   3D 交互 v1.3
   ============================================ */

(function () {
  // 尊重用户的"减少动态"偏好
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  // ---------- 3D 卡片：鼠标跟随倾斜 + 光晕 ----------
  function bindTilt(el) {
    var maxTilt = 8; // 最大倾斜角度

    el.addEventListener('mousemove', function (e) {
      var rect = el.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      var y = (e.clientY - rect.top) / rect.height;

      var rx = (0.5 - y) * maxTilt * 2;
      var ry = (x - 0.5) * maxTilt * 2;

      el.style.transform =
        'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateZ(0)';

      el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });

    el.addEventListener('mouseleave', function () {
      el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)';
      el.style.setProperty('--mx', '50%');
      el.style.setProperty('--my', '50%');
    });
  }

  document.querySelectorAll('.card-3d').forEach(bindTilt);

  // ---------- 3D 堆叠：鼠标移动时整体轻微偏移 ----------
  var stack = document.querySelector('.stack-3d');
  if (stack) {
    var items = stack.querySelectorAll('.stack-item');
    stack.addEventListener('mousemove', function (e) {
      var rect = stack.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;

      items.forEach(function (item, i) {
        var depth = i === 0 ? 10 : 4;
        var tx = x * depth;
        var ty = y * depth;
        item.style.setProperty('--tx', tx.toFixed(2) + 'px');
        item.style.setProperty('--ty', ty.toFixed(2) + 'px');
        // 叠加到现有 transform 上（用 translate 补一层）
        item.style.transition = 'transform .2s ease-out';
        item.style.transform =
          getComputedStyle(item).transform === 'none'
            ? 'translate(' + tx + 'px, ' + ty + 'px)'
            : item.style.transform;
      });
    });

    stack.addEventListener('mouseleave', function () {
      items.forEach(function (item) {
        item.style.transition = 'transform .7s cubic-bezier(.2, .8, .2, 1)';
      });
    });
  }

  // ---------- 3D 数字滚动 ----------
  var statNums = document.querySelectorAll('.stat-3d .num[data-target]');
  if (statNums.length && 'IntersectionObserver' in window) {
    var statObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute('data-target'));
        var suffix = el.getAttribute('data-suffix') || '';
        var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        var duration = 1200;
        var start = performance.now();

        function tick(now) {
          var p = Math.min((now - start) / duration, 1);
          // easeOutCubic
          var eased = 1 - Math.pow(1 - p, 3);
          var val = target * eased;
          el.textContent = val.toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        statObserver.unobserve(el);
      });
    }, { threshold: 0.4 });

    statNums.forEach(function (el) { statObserver.observe(el); });
  }
})();









/* ============================================
   v3.1 · 加载完成 + Cookie 同意 + 平滑
   ============================================ */

(function () {
  var html = document.documentElement;

  // ---------- 首屏加载动画 ----------
  function ready() {
    // 至少一帧后再加 is-ready，保证过渡可见
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        html.classList.remove('js-loading');
        document.body.classList.add('is-ready');
      });
    });
  }

  if (document.readyState === 'complete') {
    ready();
  } else {
    window.addEventListener('load', ready);
    // 兜底：最长 1.2s 必须显示
    setTimeout(ready, 1200);
  }

  // ---------- Cookie 同意条 ----------
  var COOKIE_KEY = 'myclassroom_cookie_consent';
  var COOKIE_DAYS = 365;

  function getConsent() {
    try {
      var raw = localStorage.getItem(COOKIE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || !obj.time) return null;
      var ageDays = (Date.now() - obj.time) / 86400000;
      if (ageDays > COOKIE_DAYS) {
        localStorage.removeItem(COOKIE_KEY);
        return null;
      }
      return obj;
    } catch (e) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(COOKIE_KEY, JSON.stringify({
        value: value,
        time: Date.now()
      }));
    } catch (e) {}
  }

  function buildCookieBanner() {
    var banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie 与本地存储说明');
    banner.innerHTML =
      '<div class="cookie-inner">' +
        '<div class="cookie-icon"><i class="fa-solid fa-cookie-bite"></i></div>' +
        '<div class="cookie-text">' +
          '<strong>本站只使用必要的本地存储。</strong>' +
          '我们用它记住你的主题偏好（亮/暗、通透、清新），不做追踪、不做广告、不上传任何数据。' +
          '详见 <a href="cookie.html">Cookie 与本地存储说明</a>。' +
        '</div>' +
        '<div class="cookie-actions">' +
          '<button type="button" class="btn btn-secondary" data-cookie="decline">仅必要</button>' +
          '<button type="button" class="btn btn-primary" data-cookie="accept">知道了</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);

    // 下一帧再显示，保证过渡动画可见
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add('show');
      });
    });

    banner.addEventListener('click', function (e) {
      var t = e.target.closest('[data-cookie]');
      if (!t) return;
      var v = t.getAttribute('data-cookie');
      setConsent(v);
      banner.classList.remove('show');
      setTimeout(function () {
        banner.remove();
      }, 500);
    });
  }

  function initCookieBanner() {
    if (getConsent()) return;
    buildCookieBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieBanner);
  } else {
    initCookieBanner();
  }

  // ---------- 平滑锚点滚动（带导航栏偏移） ----------
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (href === '#' || href === '#top') return;
    var el = document.querySelector(href);
    if (!el) return;
    e.preventDefault();
    var navH = 64;
    var top = el.getBoundingClientRect().top + window.pageYOffset - navH - 12;
    window.scrollTo({ top: top, behavior: 'smooth' });
    history.replaceState(null, '', href);
  });
})();






/* ============================================
   开屏动画 v4.0
   ============================================ */

(function () {
  var SPLASH_MIN_MS = 2000;     // 最短显示时长
  var SPLASH_MAX_MS = 2200;    // 兜底最长时长

  // 首次访问才显示开屏；用 sessionStorage，会话内只闪一次
  var KEY = 'myclassroom_splash_shown';
  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}

  // 想每次都看，把 seen 强制设为 false
  // seen = false;

  function buildSplash() {
    var s = document.createElement('div');
    s.className = 'splash';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML =
      '<div class="splash-mark">' +
        '<span class="splash-lab-mark">KZ</span>' +
        '<span class="splash-brand">Kzure Lab</span>' +
      '</div>' +
      '<div class="splash-bar"></div>' +
      '<div class="splash-tagline">MyClassroom</div>';
    return s;
  }

  function hideSplash(el) {
    el.classList.add('hide');
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 600);
  }

  function runSplash() {
    var splash = buildSplash();
    document.body.appendChild(splash);
    // 至少显示 SPLASH_MIN_MS，之后立刻隐藏
    var start = Date.now();
    function finish() {
      var elapsed = Date.now() - start;
      var wait = Math.max(0, SPLASH_MIN_MS - elapsed);
      setTimeout(function () { hideSplash(splash); }, wait);
    }
    if (document.readyState === 'complete') {
      finish();
    } else {
      window.addEventListener('load', finish);
      // 兜底，最长 SPLASH_MAX_MS 一定隐藏
      setTimeout(finish, SPLASH_MAX_MS);
    }
  }

  if (!seen) {
    // 必须在 body 上，DOM 就绪后立刻插
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runSplash);
    } else {
      runSplash();
    }
  }
})();






/* ============================================
   开屏动画 v4.2 · 丝滑版
   - 与 CSS 3.2s 时间轴对齐
   - 停留结束后再触发整体淡出
   ============================================ */

(function () {
  // CSS 动画总长 3.2s，之后再停留 0.3s，然后整体淡出
  var CSS_ANIM_MS = 3200;
  var HOLD_MS = 300;
  var HIDE_MS = 650;

  // 同一会话只闪一次
  var KEY = 'myclassroom_splash_shown_v3';
  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}

  // 想让每次访问都闪，取消下面注释
  // seen = false;

  function buildSplash() {
    var s = document.createElement('div');
    s.className = 'splash';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML =
      '<div class="splash-stage">' +
        '<div class="splash-step1">' +
          '<span>Kzure Lab</span>' +
        '</div>' +
        '<div class="splash-step2">' +
          '<span class="txt">Kzure</span>' +
          '<span class="box">Lab</span>' +
        '</div>' +
      '</div>';
    return s;
  }

  function hideSplash(el) {
    el.classList.add('hide');
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, HIDE_MS + 100);
  }

  function runSplash() {
    var splash = buildSplash();
    document.body.appendChild(splash);

    // body 内容提前进入可显示状态，开屏淡出时能接上
    setTimeout(function () {
      document.body.classList.add('is-ready');
    }, 200);

    var total = CSS_ANIM_MS + HOLD_MS;

    function finish() {
      hideSplash(splash);
    }

    if (document.readyState === 'complete') {
      setTimeout(finish, total);
    } else {
      window.addEventListener('load', function () {
        setTimeout(finish, total);
      });
      // 兜底：最长 5s 一定隐藏
      setTimeout(finish, 5000);
    }
  }

  if (!seen) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runSplash);
    } else {
      runSplash();
    }
  } else {
    // 不闪开屏，但 body 正常显示
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        document.body.classList.add('is-ready');
      });
    } else {
      document.body.classList.add('is-ready');
    }
  }
})();