"""Gera as imagens de capa para a Hotmart (mockup 3D do ebook + bônus + kit).
Saída: out/hotmart/*.png e .jpg
"""
import base64, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).parent
PUB = ROOT.parent.parent / "public" / "halito-limpo"
OUT = ROOT / "out" / "hotmart"
OUT.mkdir(parents=True, exist_ok=True)


def data(name):
    return "data:image/webp;base64," + base64.b64encode((PUB / name).read_bytes()).decode()


EBOOK, BONUS, KIT = data("capa-ebook.webp"), data("capa-bonus.webp"), data("capa-kit.webp")

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,800&family=Inter:wght@600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{width:var(--w);height:var(--h);overflow:hidden;font-family:Inter,sans-serif}
.stage{width:100%;height:100%;position:relative;overflow:hidden;
  background:radial-gradient(circle at 70% 30%, #1E5A6E 0%, #0E2A3B 55%, #081A25 100%)}
.glow{position:absolute;border-radius:50%;filter:blur(10px)}
.book{position:absolute;transform-style:preserve-3d}
.book .front{position:absolute;inset:0;border-radius:3px 10px 10px 3px;overflow:hidden;
  box-shadow:inset 6px 0 10px rgba(255,255,255,.12), inset -2px 0 0 rgba(0,0,0,.2)}
.book .front img{width:100%;height:100%;object-fit:cover;display:block}
.book .front::after{content:'';position:absolute;inset:0;
  background:linear-gradient(105deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,0) 22%, rgba(0,0,0,0) 70%, rgba(0,0,0,.18) 100%)}
.book .spine{position:absolute;top:0;left:0;height:100%;transform-origin:left center;transform:rotateY(90deg)}
.book .pages{position:absolute;top:1.5%;right:0;height:97%;transform-origin:right center;transform:rotateY(90deg);
  background:repeating-linear-gradient(90deg,#f4f1ea 0 2px,#e6e1d6 2px 3px)}
.shadow{position:absolute;border-radius:50%;background:rgba(0,0,0,.55);filter:blur(28px)}
.badge{position:absolute;border-radius:50%;background:#F5B53F;color:#0E2A3B;display:flex;flex-direction:column;
  align-items:center;justify-content:center;text-align:center;font-weight:800;line-height:1.05;
  box-shadow:0 18px 40px rgba(0,0,0,.35);transform:rotate(-10deg)}
.brand{position:absolute;font-family:Fraunces,serif;font-weight:800;color:#fff;display:flex;align-items:center;gap:14px}
.brand i{border-radius:50%;background:#2BB39A;display:inline-block}
"""


def book(img, x, y, w, rot, thick, z=1):
    """Livro com espessura (páginas empilhadas à direita) e sombra no chão."""
    h = w * 1.4189  # proporção A5
    layers = ", ".join(f"{i}px {i*0.6:.1f}px 0 {'#F3F0E8' if i % 2 else '#E2DDD2'}" for i in range(1, int(thick) + 1))
    return f"""
<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;z-index:{z};transform:rotate({rot}deg)">
  <div style="position:absolute;left:6%;right:-4%;bottom:-5%;height:9%;border-radius:50%;background:rgba(0,0,0,.6);filter:blur({w*0.06:.0f}px)"></div>
  <div style="position:absolute;inset:0;border-radius:4px 10px 10px 4px;box-shadow:{layers}, {thick+6}px {thick+16}px 40px rgba(0,0,0,.45)"></div>
  <div style="position:absolute;inset:0;border-radius:4px 10px 10px 4px;overflow:hidden">
    <img src="{img}" style="width:100%;height:100%;object-fit:cover;display:block">
    <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.35) 0,rgba(255,255,255,.18) 2.2%,rgba(0,0,0,.12) 4%,rgba(0,0,0,0) 7%,rgba(255,255,255,.07) 40%,rgba(0,0,0,.12) 100%)"></div>
  </div>
</div>"""


def badge(x, y, d, top, big, s):
    return (f'<div class="badge" style="left:{x}px;top:{y}px;width:{d}px;height:{d}px;z-index:9">'
            f'<span style="font-size:{20*s}px;letter-spacing:.08em">{top}</span>'
            f'<span style="font-family:Fraunces,serif;font-size:{38*s}px;margin-top:{4*s}px">{big}</span></div>')


def scene(W, H, with_kit):
    s = W / 1200
    parts = [f'<div class="glow" style="left:{330*s}px;top:{140*s}px;width:{620*s}px;height:{620*s}px;background:rgba(43,179,154,.25)"></div>']
    if with_kit:
        parts.append(book(EBOOK, 150*s, 330*s, 300*s, -9, 10*s, 1))
        parts.append(book(BONUS, 760*s, 350*s, 280*s, 9, 8*s, 2))
        parts.append(book(KIT, 375*s, 170*s, 440*s, -2, 16*s, 3))
        parts.append(badge(830*s, 120*s, 210*s, "ADICIONE O", "KIT 30<br>DIAS", s))
    else:
        parts.append(book(BONUS, 700*s, 360*s, 320*s, 8, 9*s, 1))
        parts.append(book(EBOOK, 290*s, 140*s, 480*s, -4, 18*s, 3))
        parts.append(badge(110*s, 170*s, 210*s, "+ BÔNUS", "INCLUSO", s))
    parts.append(f'<div class="brand" style="left:{60*s}px;bottom:{50*s}px;font-size:{34*s}px;z-index:9"><i style="width:{20*s}px;height:{20*s}px"></i>Hálito Limpo</div>')
    return f'<div class="stage">{"".join(parts)}</div>'


JOBS = [
    ("capa-hotmart-produto", 1200, 1200, False),   # imagem do produto principal
    ("capa-hotmart-kit30", 1200, 1200, True),      # imagem do order bump
]

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    for name, W, H, kit in JOBS:
        page = b.new_page(viewport={"width": W, "height": H})
        page.set_content(f"<html><head><style>{CSS}:root{{--w:{W}px;--h:{H}px}}</style></head><body>{scene(W, H, kit)}</body></html>",
                         wait_until="networkidle")
        page.evaluate("document.fonts.ready")
        png = OUT / f"{name}.png"
        page.screenshot(path=str(png))
        page.close()
        from PIL import Image
        im = Image.open(png).convert("RGB")
        im.save(OUT / f"{name}.jpg", quality=92)
        im.resize((600, 600), Image.LANCZOS).save(OUT / f"{name}-600.jpg", quality=92)
        print("ok", name)
    b.close()
