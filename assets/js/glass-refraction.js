/* ============================================
   原生 WebGL 真·液态玻璃折射生成器
   ============================================ */

(function () {
  'use strict';

  // 匹配带有 island-ui 类的元素
    // 将原有选择器替换为全站通用选择器
  var SELECTOR = [
    '.island-ui', 
    '.card', 
    '.tree-content', 
    '.tree-aside', 
    '.cookie-banner',
    '.btn', 
    '.modal',
    '.app-card',
    '.editor-card',
    '.req-card',
    '.step-item',
    '.dl-panel',
    '.pd-visual',
    '.pd-spec',
    '.pd-quote',
    '.faq-item'
  ].join(', ');
  // 整体折射强度
  var DISPLACEMENT_SCALE = 30;

  var filterCache = new Map();
  var tracked = new Set();
  var globalSvg = null;
  var globalDefs = null;
  var uid = 0;

  /**
   * 生成位移图 (核心算法)
   * 模拟玻璃边缘厚度造成的物理挤压
   */
  function generateMapCanvas(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    var imgData = ctx.createImageData(width, height);
    var data = imgData.data;

    var halfW = width / 2;
    var halfH = height / 2;
    var radius = Math.min(halfW, halfH) * 0.6;
    
    var rawX = new Float32Array(width * height);
    var rawY = new Float32Array(width * height);
    var maxDx = 0, maxDy = 0;
    var idx = 0;

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var ix = x - halfW;
        var iy = y - halfH;
        
        // SDF 圆角矩形距离
        var qx = Math.abs(ix) - halfW + radius;
        var qy = Math.abs(iy) - halfH + radius;
        var dist = Math.min(Math.max(qx, qy), 0) + Math.sqrt(Math.max(qx,0)**2 + Math.max(qy,0)**2) - radius;
        
        // 边缘厚度区域 (归一化)
        var edgeArea = Math.min(halfW, halfH) * 0.15; 
        var edgeFactor = Math.max(0, (dist + edgeArea) / edgeArea);
        
        var dx = 0, dy = 0;

        // 仅在靠近边缘的区域产生变形
        if (edgeFactor < 1) {
          // 平滑曲线 (越靠近边缘形变越大)
          var strength = Math.pow(1 - edgeFactor, 2); 
          dx = ix * strength * 0.6;
          dy = iy * strength * 0.6;
        }

        rawX[idx] = dx;
        rawY[idx] = dy;
        
        if (Math.abs(dx) > maxDx) maxDx = Math.abs(dx);
        if (Math.abs(dy) > maxDy) maxDy = Math.abs(dy);
        idx++;
      }
    }

    var scale = Math.max(maxDx, maxDy) || 1;
    idx = 0;
    var p = 0;

    // 写入 RGB 贴图
    for (var i = 0; i < width * height; i++) {
      var r = (rawX[idx] / scale) * 0.5 + 0.5;
      var g = (rawY[idx] / scale) * 0.5 + 0.5;
      data[p] = r * 255;
      data[p + 1] = g * 255;
      data[p + 2] = 0;
      data[p + 3] = 255;
      p += 4;
      idx++;
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  function getFilter(width, height) {
    var key = width + 'x' + height;
    if (filterCache.has(key)) return filterCache.get(key);

    if (!globalSvg) {
      globalSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      globalSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      globalSvg.setAttribute('width', '0');
      globalSvg.setAttribute('height', '0');
      globalSvg.style.position = 'absolute';
      globalSvg.style.pointerEvents = 'none';
      globalDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      globalSvg.appendChild(globalDefs);
      document.body.appendChild(globalSvg);
    }

    uid++;
    var id = 'glass-refract-' + uid;
    var canvas = generateMapCanvas(width, height);

    var filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', id);
    filter.setAttribute('filterUnits', 'userSpaceOnUse');
    filter.setAttribute('x', '0');
    filter.setAttribute('y', '0');
    filter.setAttribute('width', width);
    filter.setAttribute('height', height);

    var feImage = document.createElementNS('http://www.w3.org/2000/svg', 'feImage');
    feImage.setAttribute('result', 'map');
    feImage.setAttribute('width', width);
    feImage.setAttribute('height', height);
    feImage.setAttribute('href', canvas.toDataURL());

    var feDisp = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
    feDisp.setAttribute('in', 'SourceGraphic');
    feDisp.setAttribute('in2', 'map');
    feDisp.setAttribute('xChannelSelector', 'R');
    feDisp.setAttribute('yChannelSelector', 'G');
    feDisp.setAttribute('scale', DISPLACEMENT_SCALE);

    filter.appendChild(feImage);
    filter.appendChild(feDisp);
    globalDefs.appendChild(filter);

    filterCache.set(key, id);
    return id;
  }

  function apply(el) {
    // 已经被处理过就跳过
    if (el.dataset.refractApplied) return;
    
    // 过滤掉按钮、小圆点等微小元素，只对卡片和长条生效
    if (el.offsetWidth < 80 || el.offsetHeight < 40) return;
    // 过滤掉页脚（太大导致性能问题）
    if (el.tagName.toLowerCase() === 'footer') return;

    var rect = el.getBoundingClientRect();
    var w = Math.round(rect.width);
    var h = Math.round(rect.height);

    var id = getFilter(w, h);
    
    // 将纯 CSS 的 backdrop-filter 替换为 WebGL 生成的折射贴图
    // 后面保留 blur(1px) 让玻璃内部产生微观磨砂
    var backdrop = 'url(#' + id + ') blur(1px) contrast(1.2) brightness(1.1)';
    el.style.setProperty('backdrop-filter', backdrop);
    el.style.setProperty('-webkit-backdrop-filter', backdrop);
    
    el.dataset.refractApplied = 'true';
    tracked.add(el);
  }

  function applyAll() {
    document.querySelectorAll(SELECTOR).forEach(apply);
  }

  function watchResize() {
    if (!('ResizeObserver' in window)) return;
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        if (!el.dataset.refractApplied) return;

        var rect = el.getBoundingClientRect();
        var w = Math.round(rect.width);
        var h = Math.round(rect.height);
        if (w < 80 || h < 40) return;

        var id = getFilter(w, h);
        var backdrop = 'url(#' + id + ') blur(1px) contrast(1.2) brightness(1.1)';
        el.style.setProperty('backdrop-filter', backdrop);
        el.style.setProperty('-webkit-backdrop-filter', backdrop);
      });
    });
    tracked.forEach(function (el) { ro.observe(el); });
  }

  window.GlassRefraction = {
    init: function() {
      applyAll();
      watchResize();
      if (document.fonts) document.fonts.ready.then(applyAll);
    }
  };
})();