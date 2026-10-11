/* ============================================
   液态玻璃 UI 折射
   给按钮和卡片加上玻璃折射效果
   文字与图标会被背后的内容折射
   ============================================ */

(function () {
  'use strict';

  // 避免重复挂载
  if (window.__liquidUiReady) return;
  window.__liquidUiReady = true;

  // 需要折射的元素选择器
  // 只对按钮和导航元素做液态折射
var SELECTORS = [
  '.btn',
  '.store-tab',
  '.rank-item .rank-action',
  '.app-card .get-btn',
  '.carousel-btn',
  '.theme-toggle',
  '.ui-switcher'
].join(', ');

  // 位移强度，像素。数值越大折射越明显
  var DISPLACEMENT_SCALE = 18;

  // 边缘柔和宽度，占元素短边的比例
  var EDGE_RATIO = 0.22;

  // 保存已生成的滤镜，按宽乘高缓存
  var filterCache = new Map();

  // 保存所有已处理的元素，用于重新生成
  var tracked = new Set();

  // 全局 SVG 容器，所有滤镜挂在里面
  var globalSvg = null;

  // 全局 defs
  var globalDefs = null;

  // 计数器，用于生成唯一 id
  var uid = 0;

  /**
   * 创建全局 SVG 容器
   * 只创建一次，后续滤镜都挂在这里
   */
  function ensureGlobalSvg() {
    if (globalSvg) return;
    globalSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    globalSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    globalSvg.setAttribute('width', '0');
    globalSvg.setAttribute('height', '0');
    globalSvg.style.position = 'absolute';
    globalSvg.style.width = '0';
    globalSvg.style.height = '0';
    globalSvg.style.overflow = 'hidden';
    globalSvg.style.pointerEvents = 'none';
    globalDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    globalSvg.appendChild(globalDefs);
    document.body.appendChild(globalSvg);
  }

  /**
   * 生成圆角矩形有符号距离场
   * 返回点到矩形边界的距离，负值在内部
   */
  function roundedRectSDF(x, y, halfW, halfH, radius) {
    var qx = Math.abs(x) - halfW + radius;
    var qy = Math.abs(y) - halfH + radius;
    var mx = Math.max(qx, 0);
    var my = Math.max(qy, 0);
    return Math.min(Math.max(qx, qy), 0) + Math.sqrt(mx * mx + my * my) - radius;
  }

  /**
   * 平滑插值
   * t 小于 a 返回 0，大于 b 返回 1，中间平滑过渡
   */
  function smoothStep(a, b, t) {
    var x = (t - a) / (b - a);
    if (x < 0) x = 0;
    if (x > 1) x = 1;
    return x * x * (3 - 2 * x);
  }

  /**
   * 生成位移图 canvas
   * 宽高与元素一致，用 R 通道存 X 位移，G 通道存 Y 位移
   * 效果：边缘向中心收缩，模拟玻璃凸起
   */
  function buildDisplacementCanvas(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    var image = ctx.createImageData(width, height);
    var data = image.data;

    var halfW = width / 2;
    var halfH = height / 2;
    var radius = Math.min(halfW, halfH) * 0.6;
    var edge = Math.min(halfW, halfH) * EDGE_RATIO;

    var maxDx = 0;
    var maxDy = 0;
    var rawX = new Float32Array(width * height);
    var rawY = new Float32Array(width * height);
    var idx = 0;

    // 第一遍：算原始位移值
    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        var ix = x - halfW;
        var iy = y - halfH;
        var dist = roundedRectSDF(ix, iy, halfW, halfH, radius);
        // dist 负值在内部，越靠近边缘越接近 0
        // 用 smoothStep 让边缘产生向内位移
        var falloff = smoothStep(-edge, 0, dist);
        var strength = 1 - falloff;
        var dx = -ix * strength * 0.08;
        var dy = -iy * strength * 0.08;
        rawX[idx] = dx;
        rawY[idx] = dy;
        if (Math.abs(dx) > maxDx) maxDx = Math.abs(dx);
        if (Math.abs(dy) > maxDy) maxDy = Math.abs(dy);
        idx += 1;
      }
    }

    // 防止除以零
    if (maxDx < 0.0001) maxDx = 1;
    if (maxDy < 0.0001) maxDy = 1;
    var scale = Math.max(maxDx, maxDy);

    // 第二遍：归一化写入
    idx = 0;
    var p = 0;
    for (var yy = 0; yy < height; yy += 1) {
      for (var xx = 0; xx < width; xx += 1) {
        var r = rawX[idx] / scale * 0.5 + 0.5;
        var g = rawY[idx] / scale * 0.5 + 0.5;
        data[p] = r * 255;
        data[p + 1] = g * 255;
        data[p + 2] = 0;
        data[p + 3] = 255;
        p += 4;
        idx += 1;
      }
    }

    ctx.putImageData(image, 0, 0);
    return { canvas: canvas, scale: scale };
  }

  /**
   * 生成一个滤镜
   * 输入宽高，返回滤镜 id 和对应的位移比例
   * 相同宽高会复用，避免重复计算
   */
  function getFilter(width, height) {
    var key = width + 'x' + height;
    if (filterCache.has(key)) {
      return filterCache.get(key);
    }

    ensureGlobalSvg();

    uid += 1;
    var id = 'liquid-ui-' + uid;
    var built = buildDisplacementCanvas(width, height);

    // 创建 filter
    var filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', id);
    filter.setAttribute('filterUnits', 'userSpaceOnUse');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    filter.setAttribute('x', '0');
    filter.setAttribute('y', '0');
    filter.setAttribute('width', String(width));
    filter.setAttribute('height', String(height));

    // feImage 装载位移图
    var feImage = document.createElementNS('http://www.w3.org/2000/svg', 'feImage');
    feImage.setAttribute('result', 'map');
    feImage.setAttribute('width', String(width));
    feImage.setAttribute('height', String(height));
    feImage.setAttribute('href', built.canvas.toDataURL());

    // feDisplacementMap 做折射
    var feDisp = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
    feDisp.setAttribute('in', 'SourceGraphic');
    feDisp.setAttribute('in2', 'map');
    feDisp.setAttribute('xChannelSelector', 'R');
    feDisp.setAttribute('yChannelSelector', 'G');
    feDisp.setAttribute('scale', String(DISPLACEMENT_SCALE));

    filter.appendChild(feImage);
    filter.appendChild(feDisp);
    globalDefs.appendChild(filter);

    var result = { id: id, filter: filter };
    filterCache.set(key, result);
    return result;
  }

  /**
   * 给单个元素应用玻璃效果
   * 添加 backdrop-filter 引用生成的滤镜
   */
  function applyToElement(el) {
    if (el.__liquidApplied) return;
    var rect = el.getBoundingClientRect();
    var w = Math.round(rect.width);
    var h = Math.round(rect.height);
    if (w < 4 || h < 4) return;

    var filter = getFilter(w, h);
    // 用 backdrop-filter 让元素背后的内容被折射
    var value = 'url(#' + filter.id + ') blur(0.2px)';
    el.style.setProperty('backdrop-filter', value);
    el.style.setProperty('-webkit-backdrop-filter', value);
    // 加一点内阴影让玻璃感更强
    el.style.setProperty('box-shadow',
      'inset 0 1px 0 rgba(255, 255, 255, 0.35), ' +
      'inset 0 -1px 0 rgba(255, 255, 255, 0.12), ' +
      '0 4px 12px rgba(0, 0, 0, 0.08)');
    el.__liquidApplied = true;
    tracked.add(el);
  }

  /**
   * 扫描页面上所有目标元素并应用效果
   */
  function applyAll() {
    var nodes = document.querySelectorAll(SELECTORS);
    nodes.forEach(function (el) {
      applyToElement(el);
    });
  }

  /**
   * 元素尺寸变化时重新生成滤镜
   * 用 ResizeObserver 监听
   */
  function watchResize() {
    if (!('ResizeObserver' in window)) return;
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        var rect = el.getBoundingClientRect();
        var w = Math.round(rect.width);
        var h = Math.round(rect.height);
        if (w < 4 || h < 4) return;
        var filter = getFilter(w, h);
        var value = 'url(#' + filter.id + ') blur(0.2px)';
        el.style.setProperty('backdrop-filter', value);
        el.style.setProperty('-webkit-backdrop-filter', value);
      });
    });
    tracked.forEach(function (el) { ro.observe(el); });
  }

  /**
   * 启动
   * 等 DOM 就绪，等字体加载完（避免尺寸跳动）
   */
  function boot() {
    applyAll();
    watchResize();

    // 字体加载完再扫一次，防止尺寸变了
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        applyAll();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();