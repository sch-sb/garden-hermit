# 🌿 garden hermit — o seu jardim digital

**No ar em:** https://sch-sb.github.io/garden-hermit/
**Código e conteúdo:** https://github.com/sch-sb/garden-hermit
**Editar pelo navegador:** https://app.pagescms.org

Este é o seu jardim como um site próprio. O visual é todo seu (dá para mudar qualquer coisa) e o conteúdo fica em arquivos simples que você edita por um formulário na web.

---

## 1. O que tem nesta pasta

| Arquivo / pasta | Para que serve | Você mexe? |
|---|---|---|
| `content/fichas.json` | as fichas (título, canteiro, fonte, link, maturidade, nota) | **sim** — é o seu conteúdo |
| `content/secoes.json` | os canteiros (nome, emoji, descrição, cor, imagens) | **sim** |
| `content/site.json` | título, subtítulo, introdução, "sobre" | **sim** |
| `media/` | imagens que você enviar | **sim** (pelo Pages CMS) |
| `index.html` | a estrutura da página | raramente |
| `assets/style.css` | **o visual**: cores, fontes, tamanhos | quando quiser mudar o design |
| `assets/app.js` | o comportamento (filtros, busca, etiquetas) | não precisa |
| `.pages.yml` | os formulários do Pages CMS | não precisa |

---

## 2. Ver o site no seu computador

O site lê os arquivos `content/*.json`, e o navegador só deixa fazer isso através de um "servidor". Com o Python instalado:

1. Abra o **PowerShell** nesta pasta (no Explorador de Arquivos: clique na barra de endereço, digite `powershell` e Enter).
2. Rode:
   ```powershell
   python -m http.server 8000
   ```
3. Abra no navegador: **http://localhost:8000**
4. Para desligar: volte ao PowerShell e aperte `Ctrl + C`.

> Abrir o `index.html` com dois cliques **não funciona** — aparece "o jardim não abriu". É por isso que precisa do passo 2.

---

## 3. Publicar na internet (grátis, GitHub Pages)

Só precisa fazer uma vez.

1. **Crie uma conta** em https://github.com (gratuita).
2. Clique em **New repository** (botão verde "New").
   - Nome: `garden-hermit` (ou o que quiser)
   - Marque **Public**
   - Clique em **Create repository**.
3. Na página do repositório novo, clique em **uploading an existing file**.
4. **Arraste todo o conteúdo desta pasta** (menos a pasta `.claude`) para a janela. Clique em **Commit changes**.
5. Vá em **Settings → Pages** (menu da esquerda).
   - Em **Source**, escolha **Deploy from a branch**.
   - Branch: **main**, pasta **/ (root)**. Clique **Save**.
6. Espere 1–2 minutos e recarregue. Aparece o endereço do site, algo como
   `https://SEU-USUARIO.github.io/garden-hermit/`

> Quer um endereço próprio, tipo `gardenhermit.com`? Dá para comprar um domínio (~R$ 40/ano em sites como registro.br) e ligar em Settings → Pages → Custom domain.

---

## 4. Editar pelo navegador (Pages CMS)

O Pages CMS é a sua "interface editável": formulários bonitinhos em vez de arquivos.

1. Entre em https://app.pagescms.org
2. Clique em **Sign in with GitHub** e autorize.
3. Escolha o repositório `garden-hermit`.
4. No menu da esquerda aparecem **Fichas**, **Canteiros** e **Sobre o jardim**.
5. Edite o que quiser — por exemplo, abra uma ficha, escreva em **Minha nota** e troque a **Maturidade** para 🌿 broto.
6. Clique em **Save**. Em 1–2 minutos o site publicado atualiza sozinho.

**Para adicionar uma ficha:** em *Fichas*, clique em **Add an item** no fim da lista.

**Para colocar imagens num canteiro (moodboard):** em *Canteiros*, abra o canteiro, vá em **Imagens** → **Add an item** → envie a imagem e escreva uma legenda. Elas aparecem numa faixa quando alguém abre aquele canteiro.

> Se algum formulário der erro na primeira vez, me chame: às vezes o `.pages.yml` precisa de um ajuste pequeno quando conecta com o repositório de verdade.

---

## 5. Mudar o design

Tudo começa no topo de `assets/style.css`:

```css
--papel: #f4efe5;      /* cor do fundo (papel pontilhado) */
--tinta: #2a2522;      /* cor do texto */
--rosa: #dba6a1;       /* Hilma af Klint */
--azul: #93abc8;       /* Hilma af Klint */
--terracota: #bf6648;  /* O'Keeffe */
--violeta: #8d76a5;    /* Redon */
--f-titulo: "Instrument Serif"   /* títulos */
--f-texto: "Courier Prime"       /* texto de máquina de escrever */
--f-mao: "Caveat"                /* anotações à mão */
```

Troque um valor, salve e recarregue a página. Para mudanças maiores (outro layout, animações, modo escuro), é só me pedir.

---

## 6. O que ficou de fora (de propósito)

- **Oferenda** — continua privada no Notion, só para os amigos.
- **Arquivo com os textos completos** — continua privado no Notion.
- **Imagens das moodboards e timelines** — já estão em `media/` (23 imagens) e aparecem quando você abre literatura, natureza, relações, arte e misticismo. As legendas ficaram quase todas vazias: preencha pelo Pages CMS em *Canteiros → Imagens*.
- **7 fichas sem link**: Gal Costa, Hilma af Klint e o artigo da Nexo sobre natureza estão no site sem link; as 4 da piauí sem link foram para a Oferenda.
