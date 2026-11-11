/**
 * DigiLib - Universal Document Reader Engine (PDF, DOC, DOCX)
 * Department of Ancient Indian History, Culture & Archaeology, RTMNU
 */

const DigiReader = (function() {
  let currentBook = null;
  let pdfDoc = null;
  let currentPage = 1;
  let totalPages = 1;
  let currentScale = 1.25;
  let currentTheme = 'theme-parchment';

  // Initialize PDF.js worker
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // Open Book in In-App Reader
  async function openBook(book) {
    currentBook = book;
    const modal = document.getElementById('readerModal');
    const titleEl = document.getElementById('readerBookTitle');
    const badgeEl = document.getElementById('readerFormatBadge');
    const container = document.getElementById('readerDocumentContainer');
    const viewport = document.getElementById('readerViewport');

    if (!modal || !container) return;

    // Set UI metadata
    titleEl.textContent = book.title;
    badgeEl.textContent = (book.format || 'pdf').toUpperCase();
    badgeEl.className = 'reader-format-badge ' + (book.format || 'pdf');

    // Show Reader modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Set theme
    viewport.className = 'reader-viewport ' + currentTheme;

    // Show loading state
    container.innerHTML = `
      <div class="reader-loader">
        <div class="spinner-ring"></div>
        <p style="font-family:var(--font-heading); font-size:1.1rem; color:var(--color-gold);">Loading Research Manuscript...</p>
        <p style="font-size:0.85rem; color:#888;">Formatting protected archival document</p>
      </div>
    `;

    // Start anti-screenshot dynamic watermark
    const user = DigiAuth.getUser();
    DigiSecurity.startWatermark(user ? user.email : 'Academic Scholar');

    // Load file based on format
    const format = (book.format || 'pdf').toLowerCase();
    const fileUrl = book.filePath;

    try {
      if (format === 'pdf') {
        await loadPdf(fileUrl, container);
      } else if (format === 'docx') {
        await loadDocx(fileUrl, container);
      } else if (format === 'doc') {
        await loadDoc(fileUrl, container);
      } else {
        throw new Error('Unsupported format: ' + format);
      }
    } catch (err) {
      console.error('[DigiLib Reader Error]', err);
      container.innerHTML = `
        <div style="text-align:center; padding:60px 20px; color:#C0392B;">
          <h2 style="font-family:var(--font-heading); margin-bottom:12px;">Unable to display manuscript</h2>
          <p style="color:#555; max-width:500px; margin:0 auto 20px auto;">
            The requested document could not be rendered directly. Please ensure the file exists in the repository.
          </p>
          <p style="font-size:0.85rem; color:#888;">Details: ${err.message}</p>
        </div>
      `;
    }
  }

  // Close Reader
  function closeReader() {
    const modal = document.getElementById('readerModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    DigiSecurity.stopWatermark();
    pdfDoc = null;
    currentBook = null;
  }

  // Load and Render PDF with PDF.js
  async function loadPdf(url, container) {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js library is not loaded');
    }

    const loadingTask = window.pdfjsLib.getDocument(url);
    pdfDoc = await loadingTask.promise;
    totalPages = pdfDoc.numPages;
    currentPage = 1;

    updatePageIndicator();
    container.innerHTML = '';

    // Render all pages in continuous view
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'pdf-page-wrapper';
      pageWrapper.id = `pdf-page-${pageNum}`;

      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-canvas';
      pageWrapper.appendChild(canvas);
      container.appendChild(pageWrapper);

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: currentScale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport: viewport
      };
      await page.render(renderContext).promise;
    }
  }

  // Load and Render DOCX with Mammoth.js
  async function loadDocx(url, container) {
    if (!window.mammoth) {
      throw new Error('Mammoth.js document parser is not loaded');
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    const result = await window.mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
    const html = result.value;

    totalPages = 1;
    currentPage = 1;
    updatePageIndicator();

    container.innerHTML = `
      <div class="docx-rendered-content">
        ${html}
      </div>
    `;
  }

  // Load and Render DOC (RTF / text fallback)
  async function loadDoc(url, container) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load document: ${response.statusText}`);
    }
    const text = await response.text();

    // Clean simple RTF tags if RTF
    let cleanText = text;
    if (text.startsWith('{\\rtf')) {
      cleanText = text
        .replace(/\\par/g, '<br/><br/>')
        .replace(/\\b\s/g, '<strong>')
        .replace(/\\b0\s/g, '</strong>')
        .replace(/\\i\s/g, '<em>')
        .replace(/\\i0\s/g, '</em>')
        .replace(/\\[a-zA-Z0-9\-]+/g, '')
        .replace(/[{}]/g, '')
        .trim();
    }

    totalPages = 1;
    currentPage = 1;
    updatePageIndicator();

    container.innerHTML = `
      <div class="docx-rendered-content">
        <h1>${currentBook.title}</h1>
        <p style="text-align:center; font-style:italic; color:#666;">By ${currentBook.author}</p>
        <hr style="border:none; border-top:1px solid #D4AF37; margin:20px 0;"/>
        <div style="font-family:var(--font-serif); line-height:1.8;">
          ${cleanText}
        </div>
      </div>
    `;
  }

  // Page Navigation
  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
      scrollToPage(currentPage);
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
      scrollToPage(currentPage);
    }
  }

  function scrollToPage(pageNum) {
    const el = document.getElementById(`pdf-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    updatePageIndicator();
  }

  function updatePageIndicator() {
    const pageInput = document.getElementById('readerCurrentPage');
    const totalEl = document.getElementById('readerTotalPages');
    if (pageInput) pageInput.value = currentPage;
    if (totalEl) totalEl.textContent = totalPages;
  }

  // Zoom Controls
  function zoomIn() {
    if (currentScale < 2.5) {
      currentScale += 0.2;
      rerender();
    }
  }

  function zoomOut() {
    if (currentScale > 0.6) {
      currentScale -= 0.2;
      rerender();
    }
  }

  function resetZoom() {
    currentScale = 1.25;
    rerender();
  }

  function rerender() {
    if (currentBook && (currentBook.format || 'pdf').toLowerCase() === 'pdf') {
      const container = document.getElementById('readerDocumentContainer');
      loadPdf(currentBook.filePath, container);
    }
  }

  // Theme Switching: Parchment / Night / Day
  function setTheme(themeName) {
    currentTheme = themeName;
    const viewport = document.getElementById('readerViewport');
    if (viewport) {
      viewport.className = 'reader-viewport ' + themeName;
    }
  }

  // Fullscreen Toggle
  function toggleFullscreen() {
    const modal = document.getElementById('readerModal');
    if (!document.fullscreenElement) {
      modal.requestFullscreen().catch(err => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  return {
    openBook,
    closeReader,
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
    resetZoom,
    setTheme,
    toggleFullscreen
  };
})();
