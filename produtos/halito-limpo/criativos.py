"""Gera as artes dos anúncios (feed 1080x1080 e story 1080x1920) em PNG.
Uso: python criativos.py
"""
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "out" / "criativos"
OUT.mkdir(parents=True, exist_ok=True)
import base64
def _data(name):
    raw = (ROOT.parent.parent / "public" / "halito-limpo" / name).read_bytes()
    return "data:image/webp;base64," + base64.b64encode(raw).decode()
COVER = _data("capa-ebook.webp")
BONUS = _data("capa-bonus.webp")

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,800&family=Inter:wght@500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:var(--h);font-family:Inter,sans-serif;overflow:hidden}
.c{width:1080px;height:var(--h);position:relative;display:flex;flex-direction:column;padding:90px 80px}
h1{font-family:Fraunces,serif;font-weight:800;line-height:1.02;letter-spacing:-.01em}
.brand{font-family:Fraunces,serif;font-weight:800;font-size:34px;display:flex;align-items:center;gap:14px}
.brand i{width:22px;height:22px;border-radius:50%;display:inline-block}
.pill{display:inline-block;font-weight:800;font-size:28px;letter-spacing:.08em;text-transform:uppercase;padding:14px 26px;border-radius:60px}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:center}
.cta{font-weight:800;font-size:34px;padding:26px 40px;border-radius:22px;background:#E4583F;color:#fff}
"""

NAVY, MINT, MINT2, SUN, CORAL = "#0E2A3B", "#2BB39A", "#DDF4EE", "#F5B53F", "#E4583F"


def c1(h):  # O lugar que a escova não alcança
    big = 132 if h > 1100 else 104
    return f"""
<div class="c" style="background:{NAVY};color:#fff">
  <div class="brand"><i style="background:{MINT}"></i>Hálito Limpo</div>
  <div style="margin:auto 0">
    <div class="pill" style="background:{SUN};color:{NAVY};margin-bottom:44px">Quase ninguém sabe</div>
    <h1 style="font-size:{big}px;margin-bottom:40px">O mau hálito que <span style="color:{MINT}">volta</span> depois de escovar tem um motivo.</h1>
    <p style="font-size:42px;color:#C5D8DD;line-height:1.35">Na maioria dos casos o cheiro nasce num lugar que a escova não alcança.</p>
  </div>
  <div class="foot"><div style="font-size:30px;color:#9DB6BE">Método de 7 dias · 5 min/dia</div><div class="cta">Descubra onde →</div></div>
</div>"""


def c2(h):  # Mito ou verdade
    big = 150 if h > 1100 else 118
    return f"""
<div class="c" style="background:{MINT2};color:{NAVY}">
  <div class="brand"><i style="background:{MINT}"></i>Hálito Limpo</div>
  <div style="margin:auto 0">
    <p style="font-size:44px;font-weight:700;margin-bottom:24px">“Mau hálito vem do estômago.”</p>
    <h1 style="font-size:{big}px;color:{CORAL};margin-bottom:36px">MITO.</h1>
    <p style="font-size:44px;line-height:1.35">Os estudos mostram que <b>8 a 9 em cada 10 casos</b> começam dentro da própria boca. E o lugar nº 1 não é o dente.</p>
  </div>
  <div class="foot"><div style="font-size:30px;font-weight:600">+ 11 mitos no guia</div><div class="cta">Ver o método →</div></div>
</div>"""


def c3(h):  # Disfarça vs resolve
    big = 112 if h > 1100 else 92
    rows = "".join(
        f'<div style="display:flex;justify-content:space-between;padding:26px 0;border-bottom:2px solid rgba(14,42,59,.12);font-size:40px"><span>{a}</span><b style="color:{c}">{b}</b></div>'
        for a, b, c in [("Bala de menta", "disfarça 20 min", CORAL), ("Enxaguante comum", "disfarça 1 h", CORAL),
                        ("Chiclete", "disfarça 30 min", CORAL), ("Limpar o lugar certo", "resolve", "#138169")])
    return f"""
<div class="c" style="background:#fff;color:{NAVY}">
  <div class="brand"><i style="background:{MINT}"></i>Hálito Limpo</div>
  <div style="margin:auto 0">
    <h1 style="font-size:{big}px;margin-bottom:50px">Disfarçar é diferente de resolver.</h1>
    {rows}
  </div>
  <div class="foot"><div style="font-size:30px;font-weight:600;color:#55646C">Guia prático · R$ 24,90</div><div class="cta">Quero resolver →</div></div>
</div>"""


def c4(h):  # Produto / oferta
    tall = h > 1100
    return f"""
<div class="c" style="background:linear-gradient(180deg,#F2FBF8,#DDF4EE);color:{NAVY};align-items:center;text-align:center">
  <div class="brand" style="align-self:flex-start"><i style="background:{MINT}"></i>Hálito Limpo</div>
  <h1 style="font-size:{96 if tall else 76}px;margin:{70 if tall else 30}px 0 {40 if tall else 24}px">Hálito limpo em 7 dias.<br><span style="color:{MINT}">5 minutos por dia.</span></h1>
  <div style="position:relative;width:{520 if tall else 310}px;margin:{30 if tall else 0}px 0">
    <img src="{COVER}" style="width:100%;border-radius:10px 18px 18px 10px;box-shadow:-30px 40px 80px rgba(14,42,59,.35);transform:rotate(-4deg)">
    <img src="{BONUS}" style="position:absolute;width:48%;right:-90px;bottom:-30px;border-radius:8px;box-shadow:-16px 24px 50px rgba(14,42,59,.35);transform:rotate(7deg)">
    <div class="pill" style="position:absolute;left:-80px;top:20px;background:{SUN};color:{NAVY};transform:rotate(-8deg);font-size:24px">+ bônus</div>
  </div>
  <div class="foot" style="width:100%"><div style="text-align:left"><div style="font-size:28px;color:#55646C">Ebook + bônus</div><div style="font-family:Fraunces,serif;font-weight:800;font-size:64px">R$ 24,90</div></div><div class="cta">Começar hoje →</div></div>
</div>"""


CONCEPTS = {"C1-motivo": c1, "C2-mito": c2, "C3-disfarca": c3, "C4-produto": c4}

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    for name, fn in CONCEPTS.items():
        for fmt, h in (("feed", 1080), ("story", 1920)):
            page = b.new_page(viewport={"width": 1080, "height": h})
            body = fn(h)
            if fmt == "story":  # margem de segurança da interface do Stories
                body = body.replace('class="c" style="', 'class="c" style="padding:250px 80px 300px;', 1)
            page.set_content(f"<html><head><style>{CSS} :root{{--h:{h}px}}</style></head><body>{body}</body></html>", wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            page.screenshot(path=str(OUT / f"{name}-{fmt}.png"))
            page.close()
            print("ok", name, fmt)
    b.close()
