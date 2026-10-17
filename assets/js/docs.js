
/* ============================================
   文档中心
   用 marked.js 渲染 Markdown
   支持搜索、哈希路由、代码高亮
   ============================================ */

(function () {
  'use strict';

  var INDEX_PATH = 'assets/docs/index.json';
  var DOCS_BASE = 'assets/docs/';
  var GITHUB_BASE = 'https://github.com/Azurelab-Azure/myclassroom/blob/main/assets/docs/';

  var navEl = document.getElementById('docsNav');
  var articleEl = document.getElementById('docsArticle');
  var breadcrumbEl = document.getElementById('docsBreadcrumb');
  var searchInput = document.getElementById('docsSearch');
  var searchClear = document.getElementById('docsSearchClear');
  var mobileToggle = document.getElementById('docsMobileToggle');
  var aside = document.getElementById('docsAside');
  var copyBtn = document.getElementById('docsCopyLink');
  var editLink = document.getElementById('docsEditLink');

  if (!navEl || !articleEl) return;

  var indexData = null;
  var flatItems = [];
  var currentId = null;

  // ============================================
  // 加载目录索引
  // ============================================
  async function loadIndex() {
    try {
      var res = await fetch(INDEX_PATH);
      if (!res.ok) throw new Error('索引加载失败');
      indexData = await res.json();
      buildFlatItems();
      renderNav();
    } catch (err) {
      console.error(err);
      navEl.innerHTML = '<div class="docs-nav-loading">目录加载失败</div>';
    }
  }

  /**
   * 拍平所有文档项，供搜索和查找使用
   */
  function buildFlatItems() {
    flatItems = [];
    if (!indexData || !indexData.groups) return;
    indexData.groups.forEach(function (group) {
      group.items.forEach(function (item) {
        flatItems.push({
          id: item.id,
          title: item.title,
          file: item.file,
          group: group.title
        });
      });
    });
  }

  /**
   * 渲染导航树
   */
  function renderNav(filterText) {
    if (!indexData) return;

    var filter = (filterText || '').trim().toLowerCase();
    var html = '';

    indexData.groups.forEach(function (group) {
      var items = group.items.filter(function (item) {
        if (!filter) return true;
        return item.title.toLowerCase().indexOf(filter) !== -1 ||
               item.id.toLowerCase().indexOf(filter) !== -1;
      });

      if (!items.length) return;

      html += '<div class="docs-nav-group">';
      html += '<div class="docs-nav-title">' + escapeHtml(group.title) + '</div>';
      html += '<ul class="docs-nav-items">';

      items.forEach(function (item) {
        var title = escapeHtml(item.title);
        if (filter) {
          // 高亮命中
          title = title.replace(
            new RegExp('(' + escapeRegExp(filter) + ')', 'gi'),
            '<mark>$1</mark>'
          );
        }
        var active = item.id === currentId ? ' class="active"' : '';
        html += '<li><a href="#' + item.id + '"' + active + '>' + title + '</a></li>';
      });

      html += '</ul></div>';
    });

    if (!html) {
      html = '<div class="docs-nav-loading">没有匹配的文档</div>';
    }

    navEl.innerHTML = html;

    // 绑定点击
    navEl.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var id = a.getAttribute('href').slice(1);
        navigateTo(id);
      });
    });
  }

  // ============================================
  // 加载并渲染 Markdown
  // ============================================
  async function loadDoc(item) {
    if (!item) return;

    articleEl.innerHTML =
      '<div class="docs-placeholder">' +
        '<i class="fa-solid fa-spinner fa-spin"></i>' +
        '<h2>正在加载</h2>' +
        '<p>' + escapeHtml(item.title) + '</p>' +
      '</div>';

    try {
      var res = await fetch(DOCS_BASE + item.file);
      if (!res.ok) throw new Error('文档加载失败');
      var md = await res.text();

      // 用 marked 渲染
      var html = marked.parse(md, {
        gfm: true,
        breaks: false,
        headerIds: true,
        mangle: false
      });

      articleEl.innerHTML = html;

      // 代码高亮
      if (window.hljs) {
        articleEl.querySelectorAll('pre code').forEach(function (block) {
          window.hljs.highlightElement(block);
        });
      }

      // 更新面包屑
      breadcrumbEl.innerHTML =
        escapeHtml(item.group) + ' · <strong>' + escapeHtml(item.title) + '</strong>';

      // 更新 GitHub 编辑链接
      if (editLink) {
        editLink.setAttribute('href', GITHUB_BASE + item.file);
      }

      // 更新活动项
      navEl.querySelectorAll('a').forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + item.id);
      });

      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      articleEl.innerHTML =
        '<div class="docs-placeholder">' +
          '<i class="fa-solid fa-circle-exclamation"></i>' +
          '<h2>文档加载失败</h2>' +
          '<p>' + escapeHtml(item.title) + '</p>' +
        '</div>';
    }
  }

  // ============================================
  // 路由
  // ============================================
  function getHashId() {
    var hash = window.location.hash.slice(1);
    return hash || (flatItems[0] && flatItems[0].id);
  }

  function navigateTo(id) {
    if (window.location.hash === '#' + id) {
      // 哈希没变，手动加载
      loadById(id);
    } else {
      window.location.hash = id;
    }
  }

  function loadById(id) {
    if (!id) return;
    var item = flatItems.find(function (x) { return x.id === id; });
    if (!item) {
      // 未知 id，退回第一项
      if (flatItems[0]) navigateTo(flatItems[0].id);
      return;
    }
    currentId = id;
    loadDoc(item);
    // 更新活动态
    navEl.querySelectorAll('a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + id);
    });
  }

  window.addEventListener('hashchange', function () {
    var id = getHashId();
    if (id && id !== currentId) loadById(id);
  });

  // ============================================
  // 搜索
  // ============================================
  if (searchInput) {
    var searchTimer = 0;
    searchInput.addEventListener('input', function () {
      var val = searchInput.value;
      searchClear.hidden = !val;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        renderNav(val);
      }, 150);
    });

    if (searchClear) {
      searchClear.addEventListener('click', function () {
        searchInput.value = '';
        searchClear.hidden = true;
        renderNav('');
        searchInput.focus();
      });
    }
  }

  // ============================================
  // 移动端目录
  // ============================================
  if (mobileToggle && aside) {
    mobileToggle.addEventListener('click', function () {
      aside.classList.toggle('mobile-hidden');
    });
  }

  // ============================================
  // 复制链接
  // ============================================
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var url = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
          setTimeout(function () {
            copyBtn.innerHTML = '<i class="fa-solid fa-link"></i>';
          }, 1500);
        });
      }
    });
  }

  // ============================================
  // 主题联动 · 切换代码高亮样式
  // ============================================
  function updateHljsTheme() {
    var theme = document.documentElement.getAttribute('data-theme');
    var light = document.getElementById('hljs-light');
    var dark = document.getElementById('hljs-dark');
    if (!light || !dark) return;
    var isDark = theme === 'dark';
    light.disabled = isDark;
    dark.disabled = !isDark;
  }

  window.addEventListener('myclassroom:themechange', updateHljsTheme);

  // ============================================
  // 工具
  // ============================================
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ============================================
  // 启动
  // ============================================
  async function boot() {
    updateHljsTheme();
    await loadIndex();
    var id = getHashId();
    if (id) loadById(id);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();