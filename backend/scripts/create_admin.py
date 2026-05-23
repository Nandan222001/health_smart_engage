#!/usr/bin/env python3
"""
Create an admin user (and optionally a tenant) in the HSE database.

Usage:
    python scripts/create_admin.py
    python scripts/create_admin.py --email admin@company.com --name "Jane Smith" --tenant-id acme --tenant-name "Acme Corp"

Run from the backend/ directory.
"""
import argparse
import sys
import uuid
from pathlib import Path

# Ensure the backend package is on the path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal, engine
from app.models import domain  # noqa: F401 — registers all ORM models
from app.models.tenant import Tenant
from app.models.domain import Base, User, Role


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Create an admin user in the HSE database")
    p.add_argument("--email", default="admin@example.com", help="Admin email address")
    p.add_argument("--name", default="System Admin", help="Display name")
    p.add_argument("--tenant-id", default="default-tenant", help="Tenant ID (created if absent)")
    p.add_argument("--tenant-name", default="Default Organisation", help="Tenant name (used when creating)")
    p.add_argument("--plan", default="enterprise", choices=["starter", "professional", "enterprise"],
                   help="Tenant plan (used when creating)")
    p.add_argument("--dry-run", action="store_true", help="Print what would be created without writing")
    return p.parse_args()


def ensure_tables() -> None:
    Base.metadata.create_all(bind=engine)
    # Tenant table lives on a separate metadata — import and register it
    from app.models.tenant import Tenant as _T  # noqa: F401
    Tenant.metadata.create_all(bind=engine)


def create_admin(args: argparse.Namespace) -> None:
    if args.dry_run:
        print("[dry-run] Would create:")
        print(f"  Tenant  : id={args.tenant_id!r}  name={args.tenant_name!r}  plan={args.plan!r}")
        print(f"  User    : email={args.email!r}  display_name={args.name!r}  status='active'")
        print(f"  Role    : name='System Admin'  is_system=True  permissions={{admin:*}}")
        return

    ensure_tables()

    db = SessionLocal()
    try:
        # ── Tenant ──────────────────────────────────────────────────────────
        tenant = db.get(Tenant, args.tenant_id)
        if tenant is None:
            tenant = Tenant(
                id=args.tenant_id,
                name=args.tenant_name,
                status="active",
                plan=args.plan,
            )
            db.add(tenant)
            db.flush()
            print(f"[+] Created tenant  : {tenant.id!r} ({tenant.name})")
        else:
            print(f"[~] Tenant exists   : {tenant.id!r} ({tenant.name})")

        # ── System Admin role ────────────────────────────────────────────────
        role = (
            db.query(Role)
            .filter(Role.tenant_id == args.tenant_id, Role.name == "System Admin")
            .first()
        )
        if role is None:
            role = Role(
                id=str(uuid.uuid4()),
                tenant_id=args.tenant_id,
                name="System Admin",
                is_system=True,
                permissions={"admin:*": True},
            )
            db.add(role)
            db.flush()
            print(f"[+] Created role    : {role.id!r} (System Admin)")
        else:
            print(f"[~] Role exists     : {role.id!r} (System Admin)")

        # ── Admin user ───────────────────────────────────────────────────────
        existing = (
            db.query(User)
            .filter(User.tenant_id == args.tenant_id, User.email == args.email)
            .first()
        )
        if existing is not None:
            print(f"[~] User exists     : {existing.email!r} (id={existing.id!r}) — no changes made")
        else:
            user = User(
                id=str(uuid.uuid4()),
                tenant_id=args.tenant_id,
                email=args.email,
                display_name=args.name,
                status="active",
            )
            db.add(user)
            db.flush()
            print(f"[+] Created user    : {user.email!r} (id={user.id!r})")

        db.commit()
        print("\nDone.")
    except Exception as exc:
        db.rollback()
        print(f"\n[ERROR] {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    create_admin(parse_args())
