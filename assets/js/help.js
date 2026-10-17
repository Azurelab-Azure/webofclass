/* ============================================
   帮助中心 · PDF 阅读器
   用 pdf.js 渲染 PDF 手册
   支持翻页、缩放、搜索、全屏
   ============================================ */

import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs';

// 设置 worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

(function () {
  'use strict';

  var PDF_PATH = 'assets/docs/manual.pdf';

  // DOM
  var wrap = document.getElementById('pdfCanvasWrap');
  var loadingEl = document.getElementById('pdfLoading');
  var errorEl = document.getElementById('pdfError');
  var prevBtn = document.getElementById('pdfPrev');
  var nextBtn = document.getElementById('pdfNext');
  var pageInput = document.getElementById('pdfPageInput');
  var pageTotalEl = document.getElementById('pdfPageTotal');
  var zoomIn = document.getElementById('pdfZoomIn');
  var zoomOut = document.getElementById('pdfZoomOut');
  var zoomInfo = document.getElementById('pdfZoomInfo');
  var fitWidth = document.getElementById('pdfFitWidth');
  var fullscreenBtn = document.getElementById('pdfFullscreen');
  var searchToggle = document.getElementById('pdfSearchToggle');
  var searchBar = document.getElementById('helpSearch');
  var searchInput = document.getElementById('pdfSearchInput');
  var searchInfo = document.getElementById('pdfSearchInfo');
  var searchPrev = document.getElementById('pdfSearchPrev');
  var searchNext = document.getElementById('pdfSearchNext');
  var searchClose = document.getElementById('pdfSearchClose');
  var footerPage = document.getElementById('pdfFooterPage');
  var reader = document.querySelector('.help-reader');

  if (!wrap) return;

  // 状态
  var pdfDoc = null;
  var currentPage = 1;
  var totalPages = 0;
  var scale = 1.0;
  var rendering = false;
  var pendingRender = null;
  var canvasEl = null;
  var textLayerEl = null;
  var searchResults = [];
  var searchIndex = -1;

  // ============================================
  // 初始化
  // ============================================
  async function init() {
    try {
      pdfDoc = await pdfjsLib.getDocument(PDF_PATH).promise;
      totalPages = pdfDoc.numPages;
      pageTotalEl.textContent = totalPages;
      pageInput.max = totalPages;

      // 默认适合宽度
      await fitWidthScale();

      // 创建第一页
      await renderPage(1);

      loadingEl.style.display = 'none';
    } catch (err) {
      console.error('PDF 加载失败', err);
      loadingEl.style.display = 'none';
      errorEl.hidden = false;
    }
  }

  // ============================================
  // 渲染单页
  // ============================================
  async function renderPage(num) {
    if (!pdfDoc) return;
    if (rendering) {
      pendingRender = num;
      return;
    }
    rendering = true;

    try {
      var page = await pdfDoc.getPage(num);
      var viewport = page.getViewport({ scale: scale });

      // 创建或复用 canvas
      if (!canvasEl) {
        canvasEl = document.createElement('canvas');
        wrap.appendChild(canvasEl);
      }

      var dpr = window.devicePixelRatio || 1;
      canvasEl.width = viewport.width * dpr;
      canvasEl.height = viewport.height * dpr;
      canvasEl.style.width = viewport.width + 'px';
      canvasEl.style.height = viewport.height + 'px';

      var ctx = canvasEl.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      // 更新 UI
      currentPage = num;
      pageInput.value = num;
      footerPage.textContent = '第 ' + num + ' 页';
      prevBtn.disabled = num <= 1;
      nextBtn.disabled = num >= totalPages;

      // 翻页后滚动到顶部
      wrap.scrollTop = 0;
    } catch (err) {
      console.error('页面渲染失败', err);
    } finally {
      rendering = false;
      if (pendingRender) {
        var next = pendingRender;
        pendingRender = null;
        renderPage(next);
      }
    }
  }

  // ============================================
  // 缩放
  // ============================================
  async function setScale(s) {
    scale = Math.max(0.25, Math.min(4, s));
    zoomInfo.textContent = Math.round(scale * 100) + '%';
    await renderPage(currentPage);
  }

  async function fitWidthScale() {
    if (!pdfDoc) return;
    var page = await pdfDoc.getPage(1);
    var viewport = page.getViewport({ scale: 1 });
    var available = wrap.clientWidth - 48;
    scale = Math.min(4, Math.max(0.25, available / viewport.width));
    zoomInfo.textContent = Math.round(scale * 100) + '%';
  }

  // ============================================
  // 事件绑定
  // ============================================
  prevBtn.addEventListener('click', function () {
    if (currentPage > 1) renderPage(currentPage - 1);
  });

  nextBtn.addEventListener('click', function () {
    if (currentPage < totalPages) renderPage(currentPage + 1);
  });

  pageInput.addEventListener('change', function () {
    var n = parseInt(pageInput.value, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      renderPage(n);
    } else {
      pageInput.value = currentPage;
    }
  });

  zoomIn.addEventListener('click', function () {
    setScale(scale * 1.2);
  });

  zoomOut.addEventListener('click', function () {
    setScale(scale / 1.2);
  });

  fitWidth.addEventListener('click', async function () {
    await fitWidthScale();
    await renderPage(currentPage);
  });

  fullscreenBtn.addEventListener('click', function () {
    reader.classList.toggle('fullscreen');
    var icon = fullscreenBtn.querySelector('i');
    if (reader.classList.contains('fullscreen')) {
      icon.className = 'fa-solid fa-compress';
      document.body.style.overflow = 'hidden';
    } else {
      icon.className = 'fa-solid fa-expand';
      document.body.style.overflow = '';
    }
  });

  // 键盘
  document.addEventListener('keydown', function (e) {
    // 只在没有输入焦点时响应
    if (e.target.tagName === 'INPUT') return;

    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      if (currentPage > 1) renderPage(currentPage - 1);
    } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      if (currentPage < totalPages) renderPage(currentPage + 1);
    } else if (e.key === 'Home') {
      renderPage(1);
    } else if (e.key === 'End') {
      renderPage(totalPages);
    } else if (e.key === '+' || e.key === '=') {
      setScale(scale * 1.2);
    } else if (e.key === '-') {
      setScale(scale / 1.2);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      toggleSearch();
    }
  });

  // 滚轮缩放（Ctrl + 滚轮）
  wrap.addEventListener('wheel', function (e) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale(scale * 1.1);
    } else {
      setScale(scale / 1.1);
    }
  }, { passive: false });

  // 窗口变化
  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (reader.classList.contains('fullscreen')) return;
      fitWidthScale().then(function () {
        renderPage(currentPage);
      });
    }, 200);
  });

  // ============================================
  // 搜索
  // ============================================
  function toggleSearch() {
    searchBar.hidden = !searchBar.hidden;
    if (!searchBar.hidden) searchInput.focus();
  }

  searchToggle.addEventListener('click', toggleSearch);

  searchClose.addEventListener('click', function () {
    searchBar.hidden = true;
    searchResults = [];
    searchIndex = -1;
    searchInfo.textContent = '';
  });

  var searchTimer = 0;
  searchInput.addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(doSearch, 400);
  });

  async function doSearch() {
    var query = searchInput.value.trim();
    if (!query || !pdfDoc) {
      searchResults = [];
      searchIndex = -1;
      searchInfo.textContent = '';
      return;
    }

    searchResults = [];

    // 逐页搜索
    for (var i = 1; i <= totalPages; i++) {
      try {
        var page = await pdfDoc.getPage(i);
        var textContent = await page.getTextContent();
        var text = textContent.items.map(function (item) {
          return item.str;
        }).join(' ');

        if (text.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
          searchResults.push(i);
        }
      } catch (err) {
        // 跳过
      }
    }

    searchIndex = searchResults.length > 0 ? 0 : -1;
    updateSearchInfo();

    if (searchIndex >= 0) {
      renderPage(searchResults[searchIndex]);
    }
  }

  function updateSearchInfo() {
    if (searchResults.length === 0) {
      searchInfo.textContent = '无结果';
      return;
    }
    searchInfo.textContent =
      (searchIndex + 1) + ' / ' + searchResults.length + ' 页';
  }

  searchPrev.addEventListener('click', function () {
    if (searchResults.length === 0) return;
    searchIndex = (searchIndex - 1 + searchResults.length) % searchResults.length;
    updateSearchInfo();
    renderPage(searchResults[searchIndex]);
  });

  searchNext.addEventListener('click', function () {
    if (searchResults.length === 0) return;
    searchIndex = (searchIndex + 1) % searchResults.length;
    updateSearchInfo();
    renderPage(searchResults[searchIndex]);
  });

  // ============================================
  // 启动
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();