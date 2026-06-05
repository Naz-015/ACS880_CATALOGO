"""Parsea expresiones ABB de frame: '1×D8T + 2×R8i', '2×R10', 'R3'."""
from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class FrameToken:
    codigo: str
    cantidad: int
    posicion: int


_MULT_RE = re.compile(r"^(\d+)\s*[x×]\s*(.+)$", re.IGNORECASE)


def normalize_frame_key(raw: str | None) -> str:
    """Clave canónica para comparar frames entre hojas."""
    if not raw or not str(raw).strip():
        return ""
    tokens = parse_frame_expression(raw)
    return "+".join(f"{t.cantidad}x{t.codigo}" for t in tokens)


def parse_frame_expression(raw: str | None) -> list[FrameToken]:
    if not raw or not str(raw).strip():
        return []

    text = str(raw).strip()
    text = text.replace("×", "x").replace(" ", "")
    parts = [p for p in re.split(r"\+", text) if p]

    tokens: list[FrameToken] = []
    for pos, part in enumerate(parts, start=1):
        m = _MULT_RE.match(part)
        if m:
            qty = int(m.group(1))
            code = m.group(2).strip().upper()
        else:
            qty = 1
            code = part.upper()
        tokens.append(FrameToken(codigo=code, cantidad=qty, posicion=pos))
    return tokens


if __name__ == "__main__":
    ejemplos = ["1×D8T + 2×R8i", "2×R10", "R3"]
    print("Prueba del parser de frames (no conecta a Supabase):\n")
    for raw in ejemplos:
        tokens = parse_frame_expression(raw)
        key = normalize_frame_key(raw)
        print(f"  Entrada: {raw!r}")
        print(f"  Canonico: {key}")
        for t in tokens:
            print(f"    - {t.cantidad}x {t.codigo} (pos {t.posicion})")
        print()
