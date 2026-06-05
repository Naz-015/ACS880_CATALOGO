"""Prueba conexión a Supabase. Uso: python etl/test_connection.py"""
from __future__ import annotations

import socket
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from load_pilot_excel import ROOT, get_conn  # noqa: E402


def check_dns(host: str) -> None:
    print(f"DNS: {host}")
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror as e:
        print(f"  ERROR: {e}")
        return
    v4 = [i for i in infos if i[0] == socket.AF_INET]
    v6 = [i for i in infos if i[0] == socket.AF_INET6]
    print(f"  IPv4: {len(v4)} registro(s)")
    print(f"  IPv6: {len(v6)} registro(s)")
    if not v4 and v6:
        print("  → Solo IPv6: en Windows usa Session pooler (puerto 6543), no db.*.supabase.co")


def main():
    from dotenv import load_dotenv
    import os

    env_path = ROOT / ".env"
    load_dotenv(env_path)

    host = os.environ.get("DB_HOST", "").strip()
    port = os.environ.get("DB_PORT", "5432").strip()
    user = os.environ.get("DB_USER", "").strip()
    password = os.environ.get("DB_PASSWORD", "")

    print(f"Archivo .env: {env_path}")
    print(f"  DB_HOST={host or '(vacío)'}")
    print(f"  DB_PORT={port}")
    print(f"  DB_USER={user or '(vacío → usará postgres)'}")
    print(f"  DB_PASSWORD={'(vacía)' if not password else f'({len(password.strip())} caracteres)'}")

    if host:
        check_dns(host)

    if not user.startswith("postgres."):
        print(
            "\nAVISO: con Session pooler el usuario suele ser:\n"
            "  postgres.ylzydydcpdgshfaprpup\n"
            "  (postgres + punto + ID del proyecto)\n"
        )

    print("\nConectando a PostgreSQL...")
    try:
        conn = get_conn()
    except Exception as exc:
        err = str(exc).lower()
        if "password authentication failed" in err:
            raise SystemExit(
                "\nContraseña incorrecta o no es la de BASE DE DATOS.\n\n"
                "No uses la anon key ni la service_role key.\n"
                "1. Supabase → Project Settings → Database\n"
                "2. Reset database password → copia la nueva\n"
                "3. Pégala en .env en DB_PASSWORD= (sin espacio después del =)\n"
                "4. Vuelve a ejecutar: python etl/test_connection.py\n"
            ) from exc
        raise

    with conn.cursor() as cur:
        cur.execute("SELECT current_user, version();")
        row = cur.fetchone()
        print(f"OK: usuario={row[0]}")
        print(f"    {row[1][:70]}...")
    conn.close()
    print("Conexión correcta.")


if __name__ == "__main__":
    main()
