
/* ============================================
   TreeUI 文档页通用逻辑
   用于 about、privacy、cookie、themes、download
   ============================================ */

(function () {
  // 侧边栏折叠
  document.querySelectorAll('.tree-group-title').forEach(function (title) {
    title.style.cursor = 'pointer';
    title.addEventListener('click', function () {
      title.parentElement.classList.toggle('collapsed');
    });
  });

  // 移动端目录开关
  const toggleBtn = document.querySelector('.tree-mobile-toggle');
  const aside = document.getElementById('treeAside');
  if (toggleBtn && aside) {
    toggleBtn.addEventListener('click', function () {
      aside.classList.toggle('mobile-hidden');
    });
  }

  // 当前章节高亮
  const links = document.querySelectorAll('.tree-items a[href^="#"]');
  const sections = [];
  links.forEach(function (a) {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) sections.push({ id: id, el: el });
  });

  function setActive(id) {
    links.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + id);
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setActive(e.target.id);
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    sections.forEach(function (s) { io.observe(s.el); });
  }
})();