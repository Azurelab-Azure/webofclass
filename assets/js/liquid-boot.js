/* ============================================
   液态玻璃启动器
   等开屏动画结束，再挂载金字塔
   桌面端和移动端都挂载
   ============================================ */

(function () {
  'use strict';

  // 避免重复挂载
  if (window.__liquidBooted) return;
  window.__liquidBooted = true;

  var SPLASH_KEY = 'myclassroom_splash_shown';
  var wasShown = false;
  try { wasShown = sessionStorage.getItem(SPLASH_KEY) === '1'; } catch (e) {}

  // 开屏总时长：动画 3.2 秒加停留 0.3 秒加淡出 0.65 秒，约 4.15 秒
  var SPLASH_TOTAL_MS = 3200 + 300 + 650;

  /**
   * 挂载液态玻璃
   * 调用 liquid-diamond.js 暴露的全局函数
   */
  function mount() {
    if (typeof window.attachLiquidPyramid !== 'function') {
      console.warn('液态玻璃脚本未加载，跳过挂载');
      return;
    }
    window.attachLiquidPyramid({
      parent: document.body,
      debug: false
    });
  }

  /**
   * 决定挂载时机
   * 本次会话已看过开屏就立刻挂，否则等开屏播完
   */
  function boot() {
    if (wasShown) {
      mount();
      return;
    }
    setTimeout(mount, SPLASH_TOTAL_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();