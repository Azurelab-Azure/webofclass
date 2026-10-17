/* ============================================
   下载页 · 测试版解锁流程
   初始只显示「点 Star」按钮
   点击后显示「下载」按钮
   ============================================ */

(function () {
  'use strict';

  var STAR_KEY = 'myclassroom_beta_unlocked';

  var lockEl = document.getElementById('betaLock');
  var unlockEl = document.getElementById('betaUnlock');
  var starBtn = document.getElementById('betaStarBtn');
  var stepNodes = document.querySelectorAll('.dl-step-node');

  if (!lockEl || !unlockEl || !starBtn) return;

  /**
   * 设置已解锁状态
   * 隐藏锁定，显示下载
   * 更新步骤指示器
   */
  function setUnlocked() {
    lockEl.hidden = true;
    unlockEl.hidden = false;

    stepNodes.forEach(function (node) {
      var step = node.getAttribute('data-step-node');
      if (step === '1') {
        node.classList.remove('active');
        node.classList.add('done');
      } else if (step === '2') {
        node.classList.add('active');
      }
    });
  }

  /**
   * 检查本地存储是否已解锁
   */
  function checkUnlocked() {
    try {
      if (localStorage.getItem(STAR_KEY) === '1') {
        setUnlocked();
        return true;
      }
    } catch (e) {}
    return false;
  }

  /**
   * 点击 Star 按钮
   * 记录状态，但先不立即解锁
   * 等用户从 GitHub 回来再显示
   */
  starBtn.addEventListener('click', function () {
    try {
      localStorage.setItem(STAR_KEY, '1');
    } catch (e) {}
  });

  /**
   * 监听页面可见性变化
   * 用户从 GitHub 切回本页时，检测是否已点过 Star
   */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      checkUnlocked();
    }
  });

  /**
   * 监听窗口聚焦
   * 兼容某些浏览器的行为
   */
  window.addEventListener('focus', function () {
    checkUnlocked();
  });

  // 初始化：如果之前已解锁，直接显示下载
  checkUnlocked();
})();