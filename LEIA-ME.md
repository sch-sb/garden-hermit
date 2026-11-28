# 🌿 garden hermit — o seu jardim digital

**No ar em:** https://sch-sb.github.io/garden-hermit/
**Código e conteúdo:** https://github.com/sch-sb/garden-hermit

Você escreve no **Obsidian**; o site lê as suas notas e se publica sozinho.

---

## 1. O que tem nesta pasta

| Arquivo / pasta | Para que serve | Você mexe? |
|---|---|---|
| `notas/` | **as fichas** — uma nota do Obsidian por ficha | **sim, é aqui que você escreve** |
| `media/` | imagens (as coladas no Obsidian vêm para cá) | sim |
| `modelos/ficha.md` | modelo para criar fichas novas | se quiser |
| `comece aqui.md` | guia rápido dentro do Obsidian | — |
| `content/secoes.json` | os canteiros (nome, cor, descrição, imagens do mural) | às vezes |
| `content/site.json` | título e textos da capa e do rodapé | às vezes |
| `assets/style.css` | **o visual**: cores, fontes, tamanhos | quando quiser mudar o design |
| `index.html`, `assets/app.js` | estrutura e comportamento do site | não precisa |
| `scripts/` | juntam as notas num índice / servidor local | não precisa |
| `.github/workflows/jardim.yml` | o robô que publica o site a cada envio | não precisa |

> `content/fichas.json` não existe no GitHub de propósito: é gerado a partir das notas, no seu computador e pelo robô.

---

## 2. Escrever no Obsidian

**Primeira vez**
1. Instale o Obsidian (grátis): https://obsidian.md
2. Escolha **Abrir pasta como cofre** e selecione `F:\digi-garden`.
3. Abra a nota **comece aqui**.

**Uma ficha é assim**

```markdown
---
canteiro: natureza
fonte: "The New Yorker"
link: "https://..."
maturidade: broto
---

O que eu pensei lendo isso. Conversa com [[Fungi, Folklore, and Fairyland]].
```

- **O título** é o nome do arquivo. (Algumas notas antigas têm a propriedade `titulo`; se tiver, é ela que aparece no site.)
- **canteiro**: saúde · literatura · sociedade · natureza · relações · arte · universo · misticismo
- **maturidade**: semente · broto · arvore
- **`[[nome de outra nota]]`** vira link no site e aparece em "conversa com" / "citada em".
- Formatação que o site entende: parágrafos, `**negrito**`, `*itálico*`, `==marca-texto==`, `> citação`, `- listas`, `[texto](link)` e imagens coladas.
- **Nova ficha:** `Ctrl + N`, dê o nome, depois `Ctrl + P` → **Inserir modelo** → *ficha*.
- Só a pasta `notas/` vai para o site. Notas que começam com `_` são ignoradas pelo site — mas o repositório é público, então não guarde nada secreto ali.

---

## 3. Publicar automaticamente (plugin Obsidian Git)

Faça uma vez:
1. No Obsidian: **Configurações → Plugins da comunidade → Ativar plugins da comunidade**.
2. **Procurar** → digite **Git** (o de *Vinzent*) → **Instalar** → **Ativar**.
3. Nas opções do plugin **Git**:
   - **Auto commit-and-sync interval**: `10` (envia sozinho a cada 10 minutos)
   - **Pull on startup**: ligado (busca o que mudou na web ao abrir)

Para enviar na hora: `Ctrl + P` → **Git: Commit-and-sync**.

Depois de cada envio, o robô do GitHub junta as notas e publica — leva 1–2 minutos. Dá para acompanhar em https://github.com/sch-sb/garden-hermit/actions

---

## 4. Ver o site no seu computador

Com o PowerShell aberto nesta pasta:

```powershell
python scripts/servir.py
```

Abra **http://localhost:8000**. Escreva no Obsidian, salve, recarregue o navegador — a mudança já aparece. Para desligar: `Ctrl + C`.

---

## 5. Editar pelo celular (plano B: Pages CMS)

https://app.pagescms.org → entre com o GitHub → **garden-hermit**.
- **Fichas (notas)** edita as mesmas notas do Obsidian (por formulário).
- **Canteiros** e **Sobre o jardim** editam os canteiros, as imagens do mural e os textos da capa.

Se editar pela web, o Obsidian Git busca as mudanças ao abrir (ou `Ctrl + P` → **Git: Pull**).

---

## 6. Mudar o design

Tudo começa no topo de `assets/style.css`:

```css
--papel: #f4efe5;      /* cor do fundo (papel pontilhado) */
--tinta: #2a2522;      /* cor do texto */
--rosa: #dba6a1;       /* Hilma af Klint */
--azul: #93abc8;       /* Hilma af Klint */
--terracota: #bf6648;  /* O'Keeffe */
--violeta: #8d76a5;    /* Redon */
--f-marca: "IM Fell English"     /* o "garden hermit" da capa */
--f-titulo: "Instrument Serif"   /* títulos */
--f-texto: "Courier Prime"       /* texto de máquina de escrever */
--f-mao: "Caveat"                /* anotações à mão */
```

O mural de imagens: `--colunas` e `--vao` na parte "moodboard" do mesmo arquivo.

---

## 7. O que ficou de fora (de propósito)

- **Oferenda** e o **arquivo com os textos completos** continuam privados no Notion.
- 3 fichas sem link do original: Gal Costa, Hilma af Klint e o artigo da Nexo sobre natureza.
