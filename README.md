# Historical & Archaeological Digital Research Library

### Department of Ancient Indian History, Culture & Archaeology
**Rashtrasant Tukadoji Maharaj Nagpur University, Nagpur**  
*Motto: &ldquo;विद्या परं दैवतम्&rdquo; (Knowledge is the Supreme Deity)*

---

## 🏛️ Overview

The **Historical & Archaeological Digital Research Library** is a colourful, eye-catching, production-ready web application engineered to preserve, present, and access rare academic manuscripts, excavation monographs, numismatic corpuses, epigraphical records, and historical treatises in **PDF**, **DOCX**, and **DOC** formats.

Built to run seamlessly both as a **standalone GitHub-hosted web application (GitHub Pages)** and paired with a **high-performance Java enterprise backend** or free cloud serverless environments.

---

## ✨ Key Features

1. **🏛️ Departmental Branding & Dual Seals**:
   - **Left Top**: Seal of Rashtrasant Tukadoji Maharaj Nagpur University.
   - **Right Top**: Seal of the Department of Ancient Indian History, Culture & Archaeology.
   - **Center Banner**: Official department identity, Sanskrit motto, and library branding.
2. **📖 Unlimited Online Reading**:
   - In-app **PDF Viewer** powered by PDF.js (canvas-rendered, smooth scrolling, zoom controls, full-screen mode).
   - In-app **Word Document Viewer** (DOCX / DOC) powered by Mammoth.js with ancient manuscript typography.
   - Parchment, Night, and Day reading themes.
3. **🛡️ Anti-Screenshot, Anti-Recording & Anti-Copy Protection**:
   - Right-click context menu disabled with archival notice toast.
   - Text drag, copy, and print shortcuts (`Ctrl+P`, `Ctrl+S`, `Ctrl+U`, `Ctrl+Shift+I`, `F12`, `PrintScreen`) intercepted.
   - **Anti-Screen Recording Shield**: Blurs document view when window loses focus or recording/snipping tools are activated.
   - **Dynamic Moving Watermark**: Continuously animates verified user's email, date, and university tag across the reader canvas.
   - Print media suppression (`@media print { body { display: none; } }`).
4. **⚖️ 1 Download Per Day Enforcement**:
   - Strict rate-limiting enforced on both client and server side.
   - Each registered user is allotted exactly **one document download per calendar day**.
   - Online reading remains **100% unlimited** at all times.
5. **🔐 Server-Backed Email Verification**:
   - 6-digit OTP verification system.
   - Grants session-authenticated access to academic scholars and students.
   - Includes instant demo OTP helper for offline / evaluation testing.
6. **🔍 Category-Wise Multi-Facet Search**:
   - Real-time instant search across titles, authors, dynasties, excavation sites, and tags.
   - Filter by categories:
     - *Ancient Indian History*
     - *Archaeology & Excavations*
     - *Epigraphy & Inscriptions*
     - *Numismatics & Ancient Coins*
     - *Temple Architecture & Iconography*
     - *Prehistory & Indus Valley*
     - *Heritage of Vidarbha & Central India*
     - *Sanskrit & Manuscripts*
   - Filter by file format (PDF, DOCX, DOC) and sort by popularity, title, or author.
