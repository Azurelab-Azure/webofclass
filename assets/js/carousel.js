
/* ============================================
   轮播组件
   支持：左右按钮、圆点指示、触摸滑动、自动播放
   ============================================ */

(function () {
  document.querySelectorAll('.carousel').forEach(function (carousel) {
    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prev = carousel.querySelector('.carousel-btn.prev');
    const next = carousel.querySelector('.carousel-btn.next');
    const dots = carousel.querySelectorAll('.carousel-dot');
    let index = 0;

    /**
     * 跳到指定索引
     */
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

    // 自动播放，鼠标悬停时暂停
    if (slides.length > 1) {
      let timer = setInterval(function () { go(index + 1); }, 6000);
      carousel.addEventListener('mouseenter', function () { clearInterval(timer); });
      carousel.addEventListener('mouseleave', function () {
        timer = setInterval(function () { go(index + 1); }, 6000);
      });
    }

    // 触摸滑动
    let startX = 0;
    track.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', function (e) {
      const dx = e.changedTouches[0].clientX - startX;
      if (dx > 50) go(index - 1);
      else if (dx < -50) go(index + 1);
    });

    go(0);
  });
})();