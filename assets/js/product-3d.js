/* ============================================
   产品介绍页 · 滚动与动画
   职责：标题逐字拆分、场景进入穿过、进度条、
        HUD 高亮、数字滚动、主题卡片联动
   ============================================ */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============================================
  // 标题逐字拆分
  // ============================================

  /**
   * 把 .pd-char-line 里的文字拆成单字 span
   * 每个字带不同的延迟，形成逐字出现效果
   */
  function splitChars() {
    document.querySelectorAll('.pd-char-line').forEach(function (line) {
      // 避免重复拆分
      if (line.getAttribute('data-split') === '1') return;
      line.setAttribute('data-split', '1');

      var text = line.textContent;
      line.textContent = '';

      var fragment = document.createDocumentFragment();
      for (var i = 0; i < text.length; i += 1) {
        var span = document.createElement('span');
        span.textContent = text[i];
        span.style.animationDelay = (i * 0.06) + 's';
        fragment.appendChild(span);
      }
      line.appendChild(fragment);
    });
  }

  // ============================================
  // 减少动态模式：直接显示所有内容
  // ============================================
  if (reduce) {
    document.querySelectorAll('.pd-scene').forEach(function (el) {
      el.classList.add('is-active');
    });
    return;
  }

  // ============================================
  // 场景进入穿过
  // ============================================
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.pd-scene'));

  /**
   * 根据场景中心与视口中心的距离
   * 标记 is-active 或 is-passed
   */
  function updateScenes() {
    var vh = window.innerHeight;
    var viewportCenter = vh / 2;

    scenes.forEach(function (scene) {
      var rect = scene.getBoundingClientRect();
      var sceneCenter = rect.top + rect.height / 2;
      var distance = sceneCenter - viewportCenter;
      var halfHeight = rect.height / 2;

      if (distance < -halfHeight * 0.7) {
        // 已经越过
        scene.classList.remove('is-active');
        scene.classList.add('is-passed');
      } else if (Math.abs(distance) < halfHeight + vh * 0.15) {
        // 在视口内
        scene.classList.add('is-active');
        scene.classList.remove('is-passed');
      } else {
        // 还没到
        scene.classList.remove('is-active');
        scene.classList.remove('is-passed');
      }
    });
  }

  // ============================================
  // 进度条
  // ============================================
  var progressFill = document.getElementById('pdProgress');

  function updateProgress() {
    if (!progressFill) return;
    var doc = document.documentElement;
    var total = doc.scrollHeight - doc.clientHeight;
    var current = doc.scrollTop;
    var percent = total > 0 ? (current / total) * 100 : 0;
    progressFill.style.width = percent + '%';
  }

  // ============================================
  // HUD 高亮
  // ============================================
  var hudDots = Array.prototype.slice.call(document.querySelectorAll('.pd-hud-dot'));

  /**
   * 找到离视口中心最近的场景
   * 高亮对应的 HUD 圆点
   */
  function updateHud() {
    if (!hudDots.length) return;

    var viewportCenter = window.innerHeight / 2;
    var closestId = null;
    var closestDist = Infinity;

    scenes.forEach(function (scene) {
      var rect = scene.getBoundingClientRect();
      var sceneCenter = rect.top + rect.height / 2;
      var dist = Math.abs(sceneCenter - viewportCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestId = scene.id;
      }
    });

    if (!closestId) return;

    hudDots.forEach(function (dot) {
      dot.classList.toggle('active', dot.getAttribute('href') === '#' + closestId);
    });
  }

  // ============================================
  // 数字滚动
  // ============================================
  var counted = new WeakSet();

  /**
   * 数字从 0 滚到目标值
   * 用 easeOutCubic 缓动
   */
  function countUp(el, target, suffix, duration) {
    var start = performance.now();

    function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = Math.round(val) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /**
   * 检查所有指标元素是否进入视口
   */
  function updateMetrics() {
    var metrics = document.querySelectorAll('.pd-metric-num[data-count]');
    metrics.forEach(function (el) {
      if (counted.has(el)) return;

      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
        counted.add(el);
        var target = parseFloat(el.getAttribute('data-count')) || 0;
        var suffix = el.getAttribute('data-suffix') || '';
        countUp(el, target, suffix, 1400);
      }
    });
  }

  // ============================================
  // 主题卡片联动
  // ============================================

  /**
   * 点击主题卡片
   * 走全局主题 API，保证与导航栏圆点联动
   */
  function bindThemeCards() {
    document.querySelectorAll('.pd-theme-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var preview = card.getAttribute('data-preview');
        if (!preview) return;

        var themeVal = preview === 'dark' ? 'dark' : 'light';

        if (window.MyClassroomTheme &&
            typeof window.MyClassroomTheme.apply === 'function') {
          window.MyClassroomTheme.apply(themeVal, preview);
        } else {
          // 兜底
          document.documentElement.setAttribute('data-theme', themeVal);
          document.documentElement.setAttribute('data-ui', preview);
          try {
            localStorage.setItem('theme', themeVal);
            localStorage.setItem('ui', preview);
          } catch (e) {}
          document.querySelectorAll('.ui-switcher button').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-ui') === preview);
          });
        }
      });
    });
  }

  /**
   * 标记当前主题卡片为选中态
   */
  function markCurrentCard(ui) {
    document.querySelectorAll('.pd-theme-card').forEach(function (card) {
      var isCurrent = card.getAttribute('data-preview') === ui;
      card.classList.toggle('is-current', isCurrent);
    });
  }

  /**
   * 监听全局主题变化
   * 与导航栏切换器保持同步
   */
  function bindGlobalThemeSync() {
    window.addEventListener('myclassroom:themechange', function (e) {
      markCurrentCard(e.detail.ui);
    });

    // 初始化时同步一次
    var currentUI = window.MyClassroomTheme
      ? window.MyClassroomTheme.get().ui
      : document.documentElement.getAttribute('data-ui');

    markCurrentCard(currentUI);
  }

  // ============================================
  // 主循环
  // ============================================
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateScenes();
      updateProgress();
      updateHud();
      updateMetrics();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // ============================================
  // 启动
  // ============================================
  function boot() {
    splitChars();
    bindThemeCards();
    bindGlobalThemeSync();
    updateScenes();
    updateProgress();
    updateHud();
    updateMetrics();

    // 延迟再检查，等图片与字体加载
    setTimeout(onScroll, 300);
    setTimeout(onScroll, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();