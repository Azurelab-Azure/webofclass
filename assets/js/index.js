(function () {
  'use strict';

  // 首页模块初始化
  const initHeroEffects = () => {
    const showcase = document.querySelector('.hero-showcase');
    if (!showcase) return;

    // 简单的滚动淡入和缩放视差效果
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (scrollY < 800) {
        // 随着向下滚动，图片微微缩小并降低透明度
        const scale = Math.max(0.95, 1 - scrollY * 0.0002);
        const opacity = Math.max(0.5, 1 - scrollY * 0.001);
        showcase.style.transform = `scale(${scale}) translateY(${scrollY * 0.1}px)`;
        showcase.style.opacity = opacity;
      }
    }, { passive: true });
  };

  // 元素进入视口动画 (Intersection Observer)
  const initScrollReveal = () => {
    const reveals = document.querySelectorAll('.compare-card, .bento-item');
    if (!reveals.length) return;

    // 初始状态
    reveals.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(40px)';
      el.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    reveals.forEach(el => observer.observe(el));
  };

  // 启动
  document.addEventListener('DOMContentLoaded', () => {
    initHeroEffects();
    initScrollReveal();
  });
})();