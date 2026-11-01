/* ============================================
   文档页专属逻辑 (解析 Markdown)
   ============================================ */

(function () {
  'use strict';

  const mdContainer = document.getElementById('markdownContainer');
  const menuLinks = document.querySelectorAll('.docs-menu a');
  const docsBasePath = 'assets/docs/';

  // 核心加载函数
  async function loadMarkdown(filename) {
    if (!mdContainer) return;
    
    mdContainer.innerHTML = '<p style="color: var(--text-muted);">加载文档中...</p>';

    try {
      const res = await fetch(docsBasePath + filename);
      if (!res.ok) throw new Error('文件未找到');
      const markdownText = await res.text();

      // 1. 使用 marked 解析 Markdown
      mdContainer.innerHTML = marked.parse(markdownText);

      // 2. 使用 highlight.js 渲染代码块
      mdContainer.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });

    } catch (err) {
      mdContainer.innerHTML = `
        <h1>404 Not Found</h1>
        <p>无法加载文档 <code>${filename}</code>，请检查 assets/docs/ 目录下是否存在该文件。</p>
      `;
    }
  }

  // 绑定左侧菜单点击事件
  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // 更新高亮状态
      menuLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // 获取文件名并加载
      const file = link.getAttribute('data-file');
      if (file) loadMarkdown(file);
    });
  });

  // 默认加载第一篇文档 (如果菜单里有第一项的话)
  if (menuLinks.length > 0) {
    menuLinks[0].click();
  }

})();