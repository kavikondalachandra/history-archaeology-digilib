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

  function isLibrarianOrInputField(target) {
    // 1. If Librarian Portal modal is active, allow 100% unrestricted copy, paste, and context menu
    const adminModal = document.getElementById('adminModal');
    if (adminModal && adminModal.classList.contains('active')) {
      return true;
    }

    // 2. If target is inside Librarian Portal
    if (target && target.closest && target.closest('#adminModal')) {
      return true;
    }

    // 3. If target or currently focused active element is an input, textarea, select, or contenteditable
    const el = target || document.activeElement;
    if (el) {
      if (el.closest && el.closest('#adminModal')) return true;
      const tag = (el.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) {
        return true;
      }
    }

    if (document.activeElement) {
      const activeTag = (document.activeElement.tagName || '').toUpperCase();
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT' || document.activeElement.isContentEditable) {
        return true;
      }
      if (document.activeElement.closest && document.activeElement.closest('#adminModal')) {
        return true;
      }
    }

    return false;
  }

  function init() {
    // Stop propagation on Librarian Portal so native browser events are never intercepted
    const adminModal = document.getElementById('adminModal');
    if (adminModal) {
      ['copy', 'paste', 'cut', 'contextmenu'].forEach(eventType => {
        adminModal.addEventListener(eventType, function(e) {
          e.stopPropagation();
        }, true);
      });
      adminModal.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a', 'C', 'V', 'X', 'A'].includes(e.key)) {
          e.stopPropagation();
        }
      }, true);
    }

    // 1. Disable Right Click Context Menu (allowed inside Librarian Portal and form fields)
    document.addEventListener('contextmenu', function(e) {
      if (isLibrarianOrInputField(e.target)) {
        return true;
      }
      e.preventDefault();
      showToast('Manuscript Protected: Right-click is restricted by University Archival Policy.');
      return false;
    });

    // 2. Disable Keyboard Shortcuts: Print, Save, Inspect, PrintScreen, Copy, Paste, Cut
    document.addEventListener('keydown', function(e) {
      const isAllowedArea = isLibrarianOrInputField(e.target);

      // In Librarian Portal or form fields, enable standard copy, paste, cut, select all
      if (isAllowedArea && (e.ctrlKey || e.metaKey)) {
        const k = (e.key || '').toLowerCase();
        if (k === 'c' || k === 'v' || k === 'x' || k === 'a') {
          return true;
        }
      }

      // Ctrl+C or Cmd+C (Copy) - restricted for readers/dashboard
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        showToast('Copying content is disabled for digital archive preservation.');
        return false;
      }
      // Ctrl+V or Cmd+V (Paste) - restricted outside inputs
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        showToast('Pasting is disabled by University Archival Security Policy.');
        return false;
      }
      // Ctrl+X or Cmd+X (Cut) - restricted outside inputs
      if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        showToast('Cut action is disabled by University Archival Security Policy.');
        return false;
      }
      // Ctrl+A or Cmd+A (Select All outside form inputs)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        if (!isAllowedArea) {
          e.preventDefault();
          return false;
        }
      }
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

    // 3. Disable Clipboard Copy, Paste, and Cut Events (permitted in Librarian Portal and inputs)
    document.addEventListener('copy', function(e) {
      if (isLibrarianOrInputField(e.target)) {
        return true;
      }
      e.preventDefault();
      showToast('Copying content is disabled for digital archive preservation.');
      return false;
    });

    document.addEventListener('paste', function(e) {
      if (isLibrarianOrInputField(e.target)) {
        return true;
      }
      e.preventDefault();
      showToast('Pasting is disabled by University Archival Security Policy.');
      return false;
    });

    document.addEventListener('cut', function(e) {
      if (isLibrarianOrInputField(e.target)) {
        return true;
      }
      e.preventDefault();
      return false;
    });

    // 4. Disable Text Drag & Select in protected elements
    document.addEventListener('dragstart', function(e) {
      if (isLibrarianOrInputField(e.target)) {
        return true;
      }
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
