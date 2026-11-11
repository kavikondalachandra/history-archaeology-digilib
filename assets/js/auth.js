/**
 * DigiLib - Server-Backed Email Verification Engine
 * Department of Ancient Indian History, Culture & Archaeology, RTMNU
 */

const DigiAuth = (function() {
  const AUTH_STORAGE_KEY = 'digilib_auth_user';
  let currentUser = null;

  function init() {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        currentUser = JSON.parse(stored);
        updateUserUI();
      }
    } catch (e) {
      currentUser = null;
    }
  }

  function getUser() {
    return currentUser;
  }

  function isAuthenticated() {
    return !!(currentUser && currentUser.email && currentUser.verified);
  }

  // Request OTP from server
  async function requestOtp(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      throw new Error('Please enter a valid academic or personal email address.');
    }

    if (DigiStorage.isConnected()) {
      const resp = await fetch(`${DigiStorage.getServerUrl()}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to send verification code.');
      }
      return data;
    } else {
      // Standalone / GitHub Pages client-side simulation
      const demoOtp = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem('digilib_pending_otp', demoOtp);
      sessionStorage.setItem('digilib_pending_email', cleanEmail);
      return {
        success: true,
        message: `Verification code generated for ${cleanEmail}`,
        email: cleanEmail,
        demoOtp: demoOtp
      };
    }
  }

  // Verify OTP
  async function verifyOtp(email, otp) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (DigiStorage.isConnected()) {
      const resp = await fetch(`${DigiStorage.getServerUrl()}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Invalid verification code.');
      }
      currentUser = {
        email: cleanEmail,
        token: data.token,
        verified: true,
        loginTime: new Date().toISOString()
      };
    } else {
      // Standalone simulation validation
      const pendingOtp = sessionStorage.getItem('digilib_pending_otp');
      const pendingEmail = sessionStorage.getItem('digilib_pending_email');
      if (cleanEmail !== pendingEmail || cleanOtp !== pendingOtp) {
        throw new Error('Invalid verification code entered. Please check and try again.');
      }
      currentUser = {
        email: cleanEmail,
        token: 'client_token_' + Date.now(),
        verified: true,
        loginTime: new Date().toISOString()
      };
      sessionStorage.removeItem('digilib_pending_otp');
      sessionStorage.removeItem('digilib_pending_email');
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
    updateUserUI();
    return currentUser;
  }

  // Logout
  function logout() {
    currentUser = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    updateUserUI();
  }

  // Update Top Bar & Badges
  function updateUserUI() {
    const authBox = document.getElementById('userAuthStatus');
    if (!authBox) return;

    if (isAuthenticated()) {
      const remaining = DigiStorage.getRemainingDownloads(currentUser.email);
      authBox.innerHTML = `
        <div class="user-status-card">
          <span class="verified-icon">&#10004;</span>
          <span style="font-weight:600;">${escapeHtml(currentUser.email)}</span>
          <span class="download-quota-badge" title="Daily Download Quota (Refreshes Daily)">Downloads: ${remaining}/1 left</span>
          <button onclick="DigiAuth.logout()" class="nav-btn" style="padding:2px 8px; font-size:0.75rem; margin-left:4px;">Logout</button>
        </div>
      `;
    } else {
      authBox.innerHTML = `
        <button onclick="DigiApp.openAuthModal()" class="nav-btn btn-primary">
          <span>&#128272;</span> Verify Email / Sign In
        </button>
      `;
    }
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  return {
    init,
    getUser,
    isAuthenticated,
    requestOtp,
    verifyOtp,
    logout,
    updateUserUI
  };
})();
