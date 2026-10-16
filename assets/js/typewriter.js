/* ============================================
   动态字幕 · 打字机
   Hero 副标题循环切换关键词
   ============================================ */

(function () {
  'use strict';

  // 循环显示的字幕
  var PHRASES = [
    '20 种语言的课程表应用',
    '数据永远留在你的设备上',
    '打开即用，无需登录',
    '免费开源，MIT 协议',
    '教师、学生、家长都适用',
    '打开即看今天上什么'
  ];

  var TYPE_SPEED = 70;      // 打字每字毫秒
  var DELETE_SPEED = 35;    // 删除每字毫秒
  var HOLD_MS = 1800;       // 完整显示停留毫秒
  var BETWEEN_MS = 400;     // 短语切换间隔

  var textEl = document.querySelector('#typewriter .tw-text');
  if (!textEl) return;

  var phraseIndex = 0;
  var charIndex = 0;
  var deleting = false;

  /**
   * 打字循环
   */
  function tick() {
    var phrase = PHRASES[phraseIndex];

    if (!deleting) {
      // 打字阶段
      charIndex += 1;
      textEl.textContent = phrase.slice(0, charIndex);

      if (charIndex >= phrase.length) {
        // 打完停顿再删除
        deleting = true;
        setTimeout(tick, HOLD_MS);
        return;
      }
      setTimeout(tick, TYPE_SPEED);
    } else {
      // 删除阶段
      charIndex -= 1;
      textEl.textContent = phrase.slice(0, charIndex);

      if (charIndex <= 0) {
        // 删完切下一条
        deleting = false;
        phraseIndex = (phraseIndex + 1) % PHRASES.length;
        setTimeout(tick, BETWEEN_MS);
        return;
      }
      setTimeout(tick, DELETE_SPEED);
    }
  }

  // 延迟一点启动，等首屏淡入完成
  setTimeout(tick, 800);
})();