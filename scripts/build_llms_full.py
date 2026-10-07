#!/usr/bin/env python3
"""Build llms-full.txt: llms.txt plus the static Church and Crossing texts, verbatim.

Run from the repo root after changing llms.txt, church.html or crossing.html:
    python3 scripts/build_llms_full.py
"""
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
BLOCK = {'p', 'div', 'h1', 'h2', 'h3', 'h4', 'li', 'pre', 'section', 'article', 'header', 'br', 'blockquote', 'label', 'legend'}
SKIP = {'script', 'style', 'button', 'input', 'textarea', 'select', 'option', 'svg'}
# Navigation and form-status chrome, not text.
SKIP_IDS = {'apoc-success'}
SKIP_CLASSES = {'apoc-jump', 'record-reference'}
VOID = {'br', 'img', 'input', 'meta', 'link', 'hr', 'source', 'wbr'}


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.skip, self.stack = [], 0, []

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            if tag == 'br':
                self.out.append('\n')
            return
        attrs = dict(attrs)
        skipped = (tag in SKIP or attrs.get('id') in SKIP_IDS
                   or bool(SKIP_CLASSES & set((attrs.get('class') or '').split())))
        self.stack.append(skipped)
        if skipped:
            self.skip += 1
        elif tag in BLOCK:
            self.out.append('\n')
        if tag in ('h1', 'h2', 'h3') and not self.skip:
            self.out.append('#' * int(tag[1]) + '# ')

    def handle_endtag(self, tag):
        if tag in VOID or not self.stack:
            return
        if self.stack.pop():
            self.skip -= 1
        elif tag in BLOCK:
            self.out.append('\n')

    def handle_startendtag(self, tag, attrs):
        if tag == 'br':
            self.out.append('\n')

    def handle_data(self, data):
        if not self.skip:
            self.out.append(data)

    def text(self):
        lines = [re.sub(r'[ \t ]+', ' ', line).strip() for line in ''.join(self.out).splitlines()]
        text = '\n'.join(lines)
        return re.sub(r'\n{3,}', '\n\n', text).strip()


def extract(path, start, end):
    html = (ROOT / path).read_text(encoding='utf-8')
    i, j = html.index(start), html.index(end)
    parser = TextExtractor()
    parser.feed(html[i:j])
    return parser.text()


church = extract('church.html', '<div class="gospel">', '<h2 class="scroll-title" id="apoc-entries">')
# The rotated-B glyph is the drawing on the empty seat, not text.
church = '\n'.join(line for line in church.splitlines() if line.strip() != '₿')
crossing = extract('crossing.html', '<article>', '</article>')
llms = (ROOT / 'llms.txt').read_text(encoding='utf-8').rstrip()

doc = f"""{llms}

# Full Text Appendix
Generated from llms.txt, church.html and crossing.html by scripts/build_llms_full.py.
The Church texts below are lore and are reproduced verbatim. Attribution follows the
Church's own labels; it does not authenticate model or provider identity.
Dynamic entries (the Scroll of Buttlievers, admitted Apocrypha entries, the Ledger) are
not copied here. Read them live: GET https://buttcoin.wtf/api/church-content

## Church of Buttcoin: Gospel, Council, Apocrypha (https://buttcoin.wtf/church)

{church}

## The Crossing (https://buttcoin.wtf/crossing)

{crossing}
"""
(ROOT / 'llms-full.txt').write_text(doc, encoding='utf-8')
print(f'llms-full.txt: {len(doc.splitlines())} lines')
