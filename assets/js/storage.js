/**
 * DigiLib - Storage & Backend Sync Engine
 * Department of Ancient Indian History, Culture & Archaeology, RTMNU
 * Concept & Design by K.S.Chandra, 2026, kavikondalaschandra@gmail.com
 */

var DigiStorage = (function() {
  const SERVER_URL_KEY = 'digilib_server_url';
  const DEFAULT_LOCAL_SERVER = 'http://localhost:8080';
  const BOOKS_CACHE_KEY = 'digilib_cached_books';
  const DOWNLOADS_KEY = 'digilib_daily_downloads';
  const IDB_NAME = 'DigiLibDatabase';
  const IDB_VERSION = 1;
  const IDB_STORE = 'manuscripts';

  // IndexedDB Storage for local manuscript files (supports files up to 500 MB)
  function openIDB() {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return resolve(null);
      }
      try {
        const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch(e) {
        resolve(null);
      }
    });
  }

  async function saveFileToIDB(bookId, fileData) {
    try {
      const db = await openIDB();
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.put({ id: bookId, fileData: fileData });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch(e) {
      return false;
    }
  }

  async function getFileFromIDB(bookId) {
    try {
      const db = await openIDB();
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(bookId);
        req.onsuccess = () => resolve(req.result ? req.result.fileData : null);
        req.onerror = () => resolve(null);
      });
    } catch(e) {
      return null;
    }
  }

  async function deleteFileFromIDB(bookId) {
    try {
      const db = await openIDB();
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.delete(bookId);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch(e) {
      return false;
    }
  }

  // Smart server detection based on hosting environment
  function getInitialServerUrl() {
    if (typeof window === 'undefined' || !window.location) return DEFAULT_LOCAL_SERVER;
    const stored = (typeof localStorage !== 'undefined') ? localStorage.getItem(SERVER_URL_KEY) : null;
    if (stored && !stored.includes('github.io')) return stored;

    const host = (window.location && window.location.hostname) || '';
    if (host.includes('vercel.app')) {
      return window.location.origin;
    }
    if (host.includes('github.io')) {
      // Connect to live Vercel API backend for cloud storage and OTP
      return stored || 'https://history-archaeology-digilib.vercel.app';
    }
    if (host === 'localhost' || host === '127.0.0.1') {
      return DEFAULT_LOCAL_SERVER;
    }
    return (window.location && window.location.origin) || DEFAULT_LOCAL_SERVER;
  }

  let currentServerUrl = getInitialServerUrl();
  let isServerConnected = false;
  let serverInfo = null;

  // Initialize and check server connectivity
  async function init() {
    if (!currentServerUrl || currentServerUrl.includes('github.io')) {
      isServerConnected = false;
      serverInfo = null;
      console.log('[DigiLib] Running in Standalone Web Mode (GitHub Pages)');
      return false;
    }

    try {
      const resp = await fetch(`${currentServerUrl}/api/status`, { method: 'GET', cache: 'no-store' });
      if (resp.ok) {
        isServerConnected = true;
        try { serverInfo = await resp.json(); } catch(e) { serverInfo = { server: 'Active Server' }; }
        console.log('[DigiLib] Connected to backend at:', currentServerUrl, serverInfo);
        return true;
      }
    } catch (e) {}

    isServerConnected = false;
    serverInfo = null;
    console.log('[DigiLib] Running in Standalone Web Mode');
    return false;
  }

  const BLOB_TOKEN_KEY = 'digilib_blob_token';
  const DUMMY_BOOK_IDS = new Set([
    'book-001', 'book-002', 'book-003', 'book-004', 'book-005',
    'book-006', 'book-007', 'book-008', 'book-010', 'book-1794379266027'
  ]);
  const DUMMY_TITLE_SUBSTRINGS = [
    'wonder that was india',
    'archaeological excavations and megalithic culture of vidarbha',
    'coins of ancient india',
    'corpus inscriptionum',
    'indian temple architecture',
    'harappa and mohenjo-daro',
    'heritage of vidarbha and the vakatakas',
    'indian epigraphy and paleography',
    'descriptive catalogue of sanskrit manuscripts',
    'excavation of buddhist stupas at mansar'
  ];

  function isDummyBook(book) {
    if (!book) return false;
    if (book.id && DUMMY_BOOK_IDS.has(book.id)) return true;
    const titleLower = (book.title || '').toLowerCase();
    for (const sub of DUMMY_TITLE_SUBSTRINGS) {
      if (titleLower.includes(sub)) return true;
    }
    return false;
  }

  function getBlobToken() {
    try {
      return localStorage.getItem(BLOB_TOKEN_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function setBlobToken(token) {
    try {
      if (token && typeof token === 'string' && token.trim()) {
        localStorage.setItem(BLOB_TOKEN_KEY, token.trim());
      } else {
        localStorage.removeItem(BLOB_TOKEN_KEY);
      }
    } catch (e) {}
  }

  // Fallback catalogue: clean empty array (dummy archival research manuscripts removed)
  function getDefaultCatalogue() {
    return [];
  }

  // Get Books Catalogue (combines remote / local / initial JSON)
  async function getBooks() {
    let books = [];
    
    // 1. Try fetching from active server /api/books or relative data/books.json
    try {
      let fetchUrl = 'data/books.json';
      if (isServerConnected && currentServerUrl && !currentServerUrl.includes('github.io')) {
        fetchUrl = `${currentServerUrl}/api/books`;
      } else if (!currentServerUrl.includes('github.io') && window.location.hostname.includes('vercel.app')) {
        fetchUrl = '/api/books';
      }
      
      let resp = await fetch(fetchUrl, { cache: 'no-store' });
      if (!resp.ok) {
        resp = await fetch('data/books.json', { cache: 'no-store' });
      }
      if (resp.ok) {
        books = await resp.json();
      }
    } catch (e) {
      console.warn('[DigiLib] Primary fetch failed, attempting relative fetch...', e);
      try {
        const resp = await fetch('data/books.json');
        if (resp.ok) books = await resp.json();
      } catch (err) {}
    }

    // Fallback: If network failed, use embedded default books
    if (!books || !Array.isArray(books) || books.length === 0) {
      books = getDefaultCatalogue();
    }

    // 2. Query Vercel Blob Cloud Storage for any uploaded cloud manuscripts
    try {
      let blobEndpoint = '/api/list-blobs';
      if (currentServerUrl && !currentServerUrl.includes('github.io')) {
        blobEndpoint = `${currentServerUrl.replace(/\/+$/, '')}/api/list-blobs`;
      }
      const token = getBlobToken();
      const headers = {};
      if (token) {
        headers['x-blob-token'] = token;
      }
      const blobResp = await fetch(blobEndpoint, { headers, cache: 'no-store' });
      if (blobResp.ok) {
        const blobData = await blobResp.json();
        if (blobData && Array.isArray(blobData.blobs) && blobData.blobs.length > 0) {
          const existingPaths = new Set(books.map(b => (b.filePath || '').toLowerCase()));
          const existingTitles = new Set(books.map(b => (b.title || '').toLowerCase()));

          for (const b of blobData.blobs) {
            const rawFilename = b.filename || (b.pathname ? b.pathname.replace(/^books\//, '') : 'manuscript.pdf');
            const cleanTitle = rawFilename
              .replace(/\.[^/.]+$/, '')
              .replace(/[-_]+/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());

            if (!existingPaths.has((b.url || '').toLowerCase()) && !existingTitles.has(cleanTitle.toLowerCase())) {
              const ext = rawFilename.split('.').pop().toLowerCase();
              let inferredCat = 'Archaeology & Excavations';
              const lowerName = rawFilename.toLowerCase();
              if (lowerName.includes('coin') || lowerName.includes('numismatic')) inferredCat = 'Numismatics & Ancient Coins';
              else if (lowerName.includes('inscript') || lowerName.includes('epigraph') || lowerName.includes('brahmi')) inferredCat = 'Epigraphy & Inscriptions';
              else if (lowerName.includes('temple') || lowerName.includes('architect') || lowerName.includes('sculpture')) inferredCat = 'Temple Architecture & Iconography';
              else if (lowerName.includes('harappa') || lowerName.includes('indus') || lowerName.includes('prehistory')) inferredCat = 'Prehistory & Indus Valley';
              else if (lowerName.includes('vidarbha') || lowerName.includes('vakataka') || lowerName.includes('mansar') || lowerName.includes('nagpur')) inferredCat = 'Heritage of Vidarbha & Central India';
              else if (lowerName.includes('sanskrit') || lowerName.includes('vedic') || lowerName.includes('manuscript')) inferredCat = 'Sanskrit & Manuscripts';
              else if (lowerName.includes('history')) inferredCat = 'Ancient Indian History';

              let cover = 'assets/images/covers/cover_wonder_india.svg';
              if (inferredCat.includes('Excavation') || inferredCat.includes('Archaeology')) cover = 'assets/images/covers/cover_excavations_vidarbha.svg';
              else if (inferredCat.includes('Coin') || inferredCat.includes('Numismatics')) cover = 'assets/images/covers/cover_coins_ancient_india.svg';
              else if (inferredCat.includes('Inscription') || inferredCat.includes('Epigraphy')) cover = 'assets/images/covers/cover_inscriptions_ashoka.svg';
              else if (inferredCat.includes('Temple') || inferredCat.includes('Architecture')) cover = 'assets/images/covers/cover_temple_architecture.svg';
              else if (inferredCat.includes('Vidarbha')) cover = 'assets/images/covers/cover_vakataka_heritage.svg';
              else if (inferredCat.includes('Prehistory') || inferredCat.includes('Indus')) cover = 'assets/images/covers/cover_indus_valley.svg';
              else if (inferredCat.includes('Sanskrit')) cover = 'assets/images/covers/cover_sanskrit_epigraphy.svg';

              books.unshift({
                id: 'cloud-' + rawFilename.replace(/[^a-zA-Z0-9_-]/g, '_'),
                title: cleanTitle,
                author: 'Department Scholar / Contributor',
                category: inferredCat,
                era: 'Ancient Period',
                year: new Date(b.uploadedAt || Date.now()).getFullYear().toString(),
                format: ['pdf', 'docx', 'doc'].includes(ext) ? ext : 'pdf',
                filePath: b.url,
                fileSize: b.sizeFormatted || '2.0 MB',
                pages: 120,
                language: 'English',
                coverImage: cover,
                description: `Digital research manuscript stored on Vercel Cloud Storage (${rawFilename}). Available for unrestricted reading and academic download.`,
                tags: [inferredCat, 'Vercel Cloud', 'Uploaded Manuscript'],
                downloads: 0,
                reads: 18,
                featured: true,
                isCloudBlob: true,
                isNew: true
              });
            }
          }
        }
      }
    } catch (blobErr) {
      console.warn('[DigiLib] Cloud blob sync skipped:', blobErr);
    }

    // 3. Purge any dummy books and merge with custom uploaded books
    try {
      let localCustom = JSON.parse(localStorage.getItem(BOOKS_CACHE_KEY) || '[]');
      if (Array.isArray(localCustom)) {
        // Strip out any dummy sample books
        localCustom = localCustom.filter(b => !isDummyBook(b));
        localStorage.setItem(BOOKS_CACHE_KEY, JSON.stringify(localCustom));

        const existingIds = new Set(books.map(b => b.id));
        for (const cb of localCustom) {
          if (!existingIds.has(cb.id) && !isDummyBook(cb)) {
            books.unshift(cb);
          }
        }
      }
    } catch (e) {}

    // Final filter to ensure no dummy sample books slip through
    return books.filter(b => !isDummyBook(b));
  }

  // Add a newly uploaded book
  async function addBook(bookData) {
    const bookId = bookData.id || ('book-' + Date.now());
    let cloudUrl = null;
    let cloudSuccess = false;

    // Save heavy file data into IndexedDB so localStorage never runs out of space
    if (bookData.fileBase64) {
      await saveFileToIDB(bookId, bookData.fileBase64);
    }

    // 1. Try uploading to backend / Vercel Blob if available
    try {
      const serverUrl = currentServerUrl || '';
      let targetEndpoint = '/api/upload-blob';
      if (serverUrl && !serverUrl.includes('github.io')) {
        targetEndpoint = `${serverUrl.replace(/\/+$/, '')}/api/upload-blob`;
      }

      const token = getBlobToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['x-blob-token'] = token;

      const resp = await fetch(targetEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ ...bookData, token: token || undefined })
      });

      if (resp.ok) {
        const resData = await resp.json();
        if (resData.success && (resData.url || (resData.bookMetadata && resData.bookMetadata.filePath))) {
          cloudUrl = resData.url || resData.bookMetadata.filePath;
          cloudSuccess = true;
          console.log('[DigiLib] Book saved to Vercel Blob Storage:', cloudUrl);
        } else if (resData.storageStatus === 'not_connected') {
          console.warn('[DigiLib] Vercel Blob not connected yet. Storing locally.');
        }
      }
    } catch (e) {
      console.warn('[DigiLib] Cloud storage upload skipped/offline. Storing in library archive:', e);
    }

    // 2. Prepare lightweight metadata (without massive base64) for localStorage
    const newBook = {
      ...bookData,
      id: bookId,
      filePath: cloudUrl || `data/books/${bookData.filename || 'manuscript.pdf'}`,
      fileBase64: '', // Omit from localStorage to prevent QuotaExceededError
      hasLocalBlob: !cloudUrl,
      downloads: 0,
      reads: 0,
      featured: false,
      cloudSynced: cloudSuccess,
      isNew: true
    };

    // 3. Inform backend /api/books so in-memory dynamic catalogue keeps it
    try {
      const serverUrl = currentServerUrl || '';
      let booksEndpoint = '/api/books';
      if (serverUrl && !serverUrl.includes('github.io')) {
        booksEndpoint = `${serverUrl.replace(/\/+$/, '')}/api/books`;
      }
      await fetch(booksEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook)
      });
    } catch (e) {}

    // 4. Store in localStorage catalogue
    try {
      let localCustom = JSON.parse(localStorage.getItem(BOOKS_CACHE_KEY) || '[]');
      if (!Array.isArray(localCustom)) localCustom = [];
      localCustom = localCustom.filter(b => b.id !== bookId && b.title !== newBook.title && !isDummyBook(b));
      localCustom.unshift(newBook);
      localStorage.setItem(BOOKS_CACHE_KEY, JSON.stringify(localCustom));
    } catch (e) {
      console.error('[DigiLib] LocalStorage write error:', e);
    }

    return {
      success: true,
      book: newBook,
      cloudSynced: cloudSuccess
    };
  }

  // Download Quota Enforcement: Check if user is eligible for today's 1 download
  function canDownloadToday(email) {
    if (!email) return false;
    const today = new Date().toISOString().slice(0, 10);
    const key = `${email.toLowerCase().trim()}_${today}`;
    const downloads = JSON.parse(localStorage.getItem(DOWNLOADS_KEY) || '{}');
    return !(downloads[key] && downloads[key] >= 1);
  }

  // Record a completed download for today
  function recordDownload(email, bookId) {
    if (!email) return;
    const today = new Date().toISOString().slice(0, 10);
    const key = `${email.toLowerCase().trim()}_${today}`;
    const downloads = JSON.parse(localStorage.getItem(DOWNLOADS_KEY) || '{}');
    downloads[key] = (downloads[key] || 0) + 1;
    downloads[`${key}_lastBook`] = bookId;
    downloads[`${key}_timestamp`] = new Date().toISOString();
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
  }

  // Get remaining downloads count for today (0 or 1)
  function getRemainingDownloads(email) {
    if (!email) return 0;
    return canDownloadToday(email) ? 1 : 0;
  }

  // Server URL Configuration
  async function setServerUrl(url) {
    currentServerUrl = (url || '').trim().replace(/\/+$/, '');
    if (currentServerUrl && !currentServerUrl.includes('github.io')) {
      localStorage.setItem(SERVER_URL_KEY, currentServerUrl);
    } else {
      currentServerUrl = '';
      localStorage.removeItem(SERVER_URL_KEY);
    }
    return await init();
  }

  function getServerUrl() {
    return currentServerUrl;
  }

  function isConnected() {
    return isServerConnected;
  }

  function getServerInfo() {
    return serverInfo;
  }

  return {
    init,
    getBooks,
    addBook,
    canDownloadToday,
    recordDownload,
    getRemainingDownloads,
    setServerUrl,
    getServerUrl,
    isConnected,
    getServerInfo,
    saveFileToIDB,
    getFileFromIDB,
    deleteFileFromIDB,
    getBlobToken,
    setBlobToken,
    isDummyBook
  };
})();

if (typeof window !== 'undefined') {
  window.DigiStorage = DigiStorage;
}
