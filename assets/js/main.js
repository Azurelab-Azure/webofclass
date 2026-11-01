/* ============================================
   PlanPeople - main.js (强制 Cookie 拦截版)
   ============================================ */

(function () {
  'use strict';

  document.documentElement.setAttribute('data-theme', 'dark');
  document.documentElement.style.colorScheme = 'dark';

  // 1. 数据注入
  async function injectData() {
    try {
      const res = await fetch('assets/data/links.json');
      if (!res.ok) throw new Error('links.json 读取失败');
      const data = await res.json();

      document.querySelectorAll('[data-link]').forEach(el => {
        const path = el.getAttribute('data-link').split('.');
        let url = data;
        path.forEach(key => { if (url) url = url[key]; });
        
        if (url && typeof url === 'string') {
          el.setAttribute('href', url);
          if (path[0] === 'download') el.setAttribute('download', '');
        } else {
          el.setAttribute('href', '#');
        }
      });
    } catch (err) {
      console.warn('数据注入异常:', err);
    }
  }

  // 2. 强制 Cookie 同意逻辑
  function initCookieOverlay() {
    const overlay = document.getElementById('cookieOverlay');
    if (!overlay) return;

    const CONSENT_KEY = 'planpeople_cookie_consent';
    
    // 如果还没同意过
    if (!localStorage.getItem(CONSENT_KEY)) {
      // 立即显示遮罩，并锁定页面滚动
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    // 处理选择
    function handleConsent(action) {
      localStorage.setItem(CONSENT_KEY, action);
      overlay.classList.remove('show');
      document.body.style.overflow = ''; // 恢复滚动
    }

    document.getElementById('cookieAccept')?.addEventListener('click', () => handleConsent('accepted'));
    document.getElementById('cookieDecline')?.addEventListener('click', () => handleConsent('declined'));
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectData();
      initCookieOverlay();
    });
  } else {
    injectData();
    initCookieOverlay();
  }
})();