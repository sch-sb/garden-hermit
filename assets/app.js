/* =========================================================
   garden hermit — comportamento do site
   Lê os arquivos em content/ e monta a página.
   Você não precisa mexer aqui para editar o conteúdo:
   edite os arquivos .json (ou use o Pages CMS).
   ========================================================= */

const MATURIDADES = {
  semente: { icone: "🌱", nome: "semente", desc: "guardei, ainda não digeri" },
  broto:   { icone: "🌿", nome: "broto",   desc: "comecei a pensar sobre" },
  arvore:  { icone: "🌳", nome: "árvore",  desc: "virou ideia minha" },
};

const CORES = {
  rosa: "--rosa", azul: "--azul", ocre: "--ocre", salvia: "--salvia",
  terracota: "--terracota", areia: "--areia", violeta: "--violeta", noite: "--noite",
  tela: "--tela",
};

/* símbolos dos canteiros — formas de Hilma af Klint, o olho de Redon, a pétala de O'Keeffe */
const GLIFOS = [
  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="currentColor"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M12 12m0-2a2 2 0 1 1-2 2a4 4 0 1 1 4 4a6.5 6.5 0 1 1-6.5-6.5a9 9 0 1 1 9 9" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M12 3 21 20H3Z" fill="currentColor"/></svg>',
  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 3v18M3 12h18" stroke="currentColor" stroke-width="1.5"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M15 3a9 9 0 1 0 6 13a7 7 0 1 1-6-13Z" fill="currentColor"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M2 12q10-10 20 0q-10 10-20 0Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M12 21C5 15 5 7 12 3c7 4 7 12 0 18Z" fill="currentColor"/><path d="M12 21V8" stroke="var(--papel)" stroke-width="1.2"/></svg>',
  '<svg viewBox="0 0 24 24"><rect x="2.5" y="3.5" width="19" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 21h8M12 16.5V21" stroke="currentColor" stroke-width="1.5"/><path d="M12 13.2 8.6 9.9a1.9 1.9 0 0 1 3.4-1.6 1.9 1.9 0 0 1 3.4 1.6Z" fill="currentColor"/></svg>',
];

/* qual símbolo cada canteiro usa (canteiros novos ganham um automaticamente) */
const GLIFO_DE = {
  saude: 0, literatura: 1, relacoes: 3, sociedade: 4,
  universo: 2, misticismo: 5, arte: 6, natureza: 7,
  "eu-meu-computador": 8,
};

/* pequena inclinação "feita à mão", sempre igual para a mesma ficha */
function inclinacao(i, max = 1.4) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return ((x - Math.floor(x)) * 2 - 1) * max;
}

const estado = { secao: null, maturidade: null, busca: "", vista: "tudo" };
let site, secoes, fichas, apelidos = {}, indicePorId = {};

const $ = (id) => document.getElementById(id);

function esc(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function romano(n) {
  const tabela = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let r = "";
  for (const [v, s] of tabela) while (n >= v) { r += s; n -= v; }
  return r;
}

function corDe(secao) {
  return `var(${CORES[secao?.cor] || "--musgo"})`;
}

function semAcento(t) {
  return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/* ---------- notas em Markdown (o que você escreve no Obsidian) ---------- */

function emLinha(t) {
  // t já vem escapado; aqui só transformamos as marcações simples
  return t
    .replace(/!\[\[([^\]|]+?)(?:\|[^\]]*)?\]\]/g, (_, arq) =>
      `<img class="nota-img" src="media/${encodeURI(arq.trim())}" alt="" loading="lazy">`)
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (_, alvo, rotulo) => {
      const chave = alvo.trim().replace(/&#39;/g, "'").replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").toLowerCase();
      const id = apelidos[chave];
      const texto = (rotulo || alvo).trim();
      return id ? `<button type="button" class="wikilink" data-id="${id}">${texto}</button>`
                : `<span class="wikilink wikilink--vazio" title="ainda não existe">${texto}</span>`;
    })
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/(^|[^_\w])_([^_\n]+)_/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/==([^=]+)==/g, "<mark>$1</mark>");
}

