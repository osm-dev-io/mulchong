"""Check static output links, assets, page semantics and template completion."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import sys

ROOT = Path(__file__).resolve().parent.parent / 'dist'
PAGES = ['index', 'menu', 'stores', 'media', 'franchise']

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
        self.ids = set()
        self.duplicates = []
        self.h1 = 0
        self.header = self.footer = self.main = 0
        self.missing_alt = 0
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('href', 'src'):
            if attrs.get(key):
                self.refs.append(attrs[key])
        if attrs.get('id'):
            if attrs['id'] in self.ids:
                self.duplicates.append(attrs['id'])
            self.ids.add(attrs['id'])
        if tag == 'h1': self.h1 += 1
        if tag == 'header': self.header += 1
        if tag == 'footer': self.footer += 1
        if tag == 'main': self.main += 1
        if tag == 'img' and 'alt' not in attrs: self.missing_alt += 1

errors = []
parsed = {}
for name in PAGES:
    path = ROOT / f'{name}.html'
    if not path.exists():
        errors.append(f'Missing page: {name}')
        continue
    parser = Page()
    text = path.read_text()
    parser.feed(text)
    parsed[path] = parser
    if parser.h1 != 1 or parser.header != 1 or parser.footer != 1 or parser.main != 1:
        errors.append(f'Invalid landmarks/headings: {name}')
    if parser.duplicates: errors.append(f'Duplicate IDs: {name}: {parser.duplicates}')
    if parser.missing_alt: errors.append(f'Missing image alt: {name}')
    if '$body' in text or '$menu_' in text or '$franchise_contact' in text:
        errors.append(f'Unresolved template: {name}')

for source, parser in parsed.items():
    for ref in parser.refs:
        parts = urlsplit(ref)
        if parts.scheme or parts.netloc:
            continue
        target = source.parent / unquote(parts.path) if parts.path else source
        if not target.is_file():
            errors.append(f'Broken local reference: {source.name} -> {ref}')
        elif parts.fragment and target in parsed and unquote(parts.fragment) not in parsed[target].ids:
            errors.append(f'Broken fragment: {source.name} -> {ref}')

if errors:
    print('\n'.join(errors))
    sys.exit(1)
print(f'PASS: {len(parsed)} pages, common header/footer, all local links and images, unique IDs and main headings.')
