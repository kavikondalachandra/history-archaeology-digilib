/**
 * DigiLib - Core Application Controller
 * Department of Ancient Indian History, Culture & Archaeology
 * Rashtrasant Tukadoji Maharaj Nagpur University
 * Concept & Design by K.S.Chandra, 2026, kavikondalaschandra@gmail.com
 */

var DigiApp = (function() {
  const getStorage = () => (typeof window !== 'undefined' ? window.DigiStorage : null);
  const getAuth = () => (typeof window !== 'undefined' ? window.DigiAuth : null);
  const getSecurity = () => (typeof window !== 'undefined' ? window.DigiSecurity : null);
  const getReader = () => (typeof window !== 'undefined' ? window.DigiReader : null);
  const getAdmin = () => (typeof window !== 'undefined' ? window.DigiAdmin : null);

  let allBooks = [];
  let currentCategory = 'all';
  let searchQuery = '';
  let formatFilter = 'all';
  let sortBy = 'popular';
  let pendingBookToDownload = null;

  async function init() {
    // 1. Initialize Sub-systems safely
    try { const sec = getSecurity(); if (sec) sec.init(); } catch(e) { console.warn('Security init:', e); }
    try { const st = getStorage(); if (st) await st.init(); } catch(e) { console.warn('Storage init:', e); }
    try { const au = getAuth(); if (au) au.init(); } catch(e) { console.warn('Auth init:', e); }
    try { const ad = getAdmin(); if (ad) ad.init(); } catch(e) { console.warn('Admin init:', e); }

    // 2. Update Server connection indicator
    try { updateServerIndicator(); } catch(e) {}

    // 3. Load books and render (guaranteed to render books)
    try { await loadBooks(); } catch(e) { console.error('Failed to load books:', e); }

    // 4. Setup Event Listeners
    try { setupSearch(); } catch(e) {}
    try { setupModals(); } catch(e) {}
  }

  // Update Top Bar Server Indicator
  function updateServerIndicator() {
    const pill = document.getElementById('serverStatusPill');
    const dot = document.getElementById('serverStatusDot');
    const text = document.getElementById('serverStatusText');

    if (!pill || !text) return;

    const storage = getStorage();
    if (storage && storage.isConnected()) {
      dot.className = 'status-dot';
      const info = storage.getServerInfo();
      const url = storage.getServerUrl() || '';
      if ((info && info.server && info.server.includes('Vercel')) || url.includes('vercel.app')) {
        text.textContent = 'Vercel Cloud Active';
      } else {
        text.textContent = 'Java Server Active (Port 8080)';
      }
    } else {
      dot.className = 'status-dot cloud';
      text.textContent = 'Online Research Archive';
    }
  }

  // Load books from Storage
  async function loadBooks() {
    const storage = getStorage();
    allBooks = storage ? await storage.getBooks() : [];
    renderCategories();
    renderBooks();
    updateStats();
  }

  const ACADEMIC_CATEGORIES = [
    'Archaeology & Excavations',
    'Ancient Indian History',
    'Epigraphy & Inscriptions',
    'Numismatics & Ancient Coins',
    'Temple Architecture & Iconography',
    'Prehistory & Indus Valley',
    'Heritage of Vidarbha & Central India',
    'Sanskrit & Manuscripts'
  ];

  // Render Categories Filter Pills
  function renderCategories() {
    const container = document.getElementById('categoryScrollContainer');
    if (!container) return;

    const categoriesMap = { 'all': allBooks.length };
    for (const cat of ACADEMIC_CATEGORIES) {
      categoriesMap[cat] = 0;
    }

    for (const b of allBooks) {
      const rawCat = (b.category || '').trim() || 'General';
      // Find matching standard category or record custom
      const matchedStd = ACADEMIC_CATEGORIES.find(c => c.toLowerCase() === rawCat.toLowerCase());
      const catKey = matchedStd || rawCat;
      categoriesMap[catKey] = (categoriesMap[catKey] || 0) + 1;
    }

    // Build ordered list of categories: 'all', then standard categories, then custom
    const customCats = Object.keys(categoriesMap).filter(c => c !== 'all' && !ACADEMIC_CATEGORIES.includes(c));
    const allCatKeys = ['all', ...ACADEMIC_CATEGORIES, ...customCats];

    container.innerHTML = allCatKeys.map(cat => {
      const label = cat === 'all' ? 'All Collections' : cat;
      const count = categoriesMap[cat] || 0;
      const isActive = currentCategory.toLowerCase() === cat.toLowerCase() ? 'active' : '';
      return `
        <button type="button" class="cat-pill ${isActive}" data-cat="${escapeHtml(cat)}">
          <span>${escapeHtml(label)}</span>
          <span class="cat-count">${count}</span>
        </button>
      `;
    }).join('');

    // Attach click handlers cleanly
    container.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const cat = this.getAttribute('data-cat');
        setCategory(cat);
      });
    });
  }

  // Set Category
  function setCategory(cat) {
    currentCategory = cat || 'all';
    renderCategories();
    renderBooks();
  }

  // Filter and Sort Books
  function getFilteredBooks() {
    let filtered = [...allBooks];

    // Category filter (flexible matching)
    if (currentCategory && currentCategory !== 'all') {
      const targetCat = currentCategory.trim().toLowerCase();
      filtered = filtered.filter(b => {
        const bookCat = (b.category || '').trim().toLowerCase();
        return bookCat === targetCat || bookCat.includes(targetCat) || targetCat.includes(bookCat);
      });
    }

    // Format filter
    if (formatFilter !== 'all') {
      filtered = filtered.filter(b => (b.format || 'pdf').toLowerCase() === formatFilter);
    }

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b => {
        const titleMatch = (b.title || '').toLowerCase().includes(q);
        const authorMatch = (b.author || '').toLowerCase().includes(q);
        const eraMatch = (b.era || '').toLowerCase().includes(q);
        const descMatch = (b.description || '').toLowerCase().includes(q);
        const tagsMatch = (b.tags || []).some(t => t.toLowerCase().includes(q));
        return titleMatch || authorMatch || eraMatch || descMatch || tagsMatch;
      });
    }

    // Sorting
    if (sortBy === 'popular') {
      filtered.sort((a, b) => (b.reads || 0) - (a.reads || 0));
    } else if (sortBy === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'author') {
      filtered.sort((a, b) => a.author.localeCompare(b.author));
    } else if (sortBy === 'recent') {
      filtered.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    }

    return filtered;
  }

  // Render Books Grid
  function renderBooks() {
    const grid = document.getElementById('booksGrid');
    const countEl = document.getElementById('activeResultsCount');
    if (!grid) return;

    const books = getFilteredBooks();
    if (countEl) countEl.textContent = `${books.length} Books Available`;

    if (books.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #FFFFFF; border-radius: var(--radius-md); border: 1px dashed var(--color-border);">
          <div style="font-size: 3rem; color: var(--color-gold); margin-bottom: 12px;">&#128214;</div>
          <h3 style="font-family: var(--font-heading); color: var(--color-primary-dark); margin-bottom: 8px;">No Research Volumes Matched</h3>
          <p style="color: var(--color-text-muted); max-width: 440px; margin: 0 auto 18px auto;">
            Try adjusting your search terms or selecting a different category filter from the options above.
          </p>
          <button onclick="DigiApp.resetFilters()" class="search-btn" style="display:inline-flex; margin:0 auto;">Reset Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = books.map(book => {
      const format = (book.format || 'pdf').toLowerCase();
      const cover = book.coverImage || 'assets/images/covers/cover_wonder_india.svg';

      return `
        <div class="book-card" id="card-${book.id}">
          <div class="card-cover-wrapper">
            <img src="${escapeAttr(cover)}" alt="${escapeAttr(book.title)}" class="card-cover-img" loading="lazy">
            <div class="card-badges-top">
              <span class="format-badge ${format}">${format.toUpperCase()}</span>
              <span class="era-badge">${escapeHtml(book.era || 'Ancient Era')}</span>
            </div>
            <div class="cover-overlay-actions">
              <button class="btn-read-quick" onclick="DigiApp.handleReadClick('${book.id}')">
                <span>&#128214;</span> Read Online
              </button>
              <button class="btn-download-quick" onclick="DigiApp.handleDownloadClick('${book.id}')">
                <span>&#11015;</span> Download (1/Day)
              </button>
            </div>
          </div>

          <div class="card-body">
            <div class="card-category-tag">${escapeHtml(book.category || 'General')}</div>
            <h3 class="card-title" title="${escapeAttr(book.title)}">${escapeHtml(book.title)}</h3>
            <div class="card-author">
              <span>&#9997;</span> ${escapeHtml(book.author)}
            </div>
            <p class="card-desc">${escapeHtml(book.description || '')}</p>

            <div class="card-meta-row">
              <span>&#128196; ${book.pages || 100} pages</span>
              <span>&#128190; ${book.fileSize || '2 MB'}</span>
              <span>&#128065; ${book.reads || 0} reads</span>
            </div>

            <div class="card-actions-bar">
              <button class="btn-card-read" onclick="DigiApp.handleReadClick('${book.id}')">
                <span>&#128214;</span> Read (Unlimited)
              </button>
              <button class="btn-card-download" onclick="DigiApp.handleDownloadClick('${book.id}')" title="Download Document (1 per calendar day)">
                <span>&#11015;</span> Download
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Update Stats in Hero Banner
  function updateStats() {
    const volEl = document.getElementById('statTotalVolumes');
    const readEl = document.getElementById('statTotalReads');
    if (volEl) volEl.textContent = allBooks.length;
    if (readEl) {
      const totalReads = allBooks.reduce((sum, b) => sum + (b.reads || 0), 0);
      readEl.textContent = totalReads.toLocaleString();
    }
  }

  // Handle "Read Online" Click: Unlimited Online Reading
  function handleReadClick(bookId) {
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;

    const auth = getAuth();
    const reader = getReader();

    if (auth && !auth.isAuthenticated()) {
      openAuthModal(() => {
        if (reader) reader.openBook(book);
        incrementReadCounter(book);
      });
      return;
    }

    if (reader) reader.openBook(book);
    incrementReadCounter(book);
  }

  function incrementReadCounter(book) {
    book.reads = (book.reads || 0) + 1;
    const cardReadEl = document.querySelector(`#card-${book.id} .card-meta-row span:last-child`);
    if (cardReadEl) cardReadEl.innerHTML = `&#128065; ${book.reads} reads`;
  }

  // Handle "Download" Click: Strictly 1 Download Per Day Enforcement
  function handleDownloadClick(bookId) {
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;

    const auth = getAuth();
    const storage = getStorage();

    if (auth && !auth.isAuthenticated()) {
      openAuthModal(() => {
        handleDownloadClick(bookId);
      });
      return;
    }

    const user = auth ? auth.getUser() : null;

    if (storage && user && !storage.canDownloadToday(user.email)) {
      openDownloadLimitModal();
      return;
    }

    pendingBookToDownload = book;
    openDownloadConfirmModal(book);
  }

  // Execute Approved Download
  async function executeDownload() {
    if (!pendingBookToDownload) return;
    const book = pendingBookToDownload;
    const auth = getAuth();
    const storage = getStorage();
    const security = getSecurity();
    const user = auth ? auth.getUser() : { email: 'scholar@rtmnu.ac.in' };

    closeModal('downloadConfirmModal');

    if (storage && storage.isConnected()) {
      const downloadUrl = `${storage.getServerUrl()}/api/books/download?id=${book.id}&email=${encodeURIComponent(user.email)}&token=${user.token || ''}`;
      window.location.href = downloadUrl;
    } else {
      let fileHref = book.filePath;
      if (storage && storage.getFileFromIDB) {
        try {
          const idbData = await storage.getFileFromIDB(book.id);
          if (idbData) fileHref = idbData;
        } catch(e) {}
      }
      const a = document.createElement('a');
      a.href = fileHref;
      a.download = `${book.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${book.format || 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    if (storage) storage.recordDownload(user.email, book.id);
    book.downloads = (book.downloads || 0) + 1;

    if (auth) auth.updateUserUI();
    pendingBookToDownload = null;

    if (security) security.showToast('Daily download recorded (1/1). Your next download unlocks tomorrow.');
  }

  // Search and Filter Setup
  function setupSearch() {
    const input = document.getElementById('mainSearchInput');
    const formatSelect = document.getElementById('searchFormatSelect');
    const sortSelect = document.getElementById('sortBySelect');

    if (input) {
      input.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderBooks();
      });
    }

    if (formatSelect) {
      formatSelect.addEventListener('change', (e) => {
        formatFilter = e.target.value;
        renderBooks();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        sortBy = e.target.value;
        renderBooks();
      });
    }
  }

  function resetFilters() {
    currentCategory = 'all';
    searchQuery = '';
    formatFilter = 'all';
    sortBy = 'popular';

    const input = document.getElementById('mainSearchInput');
    const formatSelect = document.getElementById('searchFormatSelect');
    const sortSelect = document.getElementById('sortBySelect');

    if (input) input.value = '';
    if (formatSelect) formatSelect.value = 'all';
    if (sortSelect) sortSelect.value = 'popular';

    renderCategories();
    renderBooks();
  }

  // Modal Setup
  function setupModals() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    const emailInput = document.getElementById('authEmailInput');
    if (emailInput) {
      emailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSendOtp();
        }
      });
    }

    const otpInput = document.getElementById('authOtpInput');
    if (otpInput) {
      otpInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleVerifyOtp();
        }
      });
    }
  }

  // Email Authentication Modal
  let authSuccessCallback = null;

  function openAuthModal(callback) {
    authSuccessCallback = callback || null;
    const modal = document.getElementById('authModal');
    if (!modal) return;

    const stepEmail = document.getElementById('authStepEmail');
    const stepOtp = document.getElementById('authStepOtp');
    const emailInput = document.getElementById('authEmailInput');
    const otpInput = document.getElementById('authOtpInput');
    const demoHint = document.getElementById('demoOtpHint');
    const errorEl = document.getElementById('authEmailError');
    const otpErrorEl = document.getElementById('authOtpError');

    if (errorEl) errorEl.textContent = '';
    if (otpErrorEl) otpErrorEl.textContent = '';
    if (stepEmail) stepEmail.style.display = 'block';
    if (stepOtp) stepOtp.style.display = 'none';
    if (emailInput) emailInput.value = '';
    if (otpInput) otpInput.value = '';
    if (demoHint) demoHint.style.display = 'none';

    modal.classList.add('active');
    if (emailInput) setTimeout(() => emailInput.focus(), 150);
  }

  let activeVerificationCode = '';

  async function handleSendOtp() {
    const emailInput = document.getElementById('authEmailInput');
    const email = (emailInput ? emailInput.value : '').trim();
    const btn = document.getElementById('btnSendOtp');
    const errorEl = document.getElementById('authEmailError');
    if (errorEl) errorEl.textContent = '';

    if (!email || !email.includes('@') || !email.includes('.')) {
      if (errorEl) errorEl.textContent = 'Please enter a valid personal or university email address.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Generating Verification Code...';

    const auth = getAuth();
    try {
      if (!auth) throw new Error('Authentication service loading...');
      const res = await auth.requestOtp(email);
      activeVerificationCode = (res && res.demoOtp) ? res.demoOtp : Math.floor(100000 + Math.random() * 900000).toString();

      document.getElementById('authStepEmail').style.display = 'none';
      document.getElementById('authStepOtp').style.display = 'block';

      const targetEmailEl = document.getElementById('otpTargetEmail');
      if (targetEmailEl) targetEmailEl.textContent = email;

      const displayOtpEl = document.getElementById('displayOtpNumber');
      if (displayOtpEl) displayOtpEl.textContent = activeVerificationCode;

      // Auto-prefill the input so the user can verify in 1 click
      const otpField = document.getElementById('authOtpInput');
      if (otpField) {
        otpField.value = activeVerificationCode;
        setTimeout(() => otpField.focus(), 150);
      }
    } catch (err) {
      if (errorEl) errorEl.textContent = err.message || 'Unable to generate verification code. Please try again.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Verification Code (OTP)';
    }
  }

  function handleQuickAutoVerify() {
    const otpField = document.getElementById('authOtpInput');
    if (otpField && activeVerificationCode) {
      otpField.value = activeVerificationCode;
    }
    handleVerifyOtp();
  }

  function backToEmailStep() {
    const stepEmail = document.getElementById('authStepEmail');
    const stepOtp = document.getElementById('authStepOtp');
    if (stepOtp) stepOtp.style.display = 'none';
    if (stepEmail) stepEmail.style.display = 'block';
    const emailInput = document.getElementById('authEmailInput');
    if (emailInput) setTimeout(() => emailInput.focus(), 100);
  }

  async function handleVerifyOtp() {
    const email = document.getElementById('authEmailInput').value;
    const otp = document.getElementById('authOtpInput').value;
    const btn = document.getElementById('btnVerifyOtp');
    const errorEl = document.getElementById('authOtpError');
    if (errorEl) errorEl.textContent = '';

    btn.disabled = true;
    btn.textContent = 'Verifying...';

    const auth = getAuth();
    const security = getSecurity();

    try {
      if (!auth) throw new Error('Authentication service loading...');
      await auth.verifyOtp(email, otp);
      closeModal('authModal');
      if (security) security.showToast('Email verified successfully! Welcome to the Digital Research Archive.');

      if (typeof authSuccessCallback === 'function') {
        const cb = authSuccessCallback;
        authSuccessCallback = null;
        cb();
      }
    } catch (err) {
      if (errorEl) errorEl.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Verify & Enter Library';
    }
  }

  function openDownloadLimitModal() {
    const modal = document.getElementById('downloadLimitModal');
    if (modal) modal.classList.add('active');
  }

  function openDownloadConfirmModal(book) {
    const modal = document.getElementById('downloadConfirmModal');
    if (!modal) return;

    document.getElementById('confirmDownloadTitle').textContent = book.title;
    document.getElementById('confirmDownloadAuthor').textContent = book.author;
    document.getElementById('confirmDownloadFormat').textContent = (book.format || 'pdf').toUpperCase();
    document.getElementById('confirmDownloadSize').textContent = book.fileSize || '2 MB';

    modal.classList.add('active');
  }

  function openServerModal(tab) {
    const admin = getAdmin();
    if (admin) admin.openAdminModal(tab || 'server');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;');
  }

  return {
    init,
    loadBooks,
    updateServerIndicator,
    setCategory,
    resetFilters,
    handleReadClick,
    handleDownloadClick,
    executeDownload,
    openAuthModal,
    handleSendOtp,
    handleVerifyOtp,
    handleQuickAutoVerify,
    backToEmailStep,
    openServerModal,
    closeModal
  };
})();

// Attach explicitly to window for inline onclick handlers
if (typeof window !== 'undefined') {
  window.DigiApp = DigiApp;
}

// Bootstrap on DOM Ready or immediately if DOM is already loaded
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      DigiApp.init();
    });
  } else {
    // DOM already loaded
    DigiApp.init();
  }
}
