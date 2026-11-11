/**
 * DigiLib - Storage & Backend Sync Engine
 * Department of Ancient Indian History, Culture & Archaeology, RTMNU
 * Concept & Design by K.S.Chandra, 2026, kavikondalaschandra@gmail.com
 */

const DigiStorage = (function() {
  const SERVER_URL_KEY = 'digilib_server_url';
  const DEFAULT_LOCAL_SERVER = 'http://localhost:8080';
  const BOOKS_CACHE_KEY = 'digilib_cached_books';
  const DOWNLOADS_KEY = 'digilib_daily_downloads';

  let currentServerUrl = localStorage.getItem(SERVER_URL_KEY) || (
    typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && window.location.protocol.startsWith('http')
      ? window.location.origin
      : DEFAULT_LOCAL_SERVER
  );
  let isServerConnected = false;
  let serverInfo = null;

  // Initialize and check server connectivity
  async function init() {
    // 1. Try configured server URL
    try {
      const resp = await fetch(`${currentServerUrl}/api/status`, { method: 'GET', cache: 'no-store' });
      if (resp.ok) {
        isServerConnected = true;
        try { serverInfo = await resp.json(); } catch(e) { serverInfo = { server: 'Online' }; }
        console.log('[DigiLib] Connected to server at:', currentServerUrl, serverInfo);
        return isServerConnected;
      }
    } catch (e) {}

    // 2. If currentServerUrl was localhost but failed, try current window origin (e.g. Vercel deployment)
    if (typeof window !== 'undefined' && window.location.origin && window.location.origin !== currentServerUrl && window.location.protocol.startsWith('http')) {
      try {
        const resp = await fetch(`${window.location.origin}/api/status`, { method: 'GET', cache: 'no-store' });
        if (resp.ok) {
          currentServerUrl = window.location.origin;
          isServerConnected = true;
          try { serverInfo = await resp.json(); } catch(e) { serverInfo = { server: 'Vercel Serverless Cloud Engine' }; }
          localStorage.setItem(SERVER_URL_KEY, currentServerUrl);
          console.log('[DigiLib] Auto-detected Vercel / Cloud Host at:', currentServerUrl);
          return isServerConnected;
        }
      } catch (e) {}
    }

    isServerConnected = false;
    serverInfo = null;
    console.log('[DigiLib] Running in GitHub Pages / Standalone Web Mode');
    return isServerConnected;
  }

  // Get Books Catalogue (combines remote / local / initial JSON)
  async function getBooks() {
    let books = [];
    
    // 1. Try fetching from active server or static data/books.json
    try {
      const url = isServerConnected ? `${currentServerUrl}/data/books.json` : 'data/books.json';
      const resp = await fetch(url, { cache: 'no-store' });
      if (resp.ok) {
        books = await resp.json();
      }
    } catch (e) {
      console.warn('[DigiLib] Failed to fetch data/books.json, checking cached books...');
    }

    // 2. Merge with locally added custom books if in client/static mode
    try {
      const localCustom = JSON.parse(localStorage.getItem(BOOKS_CACHE_KEY) || '[]');
      if (Array.isArray(localCustom) && localCustom.length > 0) {
        // Prepend custom books that aren't already in list
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
    if (isServerConnected) {
      // Send to Java Server endpoint
      const resp = await fetch(`${currentServerUrl}/api/books/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
      });
      return await resp.json();
    } else {
      // Check if Vercel Blob endpoint is available
      try {
        const vercelBlobResp = await fetch('/api/upload-blob', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookData)
        });
        if (vercelBlobResp.ok) {
          const blobRes = await vercelBlobResp.json();
          if (blobRes.success && blobRes.url) {
            bookData.filePath = blobRes.url;
            console.log('[DigiLib] Book saved to Vercel Blob Storage:', blobRes.url);
          }
        }
      } catch (e) {
        // Fallback if not on Vercel or Vercel Blob not enabled
      }

      // Save in browser storage and offer export for GitHub repository
      const localCustom = JSON.parse(localStorage.getItem(BOOKS_CACHE_KEY) || '[]');
      const newBook = {
        ...bookData,
        id: 'book-' + Date.now(),
        downloads: 0,
        reads: 0,
        featured: false
      };
      localCustom.unshift(newBook);
      localStorage.setItem(BOOKS_CACHE_KEY, JSON.stringify(localCustom));
      return { success: true, book: newBook, clientSaved: true };
    }
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
  function setServerUrl(url) {
    currentServerUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem(SERVER_URL_KEY, currentServerUrl);
    return init();
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
    getServerInfo
  };
})();
