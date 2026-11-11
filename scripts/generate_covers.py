import os

os.makedirs('assets/images/covers', exist_ok=True)

covers = [
    {
        "filename": "cover_wonder_india.svg",
        "title": "The Wonder That Was India",
        "subtitle": "Survey of Culture & Heritage",
        "author": "A. L. Basham",
        "era": "Ancient Civilizations",
        "bg_start": "#7B1113",
        "bg_end": "#2D080A",
        "accent": "#F4D03F"
    },
    {
        "filename": "cover_excavations_vidarbha.svg",
        "title": "Archaeological Excavations of Vidarbha",
        "subtitle": "Megalithic Stone Circles & Metallurgy",
        "author": "Dept. AIHC & Archaeology",
        "era": "Iron Age & Megalithic",
        "bg_start": "#1B4F72",
        "bg_end": "#0B1D28",
        "accent": "#5DADE2"
    },
    {
        "filename": "cover_coins_ancient_india.svg",
        "title": "Coins of Ancient India",
        "subtitle": "Punch-Marked to Gupta Dinars",
        "author": "Sir Alexander Cunningham",
        "era": "Numismatics & Economy",
        "bg_start": "#B7950B",
        "bg_end": "#443403",
        "accent": "#F9E79F"
    },
    {
        "filename": "cover_inscriptions_ashoka.svg",
        "title": "Corpus Inscriptionum: Ashoka",
        "subtitle": "Major Rock & Pillar Edicts",
        "author": "Epigraphical Research Division",
        "era": "Mauryan Empire (3rd C. BCE)",
        "bg_start": "#145A32",
        "bg_end": "#072012",
        "accent": "#58D68D"
    },
    {
        "filename": "cover_temple_architecture.svg",
        "title": "Indian Temple Architecture & Iconography",
        "subtitle": "Nagara, Dravida & Vesara Forms",
        "author": "Dr. V. S. Agrawala",
        "era": "Classical & Medieval Arts",
        "bg_start": "#6C3483",
        "bg_end": "#281432",
        "accent": "#EB984E"
    },
    {
        "filename": "cover_indus_valley.svg",
        "title": "Harappa & Mohenjo-Daro Excavations",
        "subtitle": "Bronze Age Urbanism & Seals",
        "author": "Sir John Marshall",
        "era": "Protohistory (2600-1900 BCE)",
        "bg_start": "#A04000",
        "bg_end": "#3E1900",
        "accent": "#FAD7A0"
    },
    {
        "filename": "cover_vakataka_heritage.svg",
        "title": "Heritage of Vidarbha & The Vakatakas",
        "subtitle": "Mansar, Ramtek & Ajanta Connections",
        "author": "RTMNU Archaeological Research Cell",
        "era": "Vidarbha Regional History",
        "bg_start": "#4A235A",
        "bg_end": "#190022",
        "accent": "#F1948A"
    },
    {
        "filename": "cover_sanskrit_epigraphy.svg",
        "title": "Indian Epigraphy & Paleography",
        "subtitle": "Brahmi, Kharosthi & Regional Scripts",
        "author": "D. C. Sircar",
        "era": "Script & Manuscript Studies",
        "bg_start": "#117864",
        "bg_end": "#05261F",
        "accent": "#76D7C4"
    }
]

