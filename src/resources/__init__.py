import string as _string

EXTENSIONS = {
    'application/gzip': 'GZ',
    'application/json': 'JSON',
    'application/msword': 'DOC',
    'application/pdf': 'PDF', 'image/tiff': 'TIFF',
    'application/rtf': 'RTF',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.ms-powerpoint': 'PPT',
    'application/vnd.oasis.opendocument.presentation': 'ODP',
    'application/vnd.oasis.opendocument.spreadsheet': 'ODS',
    'application/vnd.oasis.opendocument.text': 'ODT',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/x-bzip2': 'BZ2',
    'application/x-tar': 'TAR',
    'application/xml': 'XML',
    'application/zip': 'ZIP',
    'audio/mpeg': 'MP3',
    'audio/webm': 'WEBA',
    'image/gif': 'GIF',
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/webp': 'WEBP',
    'image/x-icon': 'ICO',
    'text/css': 'CSS',
    'text/csv': 'CSV',
    'text/html': 'HTML',
    'text/javascript': 'JS',
    'text/plain': 'TXT',
    'video/mp4': 'MP4',
    'video/mpeg': 'MPEG',
    'video/webm': 'WEBM',
}
EXTENSIONS_REVERSE = {value: key for key, value in EXTENSIONS.items()}
FILE_TYPES = {
}
GRADES = [
    '-',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
]
LANGUAGES = [
    'de',
    'en',
    'fr',
    'it',
    'es',
    '-'
]
SEARCH_ENGINES = {
    'DuckDuckGo': {
        'url': 'https://duckduckgo.com/?q=%s',
        'recommended': True,
    },
    'BraveSearch': {
        'url': 'https://search.brave.com/search?q=%s',
        'recommended': True,
    },
    'Ecosia': {
        'url': 'https://www.ecosia.org/search?method=index&q=%s',
        'recommended': True,
    },
    'Startpage': {
        'url': 'https://www.startpage.com/sp/search?query=%s',
        'recommended': True,
    },
    'SearXNG': {
        'url': 'https://search.gcomm.ch/search?q=%s&language=de-CH',
        'recommended': True,
    },
    'WolframAlpha': {
        'url': 'https://www.wolframalpha.com/input?i=%s',
        'recommended': True,
    },
    'Google': {
        'url': 'https://www.google.com/search?q=%s',
        'recommended': False,
    },
    'Bing': {
        'url': 'https://www.bing.com/search?q=%s',
        'recommended': False,
    },
    'DuckDuckGo[Lite]': {
        'url': 'https://lite.duckduckgo.com/lite/?q=%s',
        'recommended': True,
    },
    'DuckDuckGo[TOR]': {
        'url': 'https://duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion/?q=%s',
        'recommended': True,
    },
    'Brave Search[TOR]': {
        'url': 'https://search.brave4u7jddbv7cyviptqjc7jusxh72uik7zt6adtckl5f4nwy2v72qd.onion/search?q=%s',
        'recommended': True,
    },
    'SearXNG[TOR]': {
        'url': 'http://searx3aolosaf3urwnhpynlhuokqsgz47si4pzz5hvb7uuzyjncl2tid.onion/search?q=%s', # noqa
        'recommended': True,
    },
}
SIZE_UNITS = [
    'B',
    'KB',
    'MB',
    'GB',
    'TB',
]
SUBJECTS = {
    '-': 'Keines / Anderes',
    'BG': 'Bildnerisches Gestalten',
    'BI': 'Biologie',
    'BL': 'Begleitetes Lernen',
    'CH': 'Chemie',
    'DE': 'Deutsch',
    'EN': 'Englisch',
    'FR': 'Französisch',
    'GG': 'Geografie',
    'GS': 'Geschichte',
    'HW': 'Hauswirtschaft',
    'IN': 'Informatik',
    'KS': 'Klassenstunde',
    'MA': 'Mathematik',
    'MU': 'Musik',
    'NT': 'Natur & Technik',
    'PB': 'Politische Bildung',
    'PH': 'Philosophie',
    'PS': 'Physik',
    'RE': 'Religionskunde & Ethik',
    'SP': 'Sport',
    'TG': 'Technisches Gestalten',
    'WR': 'Wirtschaft & Recht',
    'SAM': 'Schwerpunktfach Anwendungen der Mathematik',
    'SPS': 'Schwerpunktfach Physik',
    'SBI': 'Schwerpunktfach Biologie',
    'SCH': 'Schwerpunktfach Chemie',
    'SBG': 'Schwerpunktfach Bildnerisches Gestalten',
    'SES': 'Schwerpunktfach Spanisch',
    'SIT': 'Schwerpunktfach Italienisch',
    'SMU': 'Schwerpunktfach Musik',
    'SWR': 'Schwerpunktfach Wirtschaft & Recht',
    'EAM': 'Ergänzungsfach Anwendungen der Mathematik',
    'EBG': 'Ergänzungsfach Bildnerisches Gestalten',
    'EBI': 'Ergänzungsfach Biologie',
    'ECH': 'Ergänzungsfach Chemie',
    'EGG': 'Ergänzungsfach Geografie',
    'EGS': 'Ergänzungsfach Geschichte',
    'EIN': 'Ergänzungsfach Informatik',
    'EMU': 'Ergänzungsfach Musik',
    'EPH': 'Ergänzungsfach Philosophie',
    'EPP': 'Ergänzungsfach Pädagogik & Psychologie',
    'EPS': 'Ergänzungsfach Physik',
    'ERE': 'Ergänzungsfach Religionskunde & Ethik',
    'ESP': 'Ergänzungsfach Sport',
    'EWR': 'Ergänzungsfach Wirtschaft & Recht',
    'F': 'Freifach',
}
THEMES = {
    'light': 'Hell',
}
