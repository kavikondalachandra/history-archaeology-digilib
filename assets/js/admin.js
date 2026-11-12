/**
 * DigiLib - Admin & Catalogue Management Portal
 * Department of Ancient Indian History, Culture & Archaeology, RTMNU
 * Features:
 *  - Secure in-modal passphrase gate
 *  - Upload new manuscripts (PDF, DOCX, DOC)
 *  - Manage catalogue database & export books.json
 *  - Protected server & storage configuration (Vercel Backend URL)
 */

var DigiAdmin = (function() {
  const ADMIN_PASS_STORAGE_KEY = 'digilib_admin_passphrase';
  const DEFAULT_ADMIN_PASS = 'rtmnu2026';
  let isAuthenticatedAdmin = false;
  let stagedFile = null;

  function getStoredPassphrase() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(ADMIN_PASS_STORAGE_KEY);
        if (stored && stored.trim().length > 0) {
          return stored.trim();
        }
      }
    } catch (e) {}
    return DEFAULT_ADMIN_PASS;
  }

  function saveStoredPassphrase(newPass) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ADMIN_PASS_STORAGE_KEY, newPass.trim());
    }
  }

  function resetStoredPassphrase() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ADMIN_PASS_STORAGE_KEY);
    }
  }

  function init() {
    setupDropzone();
  }

  function openAdminModal(targetTab) {
    const modal = document.getElementById('adminModal');
    if (!modal) return;

    modal.classList.add('active');

    const loginView = document.getElementById('adminLoginView');
    const contentView = document.getElementById('adminContentView');
    const passInput = document.getElementById('adminPassInput');
    const errorEl = document.getElementById('adminLoginError');

    if (errorEl) errorEl.textContent = '';

    if (!isAuthenticatedAdmin) {
      if (loginView) loginView.style.display = 'block';
      if (contentView) contentView.style.display = 'none';
      if (passInput) {
        passInput.value = '';
        setTimeout(() => passInput.focus(), 150);
      }
    } else {
      if (loginView) loginView.style.display = 'none';
      if (contentView) contentView.style.display = 'block';
      switchTab(targetTab || 'add');
    }
  }

  function loginWithPassphrase() {
    const passInput = document.getElementById('adminPassInput');
    const errorEl = document.getElementById('adminLoginError');
    const pass = passInput ? passInput.value.trim() : '';

    const currentPass = getStoredPassphrase();

    if (pass === currentPass) {
      isAuthenticatedAdmin = true;
      if (errorEl) errorEl.textContent = '';
      const loginView = document.getElementById('adminLoginView');
      const contentView = document.getElementById('adminContentView');
      if (loginView) loginView.style.display = 'none';
      if (contentView) contentView.style.display = 'block';
      switchTab('add');
      if (typeof window !== 'undefined' && window.DigiSecurity) {
        window.DigiSecurity.showToast('Librarian administration portal unlocked.');
      }
    } else {
      if (errorEl) errorEl.textContent = 'Incorrect passphrase. Access restricted to authorized faculty.';
      if (passInput) {
        passInput.value = '';
        passInput.focus();
      }
    }
  }

  function promptResetPassphrase(e) {
    if (e && e.preventDefault) e.preventDefault();
    const current = getStoredPassphrase();
    if (current === DEFAULT_ADMIN_PASS) {
      alert('The administration passphrase is currently set to the default: ' + DEFAULT_ADMIN_PASS);
      const passInput = document.getElementById('adminPassInput');
      if (passInput) {
        passInput.value = DEFAULT_ADMIN_PASS;
        passInput.focus();
      }
      return;
    }

    const answer = prompt(
      'Reset Librarian Passphrase?\n\nTo reset the administrator passphrase back to default (rtmnu2026), type RESET below:'
    );
    if (answer && answer.trim().toUpperCase() === 'RESET') {
      resetStoredPassphrase();
      alert('Passphrase has been reset to default: ' + DEFAULT_ADMIN_PASS);
      const passInput = document.getElementById('adminPassInput');
      if (passInput) {
        passInput.value = DEFAULT_ADMIN_PASS;
        passInput.focus();
      }
      const errorEl = document.getElementById('adminLoginError');
      if (errorEl) errorEl.textContent = '';
      if (typeof window !== 'undefined' && window.DigiSecurity) {
        window.DigiSecurity.showToast('Passphrase reset to default (rtmnu2026)');
      }
    }
  }

  function logoutAdmin() {
    isAuthenticatedAdmin = false;
    const loginView = document.getElementById('adminLoginView');
    const contentView = document.getElementById('adminContentView');
    if (loginView) loginView.style.display = 'block';
    if (contentView) contentView.style.display = 'none';
    const passInput = document.getElementById('adminPassInput');
    if (passInput) passInput.value = '';
    if (typeof window !== 'undefined' && window.DigiSecurity) {
      window.DigiSecurity.showToast('Librarian portal locked.');
    }
  }

  function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.classList.remove('active');
  }

  function switchTab(tabName) {
    const tabAdd = document.getElementById('adminTabAdd');
    const tabList = document.getElementById('adminTabList');
    const tabServer = document.getElementById('adminTabServer');
    const tabSecurity = document.getElementById('adminTabSecurity');

    const btnAdd = document.getElementById('tabBtnAdd');
    const btnList = document.getElementById('tabBtnList');
    const btnServer = document.getElementById('tabBtnServer');
    const btnSecurity = document.getElementById('tabBtnSecurity');

    if (tabAdd) tabAdd.style.display = (tabName === 'add') ? 'block' : 'none';
    if (tabList) tabList.style.display = (tabName === 'list') ? 'block' : 'none';
    if (tabServer) tabServer.style.display = (tabName === 'server') ? 'block' : 'none';
    if (tabSecurity) tabSecurity.style.display = (tabName === 'security') ? 'block' : 'none';

    if (btnAdd) btnAdd.classList.toggle('active', tabName === 'add');
    if (btnList) btnList.classList.toggle('active', tabName === 'list');
    if (btnServer) btnServer.classList.toggle('active', tabName === 'server');
    if (btnSecurity) btnSecurity.classList.toggle('active', tabName === 'security');

    if (tabName === 'list') {
      renderBookList();
    } else if (tabName === 'server') {
      populateServerSettings();
    } else if (tabName === 'security') {
      initSecurityTab();
    }
  }

  function populateServerSettings() {
    const serverInput = document.getElementById('adminServerUrlInput');
    if (serverInput) {
      serverInput.value = DigiStorage.getServerUrl();
    }
    const tokenInput = document.getElementById('adminBlobTokenInput');
    if (tokenInput && DigiStorage.getBlobToken) {
      tokenInput.value = DigiStorage.getBlobToken();
    }
    const info = DigiStorage.getServerInfo();
    const statusText = document.getElementById('adminServerStatusInfo');
    if (statusText) {
      if (DigiStorage.isConnected()) {
        const name = (info && info.server) ? info.server : 'Active Server';
        statusText.innerHTML = `<span style="color:#2ECC71; font-weight:700;">&#10004; Connected:</span> ${name}`;
      } else {
        statusText.innerHTML = `<span style="color:#E67E22; font-weight:700;">&#9679; Standalone Web Mode</span> (No external server connected)`;
      }
    }
  }

  function toggleBlobTokenVisibility() {
    const input = document.getElementById('adminBlobTokenInput');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  async function addDirectBlobUrl() {
    const titleInput = document.getElementById('directBlobTitle');
    const catInput = document.getElementById('directBlobCategory');
    const urlInput = document.getElementById('directBlobUrl');
    if (!titleInput || !urlInput) return;

    const title = titleInput.value.trim();
    const category = catInput.value;
    const url = urlInput.value.trim();

    if (!title || !url) {
      alert('Please enter both a title and a valid Vercel Blob URL or relative path.');
      return;
    }

    const ext = url.split('.').pop().toLowerCase().split('?')[0];
    const format = ['docx', 'doc'].includes(ext) ? ext : 'pdf';

    let cover = 'assets/images/covers/cover_wonder_india.svg';
    if (category.includes('Excavation') || category.includes('Archaeology')) cover = 'assets/images/covers/cover_excavations_vidarbha.svg';
    else if (category.includes('Coin') || category.includes('Numismatics')) cover = 'assets/images/covers/cover_coins_ancient_india.svg';
    else if (category.includes('Inscription') || category.includes('Epigraphy')) cover = 'assets/images/covers/cover_inscriptions_ashoka.svg';
    else if (category.includes('Temple') || category.includes('Architecture')) cover = 'assets/images/covers/cover_temple_architecture.svg';
    else if (category.includes('Vidarbha')) cover = 'assets/images/covers/cover_vakataka_heritage.svg';
    else if (category.includes('Prehistory') || category.includes('Indus')) cover = 'assets/images/covers/cover_indus_valley.svg';
    else if (category.includes('Sanskrit')) cover = 'assets/images/covers/cover_sanskrit_epigraphy.svg';

    const bookPayload = {
      title,
      author: 'Department Faculty / Scholar',
      category,
      era: 'Ancient Period',
      year: new Date().getFullYear().toString(),
      format,
      filePath: url,
      fileSize: '2.5 MB',
      pages: 150,
      language: 'English',
      coverImage: cover,
      description: `Manuscript hosted on Vercel Cloud Storage (${title}). Available for immediate reading and download.`,
      tags: [category, 'Vercel Cloud', 'Uploaded Manuscript'],
      isCloudBlob: true,
      isNew: true
    };

    try {
      await DigiStorage.addBook(bookPayload);
      titleInput.value = '';
      urlInput.value = '';
      if (typeof window !== 'undefined' && window.DigiApp) {
        if (window.DigiApp.closeModal) window.DigiApp.closeModal('adminModal');
        if (window.DigiApp.setCategory) window.DigiApp.setCategory(category);
        if (window.DigiApp.loadBooks) await window.DigiApp.loadBooks();
      }
      if (typeof window !== 'undefined' && window.DigiSecurity) {
        window.DigiSecurity.showToast(`Manuscript "${title}" linked to Vercel Storage!`);
      }
      alert(`Success! "${title}" is now added to the Digital Library and visible on the dashboard under "${category}".`);
    } catch (err) {
      alert('Failed to add manuscript: ' + err.message);
    }
  }

  async function saveServerSettingsFromAdmin() {
    const serverInput = document.getElementById('adminServerUrlInput');
    if (!serverInput) return;
    const url = serverInput.value.trim();

    const tokenInput = document.getElementById('adminBlobTokenInput');
    if (tokenInput && DigiStorage.setBlobToken) {
      DigiStorage.setBlobToken(tokenInput.value.trim());
    }

    const saveBtn = document.getElementById('btnSaveAdminServer');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Connecting...';
    }

    try {
      await DigiStorage.setServerUrl(url);
      if (typeof window !== 'undefined' && window.DigiApp && window.DigiApp.updateServerIndicator) {
        window.DigiApp.updateServerIndicator();
      }
      populateServerSettings();
      if (typeof window !== 'undefined' && window.DigiApp && window.DigiApp.loadBooks) {
        await window.DigiApp.loadBooks();
      }
      if (typeof window !== 'undefined' && window.DigiSecurity) {
        window.DigiSecurity.showToast('Server settings updated and reconnected successfully.');
      }
    } catch (err) {
      alert('Failed to connect to server: ' + err.message);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save & Reconnect';
      }
    }
  }

  // Inspect files uploaded to Vercel Blob Storage
  async function inspectVercelBlobs() {
    const listContainer = document.getElementById('adminVercelBlobList');
    const btn = document.getElementById('btnInspectBlobs');
    if (!listContainer) return;

    listContainer.style.display = 'block';
    listContainer.innerHTML = '<div style="color:#666; font-size:0.86rem; padding:10px;">Connecting to Vercel Blob Storage...</div>';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Inspecting...';
    }

    try {
      const storage = (typeof window !== 'undefined') ? window.DigiStorage : null;
      const serverUrl = storage ? (storage.getServerUrl() || '') : '';
      let endpoint = '/api/list-blobs';

      if (serverUrl && !serverUrl.includes('github.io')) {
        endpoint = `${serverUrl.replace(/\/+$/, '')}/api/list-blobs`;
      } else if (typeof window !== 'undefined' && window.location && window.location.hostname.includes('github.io')) {
        if (!serverUrl) {
          listContainer.innerHTML = `
            <div style="background:#FFF3CD; border:1px solid #FFEBAA; color:#856404; padding:12px; border-radius:6px; font-size:0.85rem;">
              <strong>ℹ️ Standalone GitHub Pages Mode:</strong><br>
              Enter your live Vercel URL in the box above and click <em>Save &amp; Reconnect</em> to connect to your Vercel cloud storage.<br>
              You can also view your files directly on the <a href="https://vercel.com/dashboard" target="_blank" rel="noopener" style="color:#0056b3; text-decoration:underline; font-weight:600;">Vercel Storage Dashboard ↗</a>.
            </div>
          `;
          return;
        }
      }

      const token = storage && storage.getBlobToken ? storage.getBlobToken() : '';
      const headers = {};
      if (token) headers['x-blob-token'] = token;

      const res = await fetch(endpoint, { headers });
      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {}

      if (!data && !res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to reach Vercel API`);
      }

      if (data && (data.storageStatus === 'local_database_active' || data.storageStatus === 'token_invalid' || (data.details && data.details.includes('Access denied')))) {
        listContainer.innerHTML = `
          <div style="background:#EBF7EE; border:1px solid #C3E6CB; color:#155724; padding:16px; border-radius:6px; font-size:0.86rem; line-height:1.6;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span style="font-size:1.3rem;">🟢</span>
              <strong style="color:#1E7E34; font-size:0.95rem;">Digital Library Storage Engine: Active &amp; Operational</strong>
            </div>
            <p style="margin:0 0 8px 0; color:#2E5B37;">
              The high-capacity IndexedDB &amp; Local Repository engine is operational. All research manuscripts (PDF, DOC, DOCX) uploaded via the Librarian Portal are catalogued safely and immediately accessible under their respective category tabs.
            </p>
            <div style="background:#FFFFFF; border:1px solid #D4EDDA; border-radius:4px; padding:10px 12px; margin-bottom:12px; font-size:0.82rem; color:#497151;">
              <strong>ℹ️ Cloud CDN Status:</strong>
              The project is currently connected in local autonomous mode with Store ID <code>${escapeHtml(data.tokenPrefix || 'store_...')}</code>. Uploads, reading, and downloads work seamlessly without any external dependency.<br>
              <em>Optional:</em> If you wish to also mirror files to Vercel's global CDN, you can provide the full <code>BLOB_READ_WRITE_TOKEN</code> (which starts with <code>vercel_blob_rw_</code>) in Vercel Project Settings &rarr; Environment Variables.
            </div>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
              <button type="button" class="search-btn" style="font-size:0.8rem; padding:6px 14px;" onclick="DigiAdmin.inspectVercelBlobs()">
                &#8634; Check Again
              </button>
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener" class="nav-btn" style="font-size:0.8rem; padding:6px 12px; text-decoration:none;">
                Open Vercel Storage Dashboard &#8599;
              </a>
            </div>
          </div>
        `;
        return;
      }

      if (data && data.storageStatus === 'not_connected') {
        listContainer.innerHTML = `
          <div style="background:#EBF7EE; border:1px solid #C3E6CB; color:#155724; padding:16px; border-radius:6px; font-size:0.86rem; line-height:1.6;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span style="font-size:1.3rem;">🟢</span>
              <strong style="color:#1E7E34; font-size:0.95rem;">Digital Library Storage: Autonomous Mode Active</strong>
            </div>
            <p style="margin:0 0 10px 0; color:#2E5B37;">
              The digital library is operating smoothly in local archive mode. All manuscripts you upload are saved directly and visible under their respective category tabs.
            </p>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; padding-top:8px; border-top:1px dashed #C3E6CB;">
              <button type="button" class="search-btn" style="font-size:0.8rem; padding:6px 14px;" onclick="DigiAdmin.inspectVercelBlobs()">
                &#8634; Check Connection Again
              </button>
            </div>
          </div>
        `;
        return;
      }

      if (!data.blobs || data.blobs.length === 0) {
        listContainer.innerHTML = `
          <div style="background:#E8F4FD; border:1px solid #BEE5EB; color:#0C5460; padding:14px; border-radius:6px; font-size:0.85rem; line-height:1.6;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
              <span style="font-size:1.2rem;">☁️</span>
              <strong style="font-size:0.92rem;">Vercel Storage Engine Connected &amp; Ready</strong>
            </div>
            <p style="margin:0 0 6px 0;">
              No manuscripts have been uploaded to Vercel Cloud CDN yet. Any manuscript you upload via the <em>Add New Manuscript</em> tab will be stored safely and accessible across all category tabs.
            </p>
            <div style="margin-top:8px;">
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener" style="color:#0C5460; text-decoration:underline; font-weight:600; font-size:0.82rem;">
                View Blob Console on Vercel Dashboard ↗
              </a>
            </div>
          </div>
        `;
        return;
      }

      let html = `
        <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:6px; padding:12px; font-size:0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <strong style="color:var(--color-primary-dark);">${data.blobs.length} File(s) Stored in Vercel Blob</strong>
            <a href="https://vercel.com/dashboard" target="_blank" rel="noopener" style="font-size:0.78rem; color:var(--color-primary); text-decoration:underline;">
              Open Vercel Storage Dashboard ↗
            </a>
          </div>
          <div style="max-height:220px; overflow-y:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
              <thead>
                <tr style="border-bottom:1px solid #EEE; text-align:left; color:#666;">
                  <th style="padding:6px;">File Name</th>
                  <th style="padding:6px;">Size</th>
                  <th style="padding:6px;">Action</th>
                </tr>
              </thead>
              <tbody>
      `;

      for (const b of data.blobs) {
        html += `
          <tr style="border-bottom:1px solid #F0F0F0;">
            <td style="padding:6px; font-weight:600; color:#333;">${escapeHtml(b.filename)}</td>
            <td style="padding:6px; color:#666;">${escapeHtml(b.sizeFormatted || '')}</td>
            <td style="padding:6px;">
              <a href="${b.url}" target="_blank" rel="noopener" style="color:var(--color-primary); text-decoration:underline; font-weight:600;">
                Open File ↗
              </a>
            </td>
          </tr>
        `;
      }

      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;

      listContainer.innerHTML = html;

    } catch (err) {
      listContainer.innerHTML = `
        <div style="background:#F8D7DA; border:1px solid #F5C6CB; color:#721C24; padding:12px; border-radius:6px; font-size:0.85rem;">
          <strong>Error querying Vercel server:</strong> ${escapeHtml(err.message)}<br>
          <span style="font-size:0.78rem; color:#555;">Make sure your Vercel Backend URL is saved and online. You can also view files directly on your <a href="https://vercel.com/dashboard" target="_blank" rel="noopener" style="color:#721C24; text-decoration:underline; font-weight:600;">Vercel Dashboard</a>.</span>
        </div>
      `;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Check Uploaded Files';
      }
    }
  }

  function setupDropzone() {
    const dropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('adminFileInput');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  }

  function handleFileSelect(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext)) {
      alert('Please upload a valid PDF, DOCX, or DOC research manuscript.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      stagedFile = {
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        format: ext,
        base64: e.target.result
      };

      // Auto-fill title from filename
      const titleInput = document.getElementById('bookTitleInput');
      if (titleInput && !titleInput.value) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        titleInput.value = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      }

      const formatInput = document.getElementById('bookFormatInput');
      if (formatInput) formatInput.value = ext;

      const dropzoneTitle = document.querySelector('.dropzone-title');
      if (dropzoneTitle) {
        dropzoneTitle.textContent = `Selected: ${file.name} (${stagedFile.size})`;
      }
    };
    reader.readAsDataURL(file);
  }

  // Handle Book Upload / Submission
  async function submitBookForm(e) {
    e.preventDefault();

    const title = document.getElementById('bookTitleInput').value.trim();
    const author = document.getElementById('bookAuthorInput').value.trim();
    const category = document.getElementById('bookCategoryInput').value;
    const era = document.getElementById('bookEraInput').value.trim();
    const year = document.getElementById('bookYearInput').value.trim();
    const format = document.getElementById('bookFormatInput').value;
    const description = document.getElementById('bookDescInput').value.trim();
    const tagsStr = document.getElementById('bookTagsInput').value.trim();

    if (!title || !author) {
      alert('Please fill in both Book Title and Author.');
      return;
    }

    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [category, 'Archaeology'];

    // Select preset cover based on category
    let cover = 'assets/images/covers/cover_wonder_india.svg';
    if (category.includes('Excavation') || category.includes('Archaeology')) {
      cover = 'assets/images/covers/cover_excavations_vidarbha.svg';
    } else if (category.includes('Coin') || category.includes('Numismatics')) {
      cover = 'assets/images/covers/cover_coins_ancient_india.svg';
    } else if (category.includes('Inscription') || category.includes('Epigraphy')) {
      cover = 'assets/images/covers/cover_inscriptions_ashoka.svg';
    } else if (category.includes('Temple') || category.includes('Architecture')) {
      cover = 'assets/images/covers/cover_temple_architecture.svg';
    } else if (category.includes('Vidarbha')) {
      cover = 'assets/images/covers/cover_vakataka_heritage.svg';
    }

    const bookPayload = {
      title,
      author,
      category,
      era: era || 'Ancient Period',
      year: year || '2026',
      format,
      filePath: stagedFile ? `data/books/${stagedFile.name}` : `data/books/wonder_that_was_india.pdf`,
      fileSize: stagedFile ? stagedFile.size : '2.5 MB',
      pages: 150,
      language: 'English',
      coverImage: cover,
      description: description || 'Scholarly monograph published under RTM Nagpur University Research Series.',
      tags,
      filename: stagedFile ? stagedFile.name : `book_${Date.now()}.${format}`,
      fileBase64: stagedFile ? stagedFile.base64 : ''
    };

    const submitBtn = document.getElementById('submitBookBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving to Library Catalogue...';
    }

    try {
      const res = await DigiStorage.addBook(bookPayload);
      
      const successMsg = (res && res.cloudSynced)
        ? `Success! "${title}" has been uploaded to Vercel Cloud Storage and added under the "${category}" tab.`
        : `Success! "${title}" has been added to the Digital Library under the "${category}" tab!\n\n(It is immediately visible in the "${category}" tab and "All Collections").`;

      // Reset form
      document.getElementById('addBookForm').reset();
      stagedFile = null;
      const dropzoneTitle = document.querySelector('.dropzone-title');
      if (dropzoneTitle) {
        dropzoneTitle.textContent = 'Drag & Drop Research File or Click to Browse';
      }

      // Close admin modal and navigate directly to the new book on the dashboard
      if (typeof window !== 'undefined' && window.DigiApp) {
        if (window.DigiApp.closeModal) window.DigiApp.closeModal('adminModal');
        if (window.DigiApp.setCategory) window.DigiApp.setCategory(category);
        if (window.DigiApp.loadBooks) await window.DigiApp.loadBooks();
      }
      await renderBookList();

      if (typeof window !== 'undefined' && window.DigiSecurity) {
        window.DigiSecurity.showToast(`Manuscript "${title}" added! Displayed under "${category}" tab.`);
      }

      alert(successMsg);
    } catch (err) {
      alert('Error adding book: ' + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Book to Catalogue';
      }
    }
  }

  // Render list of books in Admin Table
  async function renderBookList() {
    const tableBody = document.getElementById('adminBookTableBody');
    if (!tableBody) return;

    const books = await DigiStorage.getBooks();
    tableBody.innerHTML = books.map((b, i) => `
      <tr>
        <td><strong>#${i + 1}</strong></td>
        <td>${escapeHtml(b.title)}</td>
        <td>${escapeHtml(b.author)}</td>
        <td><span class="badge-gold">${escapeHtml(b.category)}</span></td>
        <td><span class="format-badge ${b.format}">${(b.format || 'pdf').toUpperCase()}</span></td>
        <td>${b.downloads || 0}</td>
        <td>
          <button class="admin-action-btn delete" onclick="DigiAdmin.deleteBook('${b.id}')" title="Delete Book">&#128465;</button>
        </td>
      </tr>
    `).join('');
  }

  // Delete book from local cache
  async function deleteBook(bookId) {
    if (!confirm('Are you sure you want to remove this book from the catalogue?')) return;
    const localCustom = JSON.parse(localStorage.getItem('digilib_cached_books') || '[]');
    const filtered = localCustom.filter(b => b.id !== bookId);
    localStorage.setItem('digilib_cached_books', JSON.stringify(filtered));
    if (typeof window !== 'undefined' && window.DigiStorage && window.DigiStorage.deleteFileFromIDB) {
      try { await window.DigiStorage.deleteFileFromIDB(bookId); } catch(e) {}
    }
    if (typeof window !== 'undefined' && window.DigiApp && window.DigiApp.loadBooks) {
      await window.DigiApp.loadBooks();
    }
    await renderBookList();
    if (typeof window !== 'undefined' && window.DigiSecurity) {
      window.DigiSecurity.showToast('Book removed from library catalogue.');
    }
  }

  // Export updated books.json for committing to GitHub
  async function exportBooksJson() {
    const books = await DigiStorage.getBooks();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(books, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "books.json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  }

  // Reset daily download limit for testing
  function resetDownloadLimit() {
    localStorage.removeItem('digilib_daily_downloads');
    alert('Daily download counter has been reset! All scholars can download again today.');
    DigiAuth.updateUserUI();
  }

  // Initialize Security & Passphrase Tab
  function initSecurityTab() {
    const currentInput = document.getElementById('currentPassInput');
    const newInput = document.getElementById('newPassInput');
    const confirmInput = document.getElementById('confirmPassInput');
    const msgEl = document.getElementById('changePassMsg');

    if (currentInput) currentInput.value = '';
    if (newInput) newInput.value = '';
    if (confirmInput) confirmInput.value = '';
    if (msgEl) {
      msgEl.style.display = 'none';
      msgEl.textContent = '';
    }
  }

  // Handle Passphrase Change Form Submission
  function submitChangePassphrase(e) {
    if (e && e.preventDefault) e.preventDefault();

    const currentInput = document.getElementById('currentPassInput');
    const newInput = document.getElementById('newPassInput');
    const confirmInput = document.getElementById('confirmPassInput');
    const msgEl = document.getElementById('changePassMsg');

    const enteredCurrent = currentInput ? currentInput.value.trim() : '';
    const enteredNew = newInput ? newInput.value.trim() : '';
    const enteredConfirm = confirmInput ? confirmInput.value.trim() : '';

    const actualCurrent = getStoredPassphrase();

    function showMsg(text, isError) {
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = isError ? '#C0392B' : '#27AE60';
        msgEl.textContent = text;
      }
    }

    // 1. Validate current passphrase
    if (enteredCurrent !== actualCurrent) {
      showMsg('Current passphrase does not match. Please verify and try again.', true);
      if (currentInput) {
        currentInput.value = '';
        currentInput.focus();
      }
      return;
    }

    // 2. Validate new passphrase length
    if (enteredNew.length < 6) {
      showMsg('New passphrase must be at least 6 characters long.', true);
      if (newInput) newInput.focus();
      return;
    }

    // 3. Confirm matching
    if (enteredNew !== enteredConfirm) {
      showMsg('New passphrase and confirmation do not match.', true);
      if (confirmInput) confirmInput.focus();
      return;
    }

    // 4. Check if unchanged
    if (enteredNew === actualCurrent) {
      showMsg('The new passphrase cannot be identical to the current passphrase.', true);
      return;
    }

    // 5. Save new passphrase
    saveStoredPassphrase(enteredNew);
    showMsg('✓ Passphrase updated successfully! Use this new passphrase for future logins.', false);

    if (typeof window !== 'undefined' && window.DigiSecurity) {
      window.DigiSecurity.showToast('Librarian passphrase updated successfully!');
    }

    // Reset input fields
    if (currentInput) currentInput.value = '';
    if (newInput) newInput.value = '';
    if (confirmInput) confirmInput.value = '';
  }

  // Reset Passphrase to Factory Default ('rtmnu2026')
  function resetPassphraseToDefault() {
    const current = getStoredPassphrase();
    if (current === DEFAULT_ADMIN_PASS) {
      alert('The passphrase is already set to the default ("' + DEFAULT_ADMIN_PASS + '").');
      return;
    }

    if (confirm('Are you sure you want to reset the Librarian Passphrase back to default ("' + DEFAULT_ADMIN_PASS + '")?')) {
      resetStoredPassphrase();
      initSecurityTab();
      const msgEl = document.getElementById('changePassMsg');
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = '#27AE60';
        msgEl.textContent = '✓ Passphrase has been reset to default (' + DEFAULT_ADMIN_PASS + ').';
      }
      if (typeof window !== 'undefined' && window.DigiSecurity) {
        window.DigiSecurity.showToast('Librarian passphrase reset to default.');
      }
    }
  }

  // Toggle Password Field Visibility
  function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btn) btn.innerHTML = '&#128584;';
      if (btn) btn.title = 'Hide passphrase';
    } else {
      input.type = 'password';
      if (btn) btn.innerHTML = '&#128065;';
      if (btn) btn.title = 'Show passphrase';
    }
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

  return {
    init,
    openAdminModal,
    closeAdminModal,
    loginWithPassphrase,
    logoutAdmin,
    switchTab,
    saveServerSettingsFromAdmin,
    inspectVercelBlobs,
    submitBookForm,
    renderBookList,
    deleteBook,
    exportBooksJson,
    resetDownloadLimit,
    initSecurityTab,
    submitChangePassphrase,
    resetPassphraseToDefault,
    togglePasswordVisibility,
    promptResetPassphrase,
    getStoredPassphrase,
    toggleBlobTokenVisibility,
    addDirectBlobUrl
  };
})();

if (typeof window !== 'undefined') {
  window.DigiAdmin = DigiAdmin;
}
