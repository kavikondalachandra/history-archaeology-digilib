import zipfile
import os

os.makedirs('data/books', exist_ok=True)

# 1. Create a clean sample DOCX file
def create_sample_docx(filepath, title, author, paragraphs):
    content_xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    content_xml += '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n'
    content_xml += '  <w:body>\n'
    content_xml += '    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="8B1E1E"/></w:rPr><w:t>' + title + '</w:t></w:r></w:p>\n'
    content_xml += '    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="28"/><w:color w:val="555555"/></w:rPr><w:t>By ' + author + '</w:t></w:r></w:p>\n'
    content_xml += '    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="B8860B"/></w:rPr><w:t>Rashtrasant Tukadoji Maharaj Nagpur University</w:t></w:r></w:p>\n'
    content_xml += '    <w:p><w:r><w:t></w:t></w:r></w:p>\n'
    for p in paragraphs:
        content_xml += '    <w:p><w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>' + p + '</w:t></w:r></w:p>\n'
        content_xml += '    <w:p><w:r><w:t></w:t></w:r></w:p>\n'
    content_xml += '    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr>\n'
    content_xml += '  </w:body>\n'
    content_xml += '</w:document>'

    types_xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    types_xml += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n'
    types_xml += '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n'
    types_xml += '  <Default Extension="xml" ContentType="application/xml"/>\n'
    types_xml += '  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n'
    types_xml += '</Types>'

    rels_xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    rels_xml += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n'
    rels_xml += '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n'
    rels_xml += '</Relationships>'

    with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as docx:
        docx.writestr('[Content_Types].xml', types_xml)
        docx.writestr('_rels/.rels', rels_xml)
        docx.writestr('word/document.xml', content_xml)

create_sample_docx(
    'data/books/archaeological_excavations_vidarbha.docx',
    'Archaeological Excavations and Megalithic Culture of Vidarbha',
    'Department of Ancient Indian History, Culture & Archaeology',
    [
        'INTRODUCTION: The Vidarbha region in central India represents one of the most significant archaeological landscapes for protohistoric and early historic studies. Characterized by extensive megalithic stone circles, cairn burials, and early iron-age occupational deposits, the region offers vital evidence regarding the transition from late chalcolithic traditions to urbanized early historic polities.',
        'MEGALITHIC SITES: Excavations conducted at prominent sites including Naikund, Mahurjhari, Takalghat, Khapa, and Mansar have revealed distinctive mortuary architecture. The stone circles are formed of large basalt boulders enclosing circular cairn fillings containing funerary deposits.',
        'ANCIENT METALLURGY: At Naikund, archaeologists uncovered an intact 1st millennium BCE iron-smelting furnace constructed of clay bricks with tuyeres and residual smelting slag, confirming indigenous steel and iron manufacturing expertise in central India.',
        'CERAMIC SEQUENCE: The dominant pottery tradition across these stratified contexts is Black and Red Ware (BRW) exhibiting fine burnishing and post-firing graffiti marks, accompanied by micaceous red ware.',
        'INSCRIPTIONS AND NUMISMATICS: Later historic horizons yield punch-marked coins, Satavahana copper and potin coinages, and early Brahmi inscriptions documenting regional administrative guilds and monastic endowments.'
    ]
)