for c in covers:
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 580" width="100%" height="100%">
  <defs>
    <linearGradient id="grad_{c['filename']}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c['bg_start']}"/>
      <stop offset="100%" stop-color="{c['bg_end']}"/>
    </linearGradient>
    <pattern id="arch_pat_{c['filename']}" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 0 15 L 15 0 L 30 15 L 15 30 Z" fill="none" stroke="{c['accent']}" stroke-width="0.7" opacity="0.12"/>
    </pattern>
  </defs>
  
  <!-- Background -->
  <rect width="400" height="580" rx="8" fill="url(#grad_{c['filename']})"/>
  <rect width="400" height="580" fill="url(#arch_pat_{c['filename']})"/>
  
  <!-- Border and decorative frame -->
  <rect x="18" y="18" width="364" height="544" rx="4" fill="none" stroke="{c['accent']}" stroke-width="1.8" opacity="0.75"/>
  <rect x="25" y="25" width="350" height="530" rx="2" fill="none" stroke="{c['accent']}" stroke-width="0.8" opacity="0.4"/>
  
  <!-- Corner Ornaments -->
  <circle cx="28" cy="28" r="5" fill="{c['accent']}" opacity="0.8"/>
  <circle cx="372" cy="28" r="5" fill="{c['accent']}" opacity="0.8"/>
  <circle cx="28" cy="552" r="5" fill="{c['accent']}" opacity="0.8"/>
  <circle cx="372" cy="552" r="5" fill="{c['accent']}" opacity="0.8"/>
  
  <!-- Header Institution Tag -->
  <text x="200" y="65" text-anchor="middle" font-family="'Cinzel', 'Times New Roman', serif" font-size="11" font-weight="700" fill="{c['accent']}" letter-spacing="2.5" opacity="0.9">RTM NAGPUR UNIVERSITY</text>
  <text x="200" y="82" text-anchor="middle" font-family="'Inter', sans-serif" font-size="9" fill="#FFFFFF" letter-spacing="1" opacity="0.7">DEPT. OF ANCIENT INDIAN HISTORY &amp; ARCHAEOLOGY</text>
  
  <line x1="60" y1="100" x2="340" y2="100" stroke="{c['accent']}" stroke-width="1.2" opacity="0.6"/>
  <polygon points="200,96 205,100 200,104 195,100" fill="{c['accent']}"/>
  
  <!-- Era Tag -->
  <rect x="110" y="125" width="180" height="24" rx="12" fill="{c['accent']}" opacity="0.18"/>
  <text x="200" y="141" text-anchor="middle" font-family="'Inter', sans-serif" font-size="10" font-weight="600" fill="{c['accent']}" letter-spacing="1.2">{c['era']}</text>

  <!-- Title -->
  <foreignObject x="45" y="175" width="310" height="170">
    <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center;">
      <h1 style="color:#FFFFFF; font-family:'Cinzel', 'Georgia', serif; font-size:22px; font-weight:700; margin:0 0 10px 0; line-height:1.3; text-shadow:0 2px 4px rgba(0,0,0,0.6);">{c['title']}</h1>
      <p style="color:{c['accent']}; font-family:'Merriweather', serif; font-size:12px; margin:0; line-height:1.4; font-style:italic;">{c['subtitle']}</p>
    </div>
  </foreignObject>

  <!-- Central Seal Emblem -->
  <circle cx="200" cy="385" r="42" fill="none" stroke="{c['accent']}" stroke-width="1.5" opacity="0.5"/>
  <circle cx="200" cy="385" r="36" fill="rgba(0,0,0,0.25)" stroke="{c['accent']}" stroke-dasharray="3,3" stroke-width="1"/>
  <text x="200" y="392" text-anchor="middle" font-family="'Cinzel', serif" font-size="20" fill="{c['accent']}" opacity="0.9">&#9884;</text>

  <!-- Author & Bottom Banner -->
  <line x1="60" y1="465" x2="340" y2="465" stroke="{c['accent']}" stroke-width="1" opacity="0.6"/>
  <text x="200" y="495" text-anchor="middle" font-family="'Inter', sans-serif" font-size="13" font-weight="600" fill="#FFFFFF" letter-spacing="0.5">{c['author']}</text>
  <text x="200" y="525" text-anchor="middle" font-family="'Inter', sans-serif" font-size="10" fill="{c['accent']}" letter-spacing="1.5" opacity="0.85">DIGITAL RESEARCH ARCHIVE</text>
</svg>'''

    with open(f"assets/images/covers/{c['filename']}", 'w', encoding='utf-8') as f:
        f.write(svg_content)

print("Generated all 8 SVG book covers successfully!")
