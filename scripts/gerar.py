"""
garden hermit — gera content/fichas.json a partir das notas em notas/*.md

Cada nota é um arquivo Markdown do Obsidian:

    ---
    canteiro: natureza
    fonte: "The New Yorker"
    link: "https://..."
    maturidade: semente        # semente | broto | arvore
    titulo: "..."              # opcional: se vazio, o título é o nome do arquivo

No acervo, as fichas aparecem agrupadas por canteiro (na ordem de
content/secoes.json) e em ordem alfabética dentro de cada canteiro.

Imagens do mural: mural/<canteiro>/*.jpg|png|...  — a pasta é o canteiro,
o nome do arquivo é a legenda ("01 Odilon Redon.png" → "Odilon Redon";
nomes automáticos como "Pasted image…" ou só números ficam sem legenda).
    ---
    o que você pensou sobre isso… pode ter [[links para outras notas]].

Roda sozinho no GitHub a cada envio (veja .github/workflows/jardim.yml).
Para rodar no computador:  python scripts/gerar.py
"""
import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.parse import quote

RAIZ = Path(__file__).resolve().parent.parent
PASTA_NOTAS = RAIZ / "notas"
PASTA_MURAL = RAIZ / "mural"
EXT_IMAGEM = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"}
NOME_AUTOMATICO = re.compile(
    r"^(pasted image|image|img|dsc|screenshot|screen shot|captura de tela|untitled|"
    r"photo|whatsapp image|sem t[ií]tulo)(?=[\s_\-.\d(]|$)|^[\d\s_\-().]*$",
    re.IGNORECASE,
)
SAIDA = RAIZ / "content" / "fichas.json"

WIKILINK = re.compile(r"(?<!!)\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]")


def sem_acento(texto):
    return "".join(c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn")


def slug(texto):
    s = sem_acento(texto).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "nota"


def limpar_valor(valor):
    valor = valor.strip()
    if len(valor) >= 2 and valor[0] == valor[-1] and valor[0] in "\"'":
        valor = valor[1:-1].replace('\\"', '"').replace("\\\\", "\\")
    return valor


def ler_nota(caminho):
    texto = caminho.read_text(encoding="utf-8").replace("\r\n", "\n")
    props, corpo = {}, texto
    if texto.startswith("---\n"):
        fim = texto.find("\n---", 4)
        if fim != -1:
            bloco = texto[4:fim]
            corpo = texto[fim + 4:].lstrip("\n")
            chave = None
            for linha in bloco.split("\n"):
                if re.match(r"^\s+-\s*", linha) and chave:  # item de lista
                    item = limpar_valor(re.sub(r"^\s+-\s*", "", linha))
                    if not isinstance(props.get(chave), list):
                        props[chave] = []
                    props[chave].append(item)
                    continue
                m = re.match(r"^([A-Za-zÀ-ú_][\wÀ-ú -]*):\s*(.*)$", linha)
                if m:
                    chave = m.group(1).strip().lower()
                    props[chave] = limpar_valor(m.group(2))
    return props, corpo.strip()


def texto_de(props, chave):
    valor = props.get(chave, "")
    if isinstance(valor, list):
        valor = valor[0] if valor else ""
    return str(valor).strip()


def normalizar_maturidade(valor):
    v = re.sub(r"[^a-z]", "", sem_acento(valor).lower())
    return v if v in ("semente", "broto", "arvore") else "semente"


def chave_natural(nome):
    """ordena '2' antes de '10'"""
    return [int(p) if p.isdigit() else p.lower() for p in re.split(r"(\d+)", nome)]


def legenda_do_arquivo(stem):
    texto = re.sub(r"^\d+[\s._\-]*", "", stem).strip()  # tira "01 ", "02-", ...
    if not texto or NOME_AUTOMATICO.match(texto):
        return ""
    return texto


def ler_murais():
    murais = {}
    if not PASTA_MURAL.is_dir():
        return murais
    for pasta in sorted(PASTA_MURAL.iterdir()):
        if not pasta.is_dir():
            continue
        imagens = [a for a in pasta.iterdir()
                   if a.is_file() and a.suffix.lower() in EXT_IMAGEM and not a.name.startswith(("_", "."))]
        imagens.sort(key=lambda a: chave_natural(a.name))
        if imagens:
            murais[slug(pasta.name)] = [
                {
                    "imagem": quote(a.relative_to(RAIZ).as_posix()),
                    "legenda": legenda_do_arquivo(a.stem),
                }
                for a in imagens
            ]
    return murais


def gerar():
    notas = []
    for caminho in sorted(PASTA_NOTAS.glob("*.md")):
        if caminho.name.startswith("_"):
            continue
        props, corpo = ler_nota(caminho)
        notas.append({
            "arquivo": caminho.stem,
            "nome": texto_de(props, "titulo") or caminho.stem,
            "secao": slug(texto_de(props, "canteiro")) if texto_de(props, "canteiro") else "",
            "fonte": texto_de(props, "fonte"),
            "link": texto_de(props, "link"),
            "maturidade": normalizar_maturidade(texto_de(props, "maturidade")),
            "nota": corpo,
        })

    # ordem: por canteiro (como no índice) e alfabética dentro de cada um
    try:
        secoes = json.loads((RAIZ / "content" / "secoes.json").read_text(encoding="utf-8"))["secoes"]
        ordem_canteiro = {s["slug"]: i for i, s in enumerate(secoes)}
    except (OSError, ValueError, KeyError):
        ordem_canteiro = {}
    notas.sort(key=lambda n: (
        ordem_canteiro.get(n["secao"], len(ordem_canteiro)),
        sem_acento(n["nome"]).lower().lstrip("“\"'‘"),
    ))

    # identificadores únicos e apelidos para resolver [[links]]
    usados, apelidos = set(), {}
    for n in notas:
        base = slug(n["arquivo"])
        ident, k = base, 2
        while ident in usados:
            ident, k = f"{base}-{k}", k + 1
        usados.add(ident)
        n["id"] = ident
        apelidos[n["arquivo"].lower()] = ident
        apelidos.setdefault(n["nome"].lower(), ident)

    # conexões: quem esta nota cita, e quem cita esta nota
    citada = {n["id"]: [] for n in notas}
    for n in notas:
        alvos = []
        for alvo in WIKILINK.findall(n["nota"]):
            ident = apelidos.get(alvo.strip().lower())
            if ident and ident != n["id"] and ident not in alvos:
                alvos.append(ident)
        n["liga"] = alvos
        for ident in alvos:
            citada[ident].append(n["id"])
    for n in notas:
        n["citada"] = citada[n["id"]]
        del n["arquivo"]

    SAIDA.parent.mkdir(exist_ok=True)
    SAIDA.write_text(
        json.dumps({"fichas": notas, "apelidos": apelidos, "murais": ler_murais()},
                   ensure_ascii=False, indent=1),
        encoding="utf-8",
    )
    return len(notas)


if __name__ == "__main__":
    total = gerar()
    print(f"{total} notas → {SAIDA.relative_to(RAIZ)}")
    sys.exit(0)
