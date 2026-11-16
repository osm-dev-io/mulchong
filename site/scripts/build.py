"""Shared templates + editable content -> five portable, static HTML pages."""
from pathlib import Path
from string import Template
from html import escape
from urllib.parse import urljoin
from xml.etree import ElementTree
import json
import shutil

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / 'content/site.json').read_text())
OUT = ROOT / 'dist'
SITE_URL = 'https://www.mulchong.com/'
PAGES = {
    'index': ('브랜드 소개', '물총칼국수 공식 홈페이지 | 천안 원성동 본점', '푸짐한 조개와 시원한 국물, 쫄깃한 면. 천안에서 시작된 물총칼국수의 브랜드와 메뉴, 매장을 만나보세요.'),
    'menu': ('메뉴 소개', '메뉴·가격 | 물총칼국수', '물총칼국수, 해물파전, 강황수육 등 대표 메뉴와 전체 메뉴판을 확인하세요.'),
    'stores': ('매장 찾기', '매장 찾기 | 물총칼국수 천안 본점 및 가맹점', '물총칼국수 천안 본점과 가맹점을 찾아보고, 네이버 지도에서 매장별 방문 정보를 확인하세요.'),
    'media': ('언론 · 미디어', '언론 · 미디어 | 물총칼국수', '물총칼국수의 미디어 소개와 공식 채널 소식을 만나보세요.'),
    'franchise': ('가맹 문의', '창업 절차 및 가맹 문의 | 물총칼국수', '물총칼국수 가맹 상담 안내와 창업 준비 사항을 확인하세요.'),
}
NAV_PAGES = {slug: info for slug, info in PAGES.items() if slug != 'media'}
PAGE_LINKS = {slug: './' if slug == 'index' else f'{slug}.html' for slug in PAGES}

def menu_card(item, preview=False):
    image = f'<img src="assets/{escape(item["image"])}" width="1080" height="1080" loading="lazy" alt="물총칼국수 본점의 {escape(item["name"])}">' if item['image'] else ''
    if preview:
        return f'''<a class="menu-card preview-card" href="menu.html"><div class="menu-image">{image}</div><div class="menu-card-body"><h3>{escape(item['name'])}</h3><p>{escape(item['description'])}</p></div></a>'''
    photo = f'<div class="menu-image">{image}</div>' if image else ''
    return f'''<article id="{item['id']}" class="menu-card catalog-card {'text-menu' if not image else ''}" data-category="{item['category']}">{photo}<div class="menu-card-body"><div class="menu-title"><h2>{escape(item['name'])}</h2></div><p>{escape(item['description'])}</p></div></article>'''

def menu_feature_cards():
    return ''.join(menu_card(item) for item in DATA['menus'][:4])

def store_cards():
    cards = []
    for item in DATA['stores']:
        name = escape(item['name'])
        photos = ''.join(f'<img src="assets/{escape(image)}" loading="lazy" alt="{name} 매장 사진 {index}">' for index, image in enumerate(item.get('images', []), 1))
        gallery = f'<div class="store-photo-gallery" aria-label="{name} 사진">{photos}</div>' if photos else ''
        if item.get('opening_notice'):
            detail = f'<p class="store-opening-notice">{escape(item["opening_notice"])}</p>'
        elif item.get('url'):
            detail = f'<a class="store-list-link" href="{escape(item["url"])}" target="_blank" rel="noopener noreferrer">네이버 지도에서 보기 <span aria-hidden="true">↗</span></a>'
        else:
            detail = ''
        cards.append(f'''<article class="store-list-item">
  <div class="store-list-top">
    <div class="store-list-info"><h2>{name}</h2></div>
    {detail}
  </div>
  {gallery}
</article>''')
    return ''.join(cards)

def media_cards():
    return ''.join(f'''<a class="media-card" href="{escape(item['url'])}" target="_blank" rel="noopener noreferrer" data-category="{item['category']}"><div class="media-cover"><span class="media-platform">{escape(item['platform'])}</span><span class="media-wordmark">물총칼국수</span><span class="media-cover-caption">우리의 이야기가 이어지는 곳</span></div><div class="media-card-body"><span class="small-label">{escape(item['label'])}</span><h2>{escape(item['title'])}</h2><p>{escape(item['description'])}</p><span class="text-link">채널 방문하기 <span class="plus" aria-hidden="true">+</span></span></div></a>''' for item in DATA['media'])

