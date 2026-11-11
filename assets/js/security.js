/**
 * DigiLib - Security & Content Protection Suite
 * Department of Ancient Indian History, Culture & Archaeology, RTMNU
 * Features:
 *  - Right-click context menu disabled
 *  - Screenshot & Screen-recording deterrence (Dynamic Watermark + Focus Loss Shield)
 *  - Shortcut blocking (Ctrl+P, Ctrl+S, Ctrl+U, PrintScreen, DevTools)
 *  - Text copy/drag restriction
 */

var DigiSecurity = (function() {
  let watermarkInterval = null;
  let watermarkX = 20;
  let watermarkY = 80;
  let dirX = 1.2;
  let dirY = 0.8;

  function init() {
    // 1. Disable Right Click Context Menu
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      showToast('Manuscript Protected: Right-click is restricted by University Archival Policy.');
      return false;
    });

    // 2. Disable Keyboard Shortcuts: Print, Save, Inspect, PrintScreen
    document.addEventListener('keydown', function(e) {
      // Ctrl+P or Cmd+P (Print)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        showToast('Printing is disabled for digital archive preservation.');
        return false;
      }
      // Ctrl+S or Cmd+S (Save)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        showToast('Direct saving is disabled. Use the daily download option.');
        return false;
      }
      // Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I, F12 (DevTools)
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i'))) {
        e.preventDefault();
        return false;
      }
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.key === 'PrtScn') {
        e.preventDefault();
        triggerScreenshotBlackout();
        showToast('Screen capture restricted by RTMNU Digital Rights Protection.');
        return false;
      }
    });

    // 3. Disable Text Drag & Select in protected elements
    document.addEventListener('dragstart', function(e) {
      if (e.target.closest('.reader-modal') || e.target.closest('.book-card')) {
        e.preventDefault();
      }
    });

    // 4. Focus Loss & Window Blur Protection (Anti-Screen Recording / Snipping Tool)
    window.addEventListener('blur', function() {
      const shield = document.getElementById('readerPrivacyShield');
      const readerModal = document.getElementById('readerModal');
      if (readerModal && readerModal.classList.contains('active') && shield) {
        shield.classList.add('active');
      }
    });

    window.addEventListener('focus', function() {
      const shield = document.getElementById('readerPrivacyShield');
      if (shield) {
        shield.classList.remove('active');
      }
    });

    document.addEventListener('visibilitychange', function() {
      const shield = document.getElementById('readerPrivacyShield');
      const readerModal = document.getElementById('readerModal');
      if (document.hidden && readerModal && readerModal.classList.contains('active') && shield) {
        shield.classList.add('active');
      } else if (!document.hidden && shield) {
        shield.classList.remove('active');
      }
    });
  }

  // Dynamic Floating Watermark in Reader Viewport
  function startWatermark(userEmail) {
    stopWatermark();
    const overlay = document.getElementById('readerWatermarkOverlay');
    if (!overlay) return;

    overlay.innerHTML = '';
    const stamp = document.createElement('div');
    stamp.className = 'watermark-stamp';
    stamp.id = 'liveWatermarkStamp';
    overlay.appendChild(stamp);

    const email = userEmail || 'Scholar Research Session';

    function updateStamp() {
      const now = new Date();
      const timeStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
      stamp.textContent = `RTMNU ARCHIVES • USER: ${email} • ${timeStr} • CONFIDENTIAL ACADEMIC ACCESS`;

      const bounds = overlay.getBoundingClientRect();
      const maxX = Math.max(100, bounds.width - 450);
      const maxY = Math.max(100, bounds.height - 80);

      watermarkX += dirX * 18;
      watermarkY += dirY * 12;

      if (watermarkX > maxX || watermarkX < 20) dirX *= -1;
      if (watermarkY > maxY || watermarkY < 40) dirY *= -1;

      stamp.style.left = `${Math.max(10, watermarkX)}px`;
      stamp.style.top = `${Math.max(20, watermarkY)}px`;
    }

    updateStamp();
    watermarkInterval = setInterval(updateStamp, 2500);
  }

  function stopWatermark() {
    if (watermarkInterval) {
      clearInterval(watermarkInterval);
      watermarkInterval = null;
    }
    const overlay = document.getElementById('readerWatermarkOverlay');
    if (overlay) overlay.innerHTML = '';
  }

  // Transient screen flash when PrintScreen is triggered
  function triggerScreenshotBlackout() {
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100vw';
    flash.style.height = '100vh';
    flash.style.backgroundColor = '#000000';
    flash.style.zIndex = '999999';
    flash.style.opacity = '1';
    flash.style.transition = 'opacity 0.4s ease';
    document.body.appendChild(flash);
    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => flash.remove(), 400);
    }, 150);
  }

  // Toast notification
  function showToast(message) {
    let toast = document.getElementById('securityToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'securityToast';
      toast.className = 'security-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span style="color:#D4AF37; font-size:1.2rem;">&#9888;</span> <span>${message}</span>`;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }

  return {
    init,
    startWatermark,
    stopWatermark,
    showToast
  };
})();

if (typeof window !== 'undefined') {
  window.DigiSecurity = DigiSecurity;
}
