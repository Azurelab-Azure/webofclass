
/* ============================================
   产品页右侧章节小点
   滚动时自动高亮当前章节
   ============================================ */

(function () {
  const sections = document.querySelectorAll('.pd-screen[id]');
  const dots = document.querySelectorAll('#pdNav a');
  if (!sections.length || !dots.length) return;

  function activate(id) {
    dots.forEach(function (d) {
      d.classList.toggle('active', d.getAttribute('href') === '#' + id);
    });
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) activate(e.target.id);
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }
})();