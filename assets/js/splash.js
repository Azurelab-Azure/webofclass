
/* ============================================
   开屏动画
   两段文字交叉过渡，会话内只闪一次
   ============================================ */

(function () {
  const CSS_ANIM_MS = 3200;
  const HOLD_MS = 300;
  const HIDE_MS = 650;
  const KEY = 'myclassroom_splash_shown';

  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}

  /**
   * 构建开屏节点
   */
  function build() {
    const s = document.createElement('div');
    s.className = 'splash';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML =
      '<div class="splash-stage">' +
        '<div class="splash-step1"><span>Kzure Lab</span></div>' +
        '<div class="splash-step2">' +
          '<span class="txt">Kzure</span>' +
          '<span class="box">Lab</span>' +
        '</div>' +
      '</div>';
    return s;
  }

  /**
   * 隐藏并移除开屏
   */
  function hide(el) {
    el.classList.add('hide');
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, HIDE_MS + 100);
  }

  /**
   * 运行开屏
   */
  function run() {
    const splash = build();
    document.body.appendChild(splash);

    setTimeout(function () {
      document.body.classList.add('is-ready');
    }, 200);

    const total = CSS_ANIM_MS + HOLD_MS;
    function finish() { hide(splash); }

    if (document.readyState === 'complete') {
      setTimeout(finish, total);
    } else {
      window.addEventListener('load', function () { setTimeout(finish, total); });
      setTimeout(finish, 5000);
    }
  }

  /**
   * 会话内已显示过，直接让页面可见
   */
  function skip() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        document.body.classList.add('is-ready');
      });
    } else {
      document.body.classList.add('is-ready');
    }
  }

  if (seen) {
    skip();
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();