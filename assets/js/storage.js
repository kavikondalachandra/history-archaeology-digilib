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

  // Fallback catalogue if network or static fetch encounters issues
  function getDefaultCatalogue() {
    return [
      {
        id: "book-001",
        title: "The Wonder That Was India: A Survey of the Culture and Heritage",
        author: "Prof. A. L. Basham",
        category: "Ancient Indian History",
        era: "Prehistory to Early Islamic Contact",
        year: "1954 / 2026 Archive",
        format: "pdf",
        filePath: "data/books/wonder_that_was_india.pdf",
        fileSize: "2.4 MB",
        pages: 568,
        language: "English",
        coverImage: "assets/images/covers/cover_wonder_india.svg",
        description: "A landmark scholarly treatise offering a comprehensive survey of the history, society, religion, philosophy, art, and literature of ancient India before the coming of the Muslims. Essential reading for students of Ancient Indian History, Culture & Archaeology.",
        tags: ["Indus Valley", "Vedic Society", "Mauryan Dynasty", "Guptas", "Philosophy"],
        downloads: 142,
        reads: 1280,
        featured: true
      },
      {
        id: "book-002",
        title: "Archaeological Excavations and Megalithic Culture of Vidarbha",
        author: "Department of Ancient Indian History, Culture & Archaeology",
        category: "Archaeology & Excavations",
        era: "Iron Age & Protohistory (1000 BCE - 300 CE)",
        year: "2024",
        format: "docx",
        filePath: "data/books/archaeological_excavations_vidarbha.docx",
        fileSize: "1.1 MB",
        pages: 312,
        language: "English",
        coverImage: "assets/images/covers/cover_excavations_vidarbha.svg",
        description: "Comprehensive archaeological excavation monograph detailing the cairn stone circles, iron-smelting kilns of Naikund, burial assemblages of Mahurjhari, and stratified sequences in Vidarbha under the research aegis of Rashtrasant Tukadoji Maharaj Nagpur University.",
        tags: ["Naikund", "Mahurjhari", "Megaliths", "Iron Smelting", "Vidarbha", "Excavations"],
        downloads: 98,
        reads: 945,
        featured: true
      },
      {
        id: "book-003",
        title: "Coins of Ancient India: From the Earliest Times to the 7th Century CE",
        author: "Sir Alexander Cunningham",
        category: "Numismatics & Ancient Coins",
        era: "6th C. BCE to 7th C. CE",
        year: "1891 / Digital Facsimile",
        format: "pdf",
        filePath: "data/books/coins_of_ancient_india.pdf",
        fileSize: "3.8 MB",
        pages: 184,
        language: "English",
        coverImage: "assets/images/covers/cover_coins_ancient_india.svg",
        description: "Foundational classic in Indian numismatics covering punch-marked silver and copper punch-marked issues, cast and tribal coinages of Ujjain, Eran, Taxila, and the imperial gold dinars of the Kushanas and Guptas.",
        tags: ["Numismatics", "Punch-Marked Coins", "Satavahana", "Gupta Dinars", "Kushana"],
        downloads: 76,
        reads: 630,
        featured: true
      },
      {
        id: "book-004",
        title: "Corpus Inscriptionum: Major Rock and Pillar Edicts of Emperor Ashoka",
        author: "Epigraphical Research Division, RTMNU",
        category: "Epigraphy & Inscriptions",
        era: "Mauryan Empire (272-232 BCE)",
        year: "2023",
        format: "doc",
        filePath: "data/books/inscriptions_of_ashoka.doc",
        fileSize: "850 KB",
        pages: 142,
        language: "English & Prakrit (Brahmi)",
        coverImage: "assets/images/covers/cover_inscriptions_ashoka.svg",
        description: "Critically edited readings, translations, and paleographical analyses of the 14 Major Rock Edicts, 7 Pillar Inscriptions, and Minor Rock Edicts of Devanampriya Priyadarsi Ashoka Maurya.",
        tags: ["Ashoka", "Brahmi Script", "Prakrit", "Epigraphy", "Dhamma"],
        downloads: 115,
        reads: 890,
        featured: false
      },
      {
        id: "book-005",
        title: "Indian Temple Architecture and Iconography: Evolution of Forms",
        author: "Dr. V. S. Agrawala",
        category: "Temple Architecture & Iconography",
        era: "Gupta to Late Medieval (4th - 13th C. CE)",
        year: "1965 / Digital Edition",
        format: "pdf",
        filePath: "data/books/wonder_that_was_india.pdf",
        fileSize: "4.2 MB",
        pages: 420,
        language: "English",
        coverImage: "assets/images/covers/cover_temple_architecture.svg",
        description: "An authoritative exposition tracing the structural development of Indian shrines from flat-roofed Gupta prototypes to the soaring sikhara temples of Khajuraho, Bhubaneswar, and Dravida gopurams.",
        tags: ["Temple Architecture", "Nagara", "Dravida", "Vesara", "Sculpture", "Iconography"],
        downloads: 64,
        reads: 580,
        featured: false
      },
      {
        id: "book-006",
        title: "Harappa and Mohenjo-Daro: Official Reports of the Archaeological Survey of India",
        author: "Sir John Marshall & Archaeological Survey of India",
        category: "Prehistory & Indus Valley",
        era: "Mature Harappan (2600-1900 BCE)",
        year: "1931 / Facsimile Edition",
        format: "pdf",
        filePath: "data/books/wonder_that_was_india.pdf",
        fileSize: "5.6 MB",
        pages: 724,
        language: "English",
        coverImage: "assets/images/covers/cover_indus_valley.svg",
        description: "The seminal excavation report on the discovery of the Bronze Age Indus Valley Civilization, examining the Great Bath, granaries, drainage systems, steatite seals, and proto-historic urban settlements.",
        tags: ["Harappa", "Mohenjo-Daro", "Indus Valley", "Protohistory", "Seals"],
        downloads: 189,
        reads: 1420,
        featured: true
      },
      {
        id: "book-007",
        title: "Heritage of Vidarbha and the Vakatakas: Mansar, Ramtek & Ajanta Connections",
        author: "RTMNU Archaeological Research Cell",
        category: "Heritage of Vidarbha & Central India",
        era: "Vakataka Dynasty (3rd - 5th C. CE)",
        year: "2025",
        format: "docx",
        filePath: "data/books/archaeological_excavations_vidarbha.docx",
        fileSize: "1.8 MB",
        pages: 248,
        language: "English & Marathi",
        coverImage: "assets/images/covers/cover_vakataka_heritage.svg",
        description: "Explores the political, religious, and architectural legacy of the Vakatakas in Vidarbha, with special emphasis on the excavated palace complexes and temple terraces of Mansar (Pravarapura), Ramagiri (Ramtek), and caves of Ajanta.",
        tags: ["Vakataka", "Mansar", "Ramtek", "Vidarbha", "Nagpur Heritage"],
        downloads: 110,
        reads: 780,
        featured: true
      },
      {
        id: "book-008",
        title: "Indian Epigraphy and Paleography: Evolution of Scripts and Manuscripts",
        author: "Prof. D. C. Sircar",
        category: "Epigraphy & Inscriptions",
        era: "Antiquity to 12th C. CE",
        year: "1965",
        format: "pdf",
        filePath: "data/books/coins_of_ancient_india.pdf",
        fileSize: "3.1 MB",
        pages: 482,
        language: "English",
        coverImage: "assets/images/covers/cover_sanskrit_epigraphy.svg",
        description: "Comprehensive handbook covering decipherment of ancient Indian scripts, eras (Vikrama, Saka, Gupta), copper-plate charters, royal seals, and methodology of inscriptional recording.",
        tags: ["Epigraphy", "Paleography", "Brahmi", "Kharosthi", "D.C. Sircar"],
        downloads: 58,
        reads: 510,
        featured: false
      },
      {
        id: "book-010",
        title: "Descriptive Catalogue of Sanskrit Manuscripts & Palm-Leaf Texts",
        author: "Department of Sanskrit, Epigraphy & Ancient Manuscripts",
        category: "Sanskrit & Manuscripts",
        era: "Classical to Medieval Period",
        year: "2025 Archive Edition",
        format: "pdf",
        filePath: "data/books/wonder_that_was_india.pdf",
        fileSize: "3.4 MB",
        pages: 380,
        language: "Sanskrit & English",
        coverImage: "assets/images/covers/cover_sanskrit_epigraphy.svg",
        description: "Comprehensive descriptive catalogue and critical textual apparatus of rare birch-bark, palm-leaf, and paper manuscripts preserved across central Indian archives.",
        tags: ["Sanskrit", "Manuscripts", "Palm Leaf", "Brahmi", "Paleography", "Vedic Texts"],
        downloads: 82,
        reads: 720,
        featured: true
      },
      {
        id: "book-1794379266027",
        title: "Excavation of Buddhist Stupas at Mansar",
        author: "Prof. AIHC&A Research Team",
        category: "Archaeology & Excavations",
        era: "Vakataka Period (5th C. CE)",
        year: "2026",
        format: "docx",
        filePath: "data/books/mansar_stupas.docx",
        fileSize: "1.4 MB",
        pages: 100,
        language: "English",
        coverImage: "assets/images/covers/cover_excavations_vidarbha.svg",
        description: "Monograph detailing the discovery of brick stupas and Buddhist monastic structures at Mansar.",
        tags: ["New Addition", "Research Archive", "Archaeology & Excavations", "Mansar", "Vakataka"],
        downloads: 15,
        reads: 340,
        featured: true,
        isNew: true
      }
    ];
  }

  // Get Books Catalogue (combines remote / local / initial JSON)
  async function getBooks() {
    let books = [];
    
    // 1. Try fetching from active server or relative data/books.json
    try {
      let fetchUrl = 'data/books.json';
      if (isServerConnected && currentServerUrl && !currentServerUrl.includes('github.io')) {
        fetchUrl = `${currentServerUrl}/data/books.json`;
      }
      
      let resp = await fetch(fetchUrl, { cache: 'no-store' });
      if (!resp.ok && fetchUrl !== 'data/books.json') {
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
    if (!books || books.length === 0) {
      books = getDefaultCatalogue();
    }

    // 2. Query Vercel Blob Cloud Storage for any uploaded cloud manuscripts
    try {
      let blobEndpoint = '/api/list-blobs';
      if (currentServerUrl && !currentServerUrl.includes('github.io')) {
        blobEndpoint = `${currentServerUrl.replace(/\/+$/, '')}/api/list-blobs`;
      }
      const blobResp = await fetch(blobEndpoint, { cache: 'no-store' });
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
                tags: [inferredCat, 'Vercel Cloud', 'Research Monograph'],
                downloads: 0,
                reads: 18,
                featured: true,
                isCloudBlob: true
              });
            }
          }
        }
      }
    } catch (blobErr) {
      console.warn('[DigiLib] Cloud blob sync skipped:', blobErr);
    }

    // 3. Merge with locally added custom books if in client/static mode
    try {
      const localCustom = JSON.parse(localStorage.getItem(BOOKS_CACHE_KEY) || '[]');
      if (Array.isArray(localCustom) && localCustom.length > 0) {
        const existingIds = new Set(books.map(b => b.id));
        for (const cb of localCustom) {
          if (!existingIds.has(cb.id)) {
            books.unshift(cb);
          }
        }
      }
    } catch (e) {}

    return books;
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

      const resp = await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
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

    // 3. Store in localStorage catalogue
    try {
      const localCustom = JSON.parse(localStorage.getItem(BOOKS_CACHE_KEY) || '[]');
      const filtered = localCustom.filter(b => b.id !== bookId && b.title !== newBook.title);
      filtered.unshift(newBook);
      localStorage.setItem(BOOKS_CACHE_KEY, JSON.stringify(filtered));
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
    deleteFileFromIDB
  };
})();

if (typeof window !== 'undefined') {
  window.DigiStorage = DigiStorage;
}
