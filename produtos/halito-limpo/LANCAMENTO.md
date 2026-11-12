# Hálito Limpo em 7 Dias: kit de lançamento

## O que está pronto

| Arquivo | O que é |
|---|---|
| `out/Halito_Limpo_em_7_Dias.pdf` | Ebook principal (51 págs, A5, com o bônus Hálito de Emergência dentro) |
| `out/Kit_30_Dias_Halito_Limpo.pdf` | Order bump (10 págs): checklist de 30 dias, medidor, diário de gatilhos, lista de compras |
| `out/criativos/*.png` | 4 anúncios × feed (1080×1080) + story (1080×1920) |
| `views/public/halito-limpo.ejs` | Página de vendas em jaagendou.app/halito-limpo |
| `ebook.html`, `kit30.html`, `base.css` | Fontes dos PDFs. Edite e rode `python render.py` e depois `python toc.py` + `python render.py ebook` |

## 1. Hotmart (com você)

1. **Produto principal:** "Hálito Limpo em 7 Dias", categoria Saúde e Esportes, **R$ 24,90**, garantia de 7 dias. Na área de membros ou na entrega por e-mail, suba o PDF do ebook.
2. **Order bump:** crie um segundo produto "Kit 30 Dias · Hálito Limpo" a **R$ 14,90**, suba o PDF do kit e configure como order bump do principal.
   Texto sugerido para o bump: *"Sim! Quero o Kit 30 Dias: checklist diário, lista de compras de farmácia e diário de gatilhos para o hábito não se perder depois da primeira semana. Só R$ 14,90."*
3. **Pixel:** em Ferramentas → Pixel de rastreamento, adicione o Pixel 1043008948388147 nos dois produtos (para o Meta contar a compra).
4. **Link do checkout:** copie o link `https://pay.hotmart.com/XXXX` do produto principal.
5. **Pagamento:** deixe o **cartão** em destaque (no Ronco, 95% das compras foram por Pix e o abandono no Pix era alto).

### Atenção: webhook da Hotmart
O webhook do Já Agendou (`hotmartWebhookController`) cria conta de clínica para produtos com "7 dias"/"30 dias" no nome.
Foi adicionado um filtro: produtos com **"halito"** no nome/oferta são ignorados para licença
(ajustável pela env `HOTMART_NON_LICENSE_KEYWORDS`, separada por vírgula). **Mantenha "Hálito" no nome dos dois produtos.**
Esse filtro só vale depois do deploy do código.

## 2. Colocar o link na página

Na Hostinger, adicione a variável de ambiente `HALITO_CHECKOUT_URL` com o link da Hotmart e reinicie o app.
Enquanto ela não existir, os botões levam para a seção de oferta e a página mostra o aviso "Checkout em configuração".

## 3. Textos dos anúncios

> Regra do Meta: não dizer que a pessoa TEM mau hálito ("Você tem mau hálito?" reprova). Fale do problema em terceira pessoa ou de forma geral.

**C1 · O motivo**
- Texto principal: Escova três vezes por dia, usa enxaguante, masca chiclete… e o cheiro volta em uma hora? Isso não é falta de higiene. Na maioria dos casos o mau hálito nasce num lugar que a escova não alcança. O Hálito Limpo em 7 Dias mostra onde é, como testar em 2 minutos e a rotina de 5 minutos por dia que resolve. 👉 Ebook + bônus por R$ 24,90.
- Título: O lugar que a escova não alcança
- Descrição: Método de 7 dias · acesso imediato

**C2 · Mito**
- Texto principal: "Mau hálito vem do estômago." Mito. Os estudos mostram que 8 a 9 em cada 10 casos começam dentro da própria boca, e o lugar nº 1 nem é o dente. No guia Hálito Limpo em 7 Dias você descobre a verdadeira origem e o passo a passo para resolver, com mais 11 mitos e verdades.
- Título: Mau hálito vem do estômago? Mito.
- Descrição: Guia prático · R$ 24,90

**C3 · Disfarçar x resolver**
- Texto principal: Bala, chiclete e enxaguante disfarçam o mau hálito por alguns minutos. Para resolver, você precisa limpar o lugar onde as bactérias do cheiro se escondem. O método de 7 dias ensina como, em 5 minutos por dia, com itens baratos de farmácia.
- Título: Disfarçar é diferente de resolver
- Descrição: 7 dias de garantia

**C4 · Produto**
- Texto principal: Hálito limpo em 7 dias, com 5 minutos por dia. Um guia direto ao ponto: os 3 testes caseiros, as 7 causas mais comuns, o método dia a dia e a rotina de 1 página para colar no espelho. Bônus: Hálito de Emergência, com 12 truques para os próximos 10 minutos. R$ 24,90 · acesso imediato · garantia de 7 dias.
- Título: Hálito Limpo em 7 Dias · R$ 24,90
- Descrição: Ebook + bônus · acesso na hora

URL: `https://jaagendou.app/halito-limpo?utm_source=meta&utm_medium=paid&utm_campaign=halito_teste&utm_content={{ad.name}}`

## 4. Plano de teste (7 dias)

- **Campanha nova e separada** do Ronco: objetivo Vendas, evento Purchase, Advantage+ amplo, Brasil, 18–65+.
- **Orçamento:** R$ 80–100/dia, um conjunto de anúncios, os 4 criativos (feed + story) juntos.
- **Não mexer nos primeiros 3 dias**, a não ser que algo esteja quebrado.

**Contas:** valor médio do pedido ≈ R$ 24,90 + 35% × R$ 14,90 ≈ **R$ 30**, ou ~R$ 27 líquido depois da taxa da Hotmart.

| Métrica | Bom | Ruim (agir) |
|---|---|---|
| CTR do link | > 1,5% | < 0,8% → trocar o gancho dos criativos |
| Clique → checkout (página) | > 8% | < 5% → mexer na página/oferta |
| Checkout → compra | > 30% | < 20% → checar o checkout/Pix |
| CPA | < R$ 27 (lucro) | > R$ 45 com R$ 600 gastos → pausar e repensar |

**Decisão no dia 7 (~R$ 600 gastos):**
- CPA < R$ 27: escalar 20–30% a cada 2 dias.
- CPA entre R$ 27 e R$ 45: dá para melhorar. Criar um upsell (ex.: "Sorriso Branco Seguro", R$ 37) para subir o valor médio e testar criativos em vídeo.
- CPA > R$ 45: trocar o ângulo (ex.: foco em "hálito ao acordar" ou em quem usa aparelho) antes de colocar mais dinheiro.

## 5. Imagens (Kling)

A conta do Kling está com 0 créditos. Quando houver créditos, dá para trocar o círculo da capa e criar anúncios com foto (pessoa sorrindo de perto, close de raspador de língua etc.). As artes atuais funcionam sem foto.
