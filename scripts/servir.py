"""
garden hermit — servidor para ver o site no seu computador.

    python scripts/servir.py

Abra http://localhost:8000 . A cada recarregada da página, as notas
são lidas de novo: escreva no Obsidian, salve e recarregue o navegador.
Para desligar: Ctrl + C.
"""
import functools
import http.server
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import gerar  # noqa: E402

PORTA = 8000


class Manipulador(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?")[0].endswith("/content/fichas.json"):
            try:
                gerar.gerar()
            except Exception as erro:  # mostra o erro sem derrubar o servidor
                print("erro ao ler as notas:", erro)
        super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    total = gerar.gerar()
    print(f"{total} notas lidas. Site em http://localhost:{PORTA}  (Ctrl + C para parar)")
    manipulador = functools.partial(Manipulador, directory=str(gerar.RAIZ))
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORTA), manipulador) as servidor:
        servidor.serve_forever()
