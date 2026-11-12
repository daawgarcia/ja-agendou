"""Gera os PDFs do Hálito Limpo a partir dos HTMLs.
Uso: python render.py [ebook|kit|todos]
"""
import sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "out"
OUT.mkdir(exist_ok=True)

DOCS = {
    "ebook": ("ebook.html", "Halito_Limpo_em_7_Dias.pdf", "Hálito Limpo em 7 Dias"),
    "kit": ("kit30.html", "Kit_30_Dias_Halito_Limpo.pdf", "Kit 30 Dias · Hálito Limpo"),
}

FOOTER = """
<div style="width:100%;font-family:Arial,sans-serif;font-size:7px;color:#5C6B73;
            padding:0 14mm;display:flex;justify-content:space-between;letter-spacing:.04em">
  <span>{title}</span><span class="pageNumber"></span>
</div>"""


def render(key):
    src, dst, title = DOCS[key]
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        page = b.new_page()
        page.goto((ROOT / src).as_uri(), wait_until="networkidle")
        page.evaluate("document.fonts.ready")
        page.pdf(
            path=str(OUT / dst),
            prefer_css_page_size=True,
            print_background=True,
            display_header_footer=True,
            header_template="<div></div>",
            footer_template=FOOTER.format(title=title),
        )
        b.close()
    print("ok", OUT / dst)


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "todos"
    for k in (DOCS if which == "todos" else [which]):
        if (ROOT / DOCS[k][0]).exists():
            render(k)
