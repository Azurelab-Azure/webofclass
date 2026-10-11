
/* ============================================
   插件广场交互
   分类 Tab 滚动 + 按钮反馈 + 3D 倾斜
   ============================================ */

(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 分类 Tab 点击滚动
  const tabs = document.querySelectorAll('#storeTabs .store-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');

      const target = tab.getAttribute('data-target');
      if (target === 'all') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = document.getElementById(target);
      if (el) {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 70;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // 获取按钮点击反馈
  document.querySelectorAll('.get-btn, .rank-action').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (btn.dataset.done === '1') return;
      const orig = btn.textContent;
      btn.textContent = '已记录';
      btn.dataset.done = '1';
      setTimeout(function () {
        btn.textContent = orig;
        btn.dataset.done = '0';
      }, 1400);
    });
  });

  if (reduce) return;

  // 3D 卡片鼠标倾斜
  document.querySelectorAll('.card-3d').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const rx = (0.5 - y) * 14;
      const ry = (x - 0.5) * 14;
      el.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });
    el.addEventListener('mouseleave', function () {
      el.style.transform = '';
      el.style.setProperty('--mx', '50%');
      el.style.setProperty('--my', '50%');
    });
  });
})();