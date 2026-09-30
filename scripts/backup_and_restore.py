"""
Operational Disaster Recovery & Provenance Backup CLI Utility (Prompt 29).

Usage:
  python -m scripts.backup_and_restore status
  python -m scripts.backup_and_restore snapshot --label pre_release
  python -m scripts.backup_and_restore restore --snapshot-id <snap_id>
"""
import argparse
import asyncio
import json
import sys

from apps.api.core.backup import (
    create_backup_snapshot,
    get_actual_rpo_rto_profile,
    list_backup_snapshots,
    restore_published_content_with_provenance,
    verify_provenance_integrity,
)
from apps.api.core.database import close_mongo_connection, connect_to_mongo


async def _run_cli() -> int:
    parser = argparse.ArgumentParser(description="VISTAAR Disaster Recovery & Provenance Backup CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("status", help="Show environment RPO/RTO profile, snapshots, and provenance integrity")

    snap_p = sub.add_parser("snapshot", help="Create a provenance-intact backup snapshot (.json.gz)")
    snap_p.add_argument("--label", default="cli_manual", help="Snapshot label")
    snap_p.add_argument("--no-storage", action="store_true", help="Skip mirroring ./data/storage files")

    rest_p = sub.add_parser("restore", help="Verify SHA-256 and restore published content with provenance")
    rest_p.add_argument("--snapshot-id", required=True, help="Snapshot ID (e.g. snap_20260930T...)")
    rest_p.add_argument("--publication-id", default=None, help="Optional single publication_id to restore")

    args = parser.parse_args()
    await connect_to_mongo()
    try:
        if args.command == "status":
            rpo_rto = get_actual_rpo_rto_profile()
            prov = await verify_provenance_integrity()
            snaps = list_backup_snapshots()
            print(
                json.dumps(
                    {
                        "rpo_rto_profile": rpo_rto,
                        "snapshots_available": len(snaps),
                        "latest_snapshot": snaps[0] if snaps else None,
                        "provenance_integrity": prov,
                    },
                    indent=2,
                )
            )
        elif args.command == "snapshot":
            res = await create_backup_snapshot(
                label=args.label,
                include_storage_copy=not args.no_storage,
            )
            print(json.dumps(res, indent=2))
        elif args.command == "restore":
            res = await restore_published_content_with_provenance(
                snapshot_id=args.snapshot_id,
                publication_id=args.publication_id,
            )
            print(json.dumps(res, indent=2))
        return 0
    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    sys.exit(asyncio.run(_run_cli()))