7. **📤 Admin Portal & New Manuscript Ingestion**:
   - Secure librarian / admin management portal (initial default passphrase: `rtmnu2026`, customizable directly inside the portal's *Change Passphrase* tab).
   - Drag-and-drop file upload for PDF, DOCX, DOC.
   - Dynamic catalogue database updating (`data/books.json`).
   - 1-click **Export books.json** for syncing updates to GitHub.
   - In-portal Passphrase Manager with instant reset to default (`rtmnu2026`).
8. **🌐 Free Server Environments & Hybrid Architecture**:
   - Ready for **GitHub Pages** (free unlimited web hosting).
   - Ready for **Java Server** (`server/DigiLibServer.java` on port 8080).
   - Ready for **Free Cloud APIs** (Render, Vercel, Supabase, Cloudflare Workers in `/api`).
   - Integration bridge for `Ubooquity.jar`.
9. **📜 Mandatory Disclaimers & Credits**:
   - **Concept & Design**: K.S.Chandra, 2026, `kavikondalaschandra@gmail.com`.
   - **Disclaimer**: *All the books in this repository have been sourced and downloaded from various free and open source web sites. Due citations and acknowledgements will be given to respective Authors and Publishers.*

---

## 🚀 How to Run Locally with Java

### Windows:
Double-click `start-server.bat` or run:
```cmd
javac -d . server\DigiLibServer.java
java -cp . server.DigiLibServer 8080
```
Then visit: `http://localhost:8080` in your web browser.

### Linux / macOS:
```bash
chmod +x start-server.sh
./start-server.sh
```

---

## 📦 How to Deploy to GitHub & Host for Free on GitHub Pages

1. **Initialize Git and Commit**:
   ```bash
   git init
   git add .
   git commit -m "Initial release: History and Archaeological Digital Book Library"
   ```

2. **Push to Your GitHub Repository**:
   ```bash
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPOSITORY-NAME>.git
   git branch -M main
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to your repository on GitHub.
   - Click **Settings** &rarr; **Pages**.
   - Under **Build and deployment**:
     - **Source**: Select **GitHub Actions** (the included `.github/workflows/deploy.yml` will automatically build and publish).
     - Or select **Deploy from a branch** &rarr; **main** &rarr; **/(root)** &rarr; Click **Save**.
   - Your digital library is now live worldwide at:  
     `https://<YOUR-USERNAME>.github.io/<YOUR-REPOSITORY-NAME>/`

---

## ☁️ Free Server Environment Options

If you wish to host the server-backed API on the cloud for free:

| Provider | Type | Free Tier Specs | How to Link |
| :--- | :--- | :--- | :--- |
| **GitHub Pages** | Static Web Hosting | Unlimited bandwidth, free forever | Push to GitHub, enable in Settings &rarr; Pages |
| **Render.com** | Web Service (Java/Docker) | 750 free hours/month | Connect GitHub repo, set run command: `java -cp . server.DigiLibServer $PORT` |
| **Vercel** | Serverless Edge APIs | 100k requests/day free | Connect GitHub repo; endpoints in `/api` deploy automatically |
| **Cloudflare Pages** | Edge Web Hosting | Unlimited requests, global CDN | Connect GitHub repo, deploy root directory |

*In the library portal, click **Server Options** in the navigation bar to enter your custom backend URL anytime!*

---

## 📁 Repository Structure

```
DigiLib/
├── assets/
│   ├── css/
│   │   ├── style.css             # Main heritage & archaeological design
│   │   ├── reader.css            # PDF/DOCX reader styles & protection overlays
│   │   └── admin.css             # Librarian upload portal & catalogue management
│   ├── js/
│   │   ├── app.js                # Core controller, search, filters, modals
│   │   ├── auth.js               # Server-backed email verification (OTP)
│   │   ├── reader.js             # Universal document reader (PDF.js + Mammoth)
│   │   ├── storage.js            # Storage engine, daily download enforcement
│   │   ├── security.js           # Right-click, print, screenshot, blur protection
│   │   └── admin.js              # Book upload & catalogue updating
│   └── images/
│       ├── rtmnu_logo.png        # RTM Nagpur University Seal (Left Logo)
│       ├── dept_archaeology_logo.jpg # Department Seal (Right Logo)
│       └── covers/               # High-res SVG covers for initial collection
├── data/
│   ├── books.json                # Primary catalogue database
│   └── books/                    # PDF, DOCX, and DOC storage
├── server/
│   └── DigiLibServer.java        # High-performance Java HTTP Server
├── api/                          # Serverless cloud API functions (Vercel / Render)
│   ├── books.js
│   ├── send-otp.js
│   ├── verify-otp.js
│   └── download.js
├── .github/
│   └── workflows/
│       └── deploy.yml            # Automated GitHub Pages CI/CD workflow
├── index.html                    # Main web portal
├── start-server.bat              # 1-click Windows launcher
├── start-server.sh               # 1-click Linux/Mac launcher
├── Ubooquity.jar                 # Existing Java app preserved
├── .gitignore
└── README.md
```

---

## 🏛️ Credits & Copyright

- **Platform Architecture**: Built around Ubooquity application platform - Tom Vaemendis
- **Concept & Design**: K.S.Chandra, 2026 (`kavikondalaschandra@gmail.com`)
- **Institution**: Department of Ancient Indian History, Culture & Archaeology, Rashtrasant Tukadoji Maharaj Nagpur University
- **Disclaimer**: *All the books in this repository have been sourced and downloaded from various free and open source web sites. Due citations and acknowledgements will be given to respective Authors and Publishers.*
