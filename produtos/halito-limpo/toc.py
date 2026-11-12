"""Atualiza os números de página do sumário do ebook a partir do PDF gerado."""
import fitz, re
d = fitz.open('out/Halito_Limpo_em_7_Dias.pdf'); m = {}
for i, p in enumerate(d):
    u = re.sub(r'\s+', '', p.get_text()).upper()
    for n in range(1, 9):
        if u.startswith(f'CAPÍTULO{n}'): m.setdefault(n, i + 1)
    if u.startswith('PARAIMPRIMIRECOLAR'): m.setdefault('r', i + 1)
    if 'BÔNUSINCLUSOHÁLITODEEMERGÊNCIA' in u[:60]: m.setdefault('b', i + 1)
print(m)
h = open('ebook.html', encoding='utf-8').read()
it = iter([1, 2, 3, 4, 5, 6, 7, 8, 'r', 'b'])
h = re.sub(r'(<span class="pg">)\d+', lambda mo: mo.group(1) + str(m[next(it)]), h)
h = re.sub(r'Rotina de 1 Página \(pág\. \d+\)', f'Rotina de 1 Página (pág. {m["r"]})', h)
open('ebook.html', 'w', encoding='utf-8').write(h)