# 2. Create a clean sample PDF file
def create_sample_pdf(filepath, title, author, lines):
    # Constructing a valid PDF 1.4 document
    stream_content = "BT\n/F1 18 Tf\n50 750 Td\n(" + title + ") Tj\nET\n"
    stream_content += "BT\n/F1 12 Tf\n50 720 Td\n(By " + author + ") Tj\nET\n"
    stream_content += "BT\n/F1 10 Tf\n50 700 Td\n(Rashtrasant Tukadoji Maharaj Nagpur University - Department of AIHC & Archaeology) Tj\nET\n"
    
    y = 660
    for line in lines:
        clean_line = line.replace('(', '\\(').replace(')', '\\)')
        stream_content += f"BT\n/F1 11 Tf\n50 {y} Td\n({clean_line}) Tj\nET\n"
        y -= 22
        if y < 80:
            break
            
    stream_bytes = stream_content.encode('latin1')
    stream_len = len(stream_bytes)
    
    pdf_content = bytearray()
    pdf_content.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    
    offsets = []
    
    # Obj 1: Catalog
    offsets.append(len(pdf_content))
    pdf_content.extend(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    
    # Obj 2: Pages
    offsets.append(len(pdf_content))
    pdf_content.extend(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
    
    # Obj 3: Page
    offsets.append(len(pdf_content))
    pdf_content.extend(b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n")
    
    # Obj 4: Stream
    offsets.append(len(pdf_content))
    pdf_content.extend(f"4 0 obj\n<< /Length {stream_len} >>\nstream\n".encode('latin1'))
    pdf_content.extend(stream_bytes)
    pdf_content.extend(b"\nendstream\nendobj\n")
    
    # Obj 5: Font
    offsets.append(len(pdf_content))
    pdf_content.extend(b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")
    
    # Xref
    xref_offset = len(pdf_content)
    pdf_content.extend(b"xref\n0 6\n0000000000 65535 f \n")
    for off in offsets:
        pdf_content.extend(f"{off:010d} 00000 n \n".encode('latin1'))
        
    # Trailer
    pdf_content.extend(f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode('latin1'))
    
    with open(filepath, 'wb') as f:
        f.write(pdf_content)

create_sample_pdf(
    'data/books/wonder_that_was_india.pdf',
    'The Wonder That Was India: A Survey of Culture and Heritage',
    'Prof. A. L. Basham',
    [
        'Ancient Indian civilization is distinguished by its extraordinary continuity and spiritual depth.',
        'From the early settlements of Mehrgarh and the Harappan bronze-age urbanism to the Vedic epochs,',
        'the Indian subcontinent pioneered advanced town planning, standardization of weights and measures,',
        'and profound philosophical treatises that continue to influence human thought across millennia.',
        '',
        'Historical Chapters in this Research Volume:',
        '1. The Indus Valley Civilization: Mohenjo-daro, Harappa, Dholavira, and Rakhigarhi.',
        '2. The Vedic Age: Rigvedic hymns, social structures, and sacrificial institutions.',
        '3. The Rise of Magadha, the Mauryan Empire, and Ashoka the Greats Dhamma Inscriptions.',
        '4. Classical Golden Age under the Imperial Guptas: Science, Sanskrit Literature, and Astronomy.',
        '5. Deccan and Peninsular Kingdoms: Satavahanas, Vakatakas, Chalukyas, and Rashtrakutas.'
    ]
)

create_sample_pdf(
    'data/books/coins_of_ancient_india.pdf',
    'Coins of Ancient India: From the Earliest Times to the 7th Century',
    'Sir Alexander Cunningham',
    [
        'Numismatic studies constitute one of the most reliable and chronological anchors in Indian history.',
        'This volume examines punch-marked silver and copper coins (karshapanas) of the Mahajanapadas,',
        'followed by the die-struck civic issues of Taxila, Ujjain, Eran, and Kausambi.',
        '',
        'Key Sections Included:',
        '1. The Punch-Marked Coinage: Symbols, metal purity, and weight standards.',
        '2. Indo-Greek, Indo-Scythian, and Kushana gold dinars featuring bilingual legends.',
        '3. Imperial Gupta Gold Coinage: Archer type, Ashvamedha sacrifice type, and Lyrist motifs.',
        '4. Regional Coinages of Central India, Vidarbha, and the Western Kshatrapas.'
    ]
)

# 3. Create a sample .doc file (Rich Text Format compatible, universally opened by Word and parsers)
def create_sample_doc(filepath, title, author, content):
    rtf = "{\\rtf1\\ansi\\deff0\n"
    rtf += "{\\fonttbl{\\f0\\fswiss\\fcharset0 Helvetica;}{\\f1\\froman\\fcharset0 Times New Roman;}}\n"
    rtf += "{\\colortbl ;\\red139\\green0\\blue0;\\red40\\green40\\blue40;\\red184\\green134\\blue11;}\n"
    rtf += "\\viewkind4\\uc1\\pard\\qc\\cf1\\b\\fs36 " + title + "\\par\n"
    rtf += "\\cf3\\b0\\i\\fs24 " + author + "\\par\n"
    rtf += "\\cf3\\i0\\fs20 Department of Ancient Indian History, Culture & Archaeology, RTMNU\\par\\par\n"
    rtf += "\\pard\\cf2\\fs22 " + content.replace("\n", "\\par\\par ") + "\\par\n"
    rtf += "}"
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(rtf)

create_sample_doc(
    'data/books/inscriptions_of_ashoka.doc',
    'Corpus of Inscriptions of Emperor Ashoka',
    'Epigraphical Research Division, RTMNU',
    "Major Rock Edicts, Pillar Inscriptions and Minor Edicts of Devanampriya Priyadarsi.\n\n"
    "Major Rock Edict I (Girnar, Kalsi, Shahbazgarhi, Mansehra):\n"
    "Here no living being must be killed and sacrificed. Formerly in the kitchen of Beloved-of-the-Gods, King Priyadarsi, many hundreds of thousands of animals were killed every day for curry.\n\n"
    "Major Rock Edict XII:\n"
    "Beloved-of-the-Gods honors both ascetics and the householders of all religions, and he honors them with gifts and honors of various kinds. Growth in essentials can be done in different ways, but all of them have as their root restraint in speech, that is, not praising one's own religion, or condemning the religion of others without good reason.\n\n"
    "Pillar Edict VII:\n"
    "Along roads I have had banyan trees planted so that they can give shade to animals and men, and I have had mango groves planted. At intervals of eight kos, I have had wells dug and rest-houses built."
)

print('Sample PDF, DOCX, and DOC books generated successfully!')