function markdown(texto) {
  return esc(texto).split(/\n{2,}/).map((bloco) => {
    const linhas = bloco.split("\n");
    if (linhas.every((l) => l.startsWith("&gt;"))) {
      return `<blockquote>${emLinha(linhas.map((l) => l.replace(/^&gt;\s?/, "")).join("<br>"))}</blockquote>`;
    }
    if (linhas.every((l) => /^\s*[-*]\s/.test(l))) {
      return `<ul>${linhas.map((l) => `<li>${emLinha(l.replace(/^\s*[-*]\s/, ""))}</li>`).join("")}</ul>`;
    }
    const titulo = bloco.match(/^#{1,6}\s+(.*)$/);
    if (titulo && linhas.length === 1) return `<h4>${emLinha(titulo[1])}</h4>`;
    if (/^(-{3,}|\*{3,})$/.test(bloco.trim())) return "<hr>";
    return `<p>${emLinha(linhas.join("<br>"))}</p>`;
  }).join("");
}

function textoPuro(md) {
  return String(md || "")
    .replace(/!\[\[[^\]]*\]\]/g, "")
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (_, a, r) => r || a)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`=>#]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function carregar(caminho) {
  const resposta = await fetch(caminho, { cache: "no-cache" });
  if (!resposta.ok) throw new Error(`não consegui ler ${caminho}`);
  return resposta.json();
}

/* ---------- capa ---------- */

function montarCapa() {
  document.title = `${site.titulo} — jardim digital`;
  $("titulo").textContent = site.titulo;
  $("subtitulo").textContent = site.subtitulo || "";
  $("subtitulo").hidden = !site.subtitulo;
  $("intro").textContent = site.intro || "";
  $("intro").hidden = !site.intro;
  $("rotulo-capa").textContent = site.desde ? `jardim digital · desde ${site.desde}` : "jardim digital";
}

/* ---------- canteiros ---------- */

function montarCanteiros() {
  $("canteiros").innerHTML = secoes.map((s, i) => {
    const n = fichas.filter((f) => f.secao === s.slug).length;
    return `
      <li class="canteiro" style="--cor:${corDe(s)}">
        <button type="button" data-secao="${esc(s.slug)}" aria-pressed="false">
          <span class="canteiro__glifo" aria-hidden="true">${GLIFOS[GLIFO_DE[s.slug] ?? i % GLIFOS.length]}</span>
          <span class="canteiro__num">${romano(i + 1)}.</span>
          <span class="canteiro__nome">${esc(s.nome)}</span>
          <span class="canteiro__pontos" aria-hidden="true"></span>
          <span class="canteiro__conta">${n || "pousio"}</span>
          <span class="canteiro__desc">${esc(s.descricao)}</span>
        </button>
      </li>`;
  }).join("");

  $("canteiros").addEventListener("click", (e) => {
    const botao = e.target.closest("button[data-secao]");
    if (!botao) return;
    const slug = botao.dataset.secao;
    const abrindo = estado.secao !== slug;
    irPara(abrindo ? `canteiro/${slug}` : "");
    if (abrindo) $("acervo").scrollIntoView({ behavior: "smooth" });
  });
}

/* ---------- filtros ---------- */

function montarChips() {
  const opcoes = [["", "todas"], ...Object.entries(MATURIDADES).map(([k, m]) => [k, `${m.icone} ${m.nome}`])];
  $("chips-maturidade").innerHTML = opcoes
    .map(([k, rotulo]) => `<button class="chip" type="button" data-mat="${k}" aria-pressed="${k === "" ? "true" : "false"}">${esc(rotulo)}</button>`)
    .join("");

  $("chips-maturidade").addEventListener("click", (e) => {
    const chip = e.target.closest("button[data-mat]");
    if (!chip) return;
    estado.maturidade = chip.dataset.mat || null;
    desenhar();
  });

  $("busca").addEventListener("input", (e) => {
    estado.busca = e.target.value;
    desenhar();
  });

  $("vistas").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-vista]");
    if (!b || !estado.secao) return;
    const v = b.dataset.vista;
    irPara(`canteiro/${estado.secao}${v === "tudo" ? "" : `/${v}`}`);
  });

  $("limpar").addEventListener("click", () => {
    estado.maturidade = null;
    estado.busca = "";
    $("busca").value = "";
    irPara("");
  });
}

/* ---------- fichas ---------- */

function filtradas() {
  const q = semAcento(estado.busca.trim());
  return fichas.filter((f) =>
    (!estado.secao || f.secao === estado.secao) &&
    (!estado.maturidade || f.maturidade === estado.maturidade) &&
    (!q || semAcento(`${f.nome} ${f.fonte} ${f.nota}`).includes(q))
  );
}

function desenhar() {
  const secaoAtual = secoes.find((s) => s.slug === estado.secao);
  const lista = filtradas();

  document.querySelectorAll("#canteiros button").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.secao === estado.secao)));
  document.querySelectorAll("#chips-maturidade button").forEach((b) =>
    b.setAttribute("aria-pressed", String((b.dataset.mat || null) === estado.maturidade)));

  const algumFiltro = estado.secao || estado.maturidade || estado.busca;
  $("limpar").hidden = !algumFiltro;
  $("resumo-filtro").textContent = secaoAtual
    ? `canteiro ${secaoAtual.nome} · ${lista.length} de ${fichas.length}`
    : `${lista.length} de ${fichas.length} fichas`;

  // galeria de imagens do canteiro escolhido
  const imagens = secaoAtual?.imagens || [];
  $("galeria").hidden = imagens.length === 0;
  // escolha "tudo · fichas · mural" — só em canteiros com imagens e com fichas
  const temFichas = secaoAtual && fichas.some((f) => f.secao === secaoAtual.slug);
  const podeEscolher = Boolean(imagens.length && temFichas);
  const vista = podeEscolher ? estado.vista : "tudo";
  $("vistas").hidden = !podeEscolher;
  $("vistas").style.setProperty("--cor", corDe(secaoAtual));
  document.querySelectorAll("#vistas button").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.vista === vista)));
  $("ferramentas").hidden = vista === "mural";
  if (vista === "fichas") $("galeria").hidden = true;

  // moodboard: mural vertical (tipo Pinterest), imagens na proporção original
  $("galeria").innerHTML = imagens.map((img) => {
    const src = typeof img === "string" ? img : img.imagem;
    const leg = typeof img === "string" ? "" : img.legenda || "";
    return `<figure class="quadro"><img src="${esc(src)}" alt="${esc(leg || `imagem do canteiro ${secaoAtual.nome}`)}" loading="lazy">${leg ? `<figcaption>${esc(leg)}</figcaption>` : ""}</figure>`;
  }).join("");

  $("fichas").innerHTML = lista.map((f, i) => {
    const s = secoes.find((x) => x.slug === f.secao);
    const m = MATURIDADES[f.maturidade] || MATURIDADES.semente;
    const idx = fichas.indexOf(f);
    return `
      <li class="ficha" style="--cor:${corDe(s)};--inclina:${inclinacao(idx).toFixed(2)}deg;--fita:${inclinacao(idx + 50, 4).toFixed(1)}deg;animation-delay:${Math.min(i, 20) * 18}ms">
        <button type="button" data-i="${idx}">
          <span class="ficha__num"><span>${esc(s?.nome || "")}</span></span>
          <span class="ficha__titulo">${esc(f.nome)}</span>
          <span class="ficha__fonte">${esc(f.fonte)}</span>
          ${f.nota ? (() => { const t = textoPuro(f.nota); return `<span class="ficha__nota">${esc(t.length > 140 ? t.slice(0, 140) + "…" : t)}</span>`; })() : ""}
          ${f.liga?.length || f.citada?.length ? `<span class="ficha__conexoes" aria-label="conexões">↔ ${(f.liga?.length || 0) + (f.citada?.length || 0)}</span>` : ""}
          <span class="maturidade">${m.icone} ${m.nome}</span>
        </button>
      </li>`;
  }).join("");

  $("fichas").hidden = vista === "mural";
  const vazio = $("vazio");
  vazio.hidden = lista.length > 0 || vista === "mural";
  const canteiroSemFichas = secaoAtual && !fichas.some((f) => f.secao === secaoAtual.slug);
  vazio.textContent = canteiroSemFichas
    ? (imagens.length ? "ainda sem fichas — por enquanto, só imagens." : "este canteiro está em pousio — ainda nada plantado aqui.")
    : "nenhuma ficha encontrada com esses filtros.";
}

/* ---------- ficha aberta ---------- */

function abrirFicha(i) {
  const f = fichas[i];
  const s = secoes.find((x) => x.slug === f.secao);
  const m = MATURIDADES[f.maturidade] || MATURIDADES.semente;
  const d = $("dialogo");
  d.style.setProperty("--cor", corDe(s));
  $("d-num").textContent = s?.nome || "";
  $("d-titulo").textContent = f.nome;
  $("d-fonte").textContent = f.fonte;
  const nota = $("d-nota");
  if (f.nota) nota.innerHTML = markdown(f.nota);
  else nota.textContent = "ainda sem nota — esta semente está só guardada.";
  nota.classList.toggle("sem-nota", !f.nota);

  const lista = (ids) => ids.map((id) => {
    const alvo = fichas[indicePorId[id]];
    return alvo ? `<button type="button" class="wikilink" data-id="${esc(id)}">${esc(alvo.nome)}</button>` : "";
  }).join("");
  const conexoes = [];
  if (f.liga?.length) conexoes.push(`<p><span class="mao">conversa com</span> ${lista(f.liga)}</p>`);
  if (f.citada?.length) conexoes.push(`<p><span class="mao">citada em</span> ${lista(f.citada)}</p>`);
  $("d-conexoes").innerHTML = conexoes.join("");
  $("d-conexoes").hidden = conexoes.length === 0;
  $("d-mat").textContent = `${m.icone} ${m.nome} — ${m.desc}`;
  const link = $("d-link");
  link.hidden = !f.link;
  if (f.link) link.href = f.link;
  if (!d.open) d.showModal();
  d.scrollTop = 0;
}

/* ---------- rodapé ---------- */

function montarRodape() {
  $("legenda").innerHTML = Object.values(MATURIDADES)
    .map((m) => `<li>${m.icone} <b>${m.nome}</b> — ${m.desc}</li>`)
    .join("");
  $("sobre").textContent = site.sobre || "";
  $("leituras").innerHTML = (site.leituras || []).length
    ? "leia mais: " + site.leituras.map((l) => `<a href="${esc(l.link)}" target="_blank" rel="noopener">${esc(l.nome)}</a>`).join(" · ")
    : "";
}

/* ---------- endereço (#canteiro/natureza) ---------- */

function irPara(hash) {
  if (location.hash.slice(1) === hash) lerEndereco();
  else location.hash = hash;
}

function lerEndereco() {
  const [tipo, valor, modo] = location.hash.slice(1).split("/");
  estado.secao = tipo === "canteiro" && secoes.some((s) => s.slug === valor) ? valor : null;
  estado.vista = ["mural", "fichas"].includes(modo) ? modo : "tudo";
  desenhar();
}

/* ---------- início ---------- */

async function iniciar() {
  try {
    let indice;
    [site, { secoes }, indice] = await Promise.all([
      carregar("content/site.json"),
      carregar("content/secoes.json"),
      carregar("content/fichas.json"),
    ]);
    fichas = indice.fichas;
    apelidos = indice.apelidos || {};
    fichas.forEach((f, i) => { if (f.id) indicePorId[f.id] = i; });
  } catch (erro) {
    document.querySelector("main").innerHTML =
      `<p class="vazio">o jardim não abriu: ${esc(erro.message)}.<br>
       Se você abriu o arquivo direto (file://), use um servidor local — veja o LEIA-ME.</p>`;
    return;
  }

  montarCapa();
  montarCanteiros();
  montarChips();
  montarRodape();

  $("fichas").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]");
    if (b) abrirFicha(Number(b.dataset.i));
  });
  $("dialogo").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) return e.currentTarget.close();
    const link = e.target.closest(".wikilink[data-id]");
    if (link && link.dataset.id in indicePorId) abrirFicha(indicePorId[link.dataset.id]);
  });

  window.addEventListener("hashchange", lerEndereco);
  lerEndereco();
}

iniciar();
