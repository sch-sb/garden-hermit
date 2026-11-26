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
];

/* qual símbolo cada canteiro usa (canteiros novos ganham um automaticamente) */
const GLIFO_DE = {
  saude: 0, literatura: 1, relacoes: 3, sociedade: 4,
  universo: 2, misticismo: 5, arte: 6, natureza: 7,
};

/* pequena inclinação "feita à mão", sempre igual para a mesma ficha */
function inclinacao(i, max = 1.4) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return ((x - Math.floor(x)) * 2 - 1) * max;
}

const estado = { secao: null, maturidade: null, busca: "" };
let site, secoes, fichas;

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

  const conta = (m) => fichas.filter((f) => f.maturidade === m).length;
  $("contagem").innerHTML =
    `<b>${fichas.length}</b> fichas em <b>${secoes.length}</b> canteiros — ` +
    `🌱 ${conta("semente")} · 🌿 ${conta("broto")} · 🌳 ${conta("arvore")}`;
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
          <span class="ficha__num"><span class="mao">nº ${idx + 1}</span><span>${esc(s?.nome || "")}</span></span>
          <span class="ficha__titulo">${esc(f.nome)}</span>
          <span class="ficha__fonte">${esc(f.fonte)}</span>
          ${f.nota ? `<span class="ficha__nota">${esc(f.nota.length > 140 ? f.nota.slice(0, 140) + "…" : f.nota)}</span>` : ""}
          <span class="maturidade">${m.icone} ${m.nome}</span>
        </button>
      </li>`;
  }).join("");

  const vazio = $("vazio");
  vazio.hidden = lista.length > 0;
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
  $("d-num").textContent = `nº ${i + 1} — ${s?.nome || ""}`;
  $("d-titulo").textContent = f.nome;
  $("d-fonte").textContent = f.fonte;
  const nota = $("d-nota");
  nota.textContent = f.nota || "ainda sem nota — esta semente está só guardada.";
  nota.classList.toggle("sem-nota", !f.nota);
  $("d-mat").textContent = `${m.icone} ${m.nome} — ${m.desc}`;
  const link = $("d-link");
  link.hidden = !f.link;
  if (f.link) link.href = f.link;
  d.showModal();
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
  const [tipo, valor] = location.hash.slice(1).split("/");
  estado.secao = tipo === "canteiro" && secoes.some((s) => s.slug === valor) ? valor : null;
  desenhar();
}

/* ---------- início ---------- */

async function iniciar() {
  try {
    [site, { secoes }, { fichas }] = await Promise.all([
      carregar("content/site.json"),
      carregar("content/secoes.json"),
      carregar("content/fichas.json"),
    ]);
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
    if (e.target === e.currentTarget) e.currentTarget.close();
  });

  window.addEventListener("hashchange", lerEndereco);
  lerEndereco();
}

iniciar();