def franchise_contact():
    contact = DATA['franchise']
    if contact.get('phone') or contact.get('email'):
        links = []
        if contact.get('phone'):
            phone = escape(contact['phone'])
            links.append(f'<a class="button button-gold" href="tel:{phone.replace("-", "")}">전화 상담 {phone}</a>')
        if contact.get('email'):
            email = escape(contact['email'])
            links.append(f'<a class="button button-outline-light" href="mailto:{email}">이메일 문의</a>')
        return '<h2>물총칼국수와 함께할<br>다음 이야기를 들려주세요.</h2><p>희망 지역과 점포 유무, 개점 시기를 알려주시면<br>더 구체적인 상담을 도와드릴 수 있습니다.</p><div class="contact-actions">'+''.join(links)+'</div>'
    return '<span class="contact-status">가맹 상담 안내</span><h2>함께할 다음 이야기를<br>준비하고 있습니다.</h2><p>공식 가맹 상담 연락처는 추후 안내해 드립니다.<br>매장 방문 정보는 매장 찾기에서 확인하실 수 있습니다.</p><a class="button button-gold" href="stores.html">본점 방문 안내</a>'

def build():
    OUT.mkdir(exist_ok=True)
    public = ROOT / 'public'
    if public.is_dir():
        shutil.copytree(public, OUT, dirs_exist_ok=True)
    shutil.copytree(ROOT / 'assets', OUT / 'assets', dirs_exist_ok=True)
    base = Template((ROOT / 'templates/base.html').read_text())
    values = {k: escape(v) for k, v in DATA.items() if isinstance(v, str)}
    values.update(year='2026', franchise_phone=escape(DATA['franchise']['phone'] or ''), franchise_phone_plain=(DATA['franchise']['phone'] or '').replace('-', ''), menu_preview=''.join(menu_card(m, True) for m in DATA['menus'][:4]), menu_feature_cards=menu_feature_cards(), menu_cards=''.join(menu_card(m) for m in DATA['menus']), store_cards=store_cards(), store_count=str(len(DATA['stores'])), media_cards=media_cards(), franchise_contact=franchise_contact())
    count = 0
    sitemap = ElementTree.Element('urlset', xmlns='http://www.sitemaps.org/schemas/sitemap/0.9')
    for page, (label, title, description) in PAGES.items():
        path = ROOT / 'templates' / f'{page}.html'
        if not path.exists():
            continue
        nav = ''.join(f'<a href="{PAGE_LINKS[slug]}" class="nav-link {"active" if slug == page else ""} {"nav-cta" if slug == "franchise" else ""}"'+(' aria-current="page"' if slug == page else '')+f'>{info[0]}</a>' for slug, info in NAV_PAGES.items())
        footer_nav = ''.join(f'<a href="{PAGE_LINKS[slug]}">{info[0]}</a>' for slug, info in NAV_PAGES.items())
        body = Template(path.read_text()).substitute(values)
        if page == 'media':
            search_metadata = '<meta name="robots" content="noindex">'
        else:
            canonical = urljoin(SITE_URL, PAGE_LINKS[page])
            search_metadata = f'<link rel="canonical" href="{escape(canonical)}">'
            url = ElementTree.SubElement(sitemap, 'url')
            ElementTree.SubElement(url, 'loc').text = canonical
        rendered = base.substitute(**values, body=body, navigation=nav, footer_navigation=footer_nav, title=escape(title), description=escape(description), search_metadata=search_metadata, page=page)
        (OUT / f'{page}.html').write_text(rendered)
        count += 1
    ElementTree.indent(sitemap, space='  ')
    ElementTree.ElementTree(sitemap).write(OUT / 'sitemap.xml', encoding='utf-8', xml_declaration=True)
    (OUT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\n\nSitemap: {urljoin(SITE_URL, "sitemap.xml")}\n')
    print(f'Built {count} static pages in {OUT}')

if __name__ == '__main__':
    build()
