/* ============================================
   PlanPeople Glass Effect (轻量版)
   原理：使用 SVG 滤镜生成折射位移图
   ============================================ */
(function () {
  'use strict';

  let svgFilter = null;

  function createFilter() {
    if (svgFilter) return;
    const svgNS = "http://www.w3.org/2000/svg";
    svgFilter = document.createElementNS(svgNS, "svg");
    svgFilter.id = "glass-svg-defs";
    svgFilter.style.position = "absolute";
    svgFilter.style.width = "0";
    svgFilter.style.height = "0";
    svgFilter.style.pointerEvents = "none";
    
    // 使用 feTurbulence 制造磨砂 + feDisplacementMap 制造折射扭曲
    svgFilter.innerHTML = `
      <filter id="glass-refract" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    `;
    document.body.appendChild(svgFilter);
  }

  function applyEffect() {
    // 如果全局属性为 off，直接退出
    if (document.documentElement.getAttribute('data-glass') === 'off') return;
    
    createFilter();
    const elements = document.querySelectorAll('.glass-element');
    
    elements.forEach(el => {
      // 添加 CSS 变量，方便统一控制
      el.style.setProperty('backdrop-filter', 'url(#glass-refract) blur(12px) saturate(150%)');
      el.style.setProperty('-webkit-backdrop-filter', 'url(#glass-refract) blur(12px) saturate(150%)');
    });
  }

  function removeEffect() {
    const elements = document.querySelectorAll('.glass-element');
    elements.forEach(el => {
      el.style.removeProperty('backdrop-filter');
      el.style.removeProperty('-webkit-backdrop-filter');
    });
  }

  // 暴露全局 API
  window.GlassEffect = {
    init: applyEffect,
    destroy: removeEffect
  };
})();