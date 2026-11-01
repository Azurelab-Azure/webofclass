/* ============================================
   PlanPeople - download.js
   ============================================ */

(function () {
  'use strict';

  const STAR_KEY = 'planpeople_beta_unlocked';

  const consentBox = document.getElementById('consentBox');
  const consentCheck = document.getElementById('consentCheck');
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  const starBtn = document.getElementById('starBtn');
  const downloadArea = document.getElementById('downloadArea');

  if (!consentBox || !consentCheck || !starBtn) return;

  function checkUnlocked() {
    try {
      if (localStorage.getItem(STAR_KEY) === '1') {
        step1.style.display = 'none';
        step2.style.display = 'none';
        step3.style.display = 'block';
        downloadArea.style.display = 'block';
      }
    } catch (e) {}
  }

  consentBox.addEventListener('scroll', () => {
    const isAtBottom = consentBox.scrollHeight - consentBox.scrollTop <= consentBox.clientHeight + 5;
    if (isAtBottom && consentCheck.disabled) {
      consentCheck.disabled = false;
      const tip = document.getElementById('scrollTip');
      if (tip) tip.innerHTML = '<span style="color:#28C840;">已阅读完毕</span>';
    }
  });

  consentCheck.addEventListener('change', (e) => {
    if (e.target.checked) {
      step1.style.opacity = '0.4';
      consentCheck.disabled = true;
      step2.style.display = 'block';
    }
  });

  starBtn.addEventListener('click', () => {
    try { localStorage.setItem(STAR_KEY, '1'); } catch (e) {}
    step2.style.opacity = '0.4';
    step2.style.pointerEvents = 'none';
    step3.style.display = 'block';
    downloadArea.style.display = 'block';
  });

  checkUnlocked();

})();