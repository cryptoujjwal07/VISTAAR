# VISTAAR (विस्तार) — Production Backup & Disaster-Recovery Plan (Prompt 29)

**Platform**: VISTAAR — Integrated Polar Science Outreach, Knowledge Repository & Media Dissemination Portal  
**Host Organization**: National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences (MoES), Govt. of India  
**Problem Statement**: SIH 26063  
**Implementation Reference**: `apps/api/core/backup.py`, `apps/api/domains/health/router.py`, `scripts/backup_and_restore.py`

---

## 1. Environment-Calibrated RPO & RTO Matrix (No Unsupported Guarantees)

> **Engineering Honesty Policy (Prompt 29)**: RPO (Recovery Point Objective) and RTO (Recovery Time Objective) figures below are strictly calibrated to the **actual configured infrastructure** (`MongoDB Atlas + Local Content-Addressed Object Storage ./data/storage + In-Memory/Redis Queue + Git Version Control`). We do **not** claim multi-region active-active zero-RPO failover where single-node storage or shared-tier database instances are deployed.

| System Component | Actual Active Environment | Actual RPO (Data Loss Window) | Actual RTO (Recovery Time) | What Is Supported Today | Enterprise Upgrade Path (M10+ / S3 Multi-AZ) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MongoDB Database** (`datasets`, `documents`, `publications`, `claims`, `claim_verifications`, `audit_events`) | MongoDB Atlas Cloud (`vistaar_production`) + `./data/backups/*.json.gz` Provenance Snapshots | **24 Hours** (daily scheduled snapshot) or **0 Minutes** after pre-deploy snapshot (`POST /api/v1/admin/dr/snapshot`) | **10 – 30 Minutes** (snapshot restore + 24 compound index initialization) | Portable gzipped JSON provenance snapshots with SHA-256 verification + `mongodump` / `mongorestore` | MongoDB Atlas M10+ Continuous Cloud Backup with Point-in-Time Restore (RPO < 5 min) |
| **Object & Media Storage** (`./data/storage/raw_files`, `documents`, `exports`) | Local Content-Addressed Vault (`./data/storage`) mirrored to `./data/backups/storage_mirror` | **24 Hours** (daily mirror) or **Immediate** post-ingestion snapshot | **15 – 45 Minutes** (file copy + per-file SHA-256 checksum validation against DB) | Per-file SHA-256 manifest (`build_storage_manifest`) + automated mirror copy during snapshot | AWS S3 / MinIO Cross-Region Replication with Object Versioning (RPO < 15 min) |
| **System & Governance Configuration** (`.env` schema + `RUNTIME_ADMIN_CONFIG`) | Git-tracked `.env.example` + sanitized config export in DR snapshots | **0 Minutes** for code/schema; **Immediate** audit log entry per runtime config mutation | **5 – 15 Minutes** (container/service restart + config replay) | Secret-redacted configuration backup (`build_sanitized_config_snapshot`); secrets injected via host vault | AWS Secrets Manager / HashiCorp Vault automated secret rotation |
| **Immutable Audit Trail** (`audit_events` collection) | MongoDB `audit_events` + embedded in every `.json.gz` DR snapshot | **Included in every DR snapshot** + live MongoDB write | **10 – 20 Minutes** | Append-only governance log with `before_version`, `after_version`, `request_id`, and `user_id` | WORM (Write-Once-Read-Many) S3 Object Lock cold archival |
| **Background Worker Queue** (`AsyncJobQueue`) | In-Memory AsyncIO Queue (`USE_IN_MEMORY_QUEUE=True`) or Redis Broker | **Ephemeral in-flight queue**; source dataset/document state persisted in MongoDB for idempotent replay | **< 2 Minutes** (worker auto-start + idempotent job re-enqueue) | Idempotency keys (`Idempotency-Key`) + SHA-256 deduplication allow safe job replay after restart | Redis Sentinel / Cluster with AOF `everysec` persistence |

---

## 2. MongoDB Backup Procedure

VISTAAR provides two complementary database backup mechanisms:

### 2.1 Native Provenance-Complete Snapshot Engine (`apps/api/core/backup.py`)
Captures all scientific collections (`datasets`, `dataset_versions`, `dataset_records`, `documents`, `document_chunks`, `publications`, `publication_versions`, `claims`, `claim_verifications`, `translations`, `rag_traces`, `audit_events`, and redacted `users_metadata`), computes a cryptographic **SHA-256 payload digest**, and writes a compressed `.json.gz` archive + `.meta.json` sidecar to `./data/backups/`.

- **Via Admin API** (`SUPER_ADMIN` role required):
  ```bash
  curl -X POST http://localhost:8000/api/v1/admin/dr/snapshot \
    -H "Authorization: Bearer <SUPER_ADMIN_JWT>" \
    -H "Content-Type: application/json" \
    -d '{"label": "pre_release_v1", "include_storage_copy": true, "reason": "Scheduled pre-release backup"}'
  ```
- **Via Operational CLI**:
  ```bash
  .\.venv\Scripts\python.exe -m scripts.backup_and_restore snapshot --label daily_backup
  ```

### 2.2 Binary `mongodump` Archive (Full Cluster BSON Dump)
For full-fidelity BSON backups of large time-series collections:
```bash
mongodump --uri="$MONGODB_URI" \
  --archive="./data/backups/vistaar_bson_$(date +%Y%m%dT%H%M%SZ).archive.gz" \
  --gzip
```

---

## 3. Object-Storage & Media Backup Procedure

All raw polar CSV/NetCDF files, expedition PDF reports, rendered page caches, and media assets reside under `./data/storage/`.

1. **Cryptographic Manifest Generation**:
   - `build_storage_manifest()` in `apps/api/core/backup.py` walks `./data/storage/`, records every file's relative path and byte size, and computes its **SHA-256 digest** (`manifest_sha256`).
2. **Automated Storage Mirroring**:
   - When `create_backup_snapshot(include_storage_copy=True)` runs, every file in `./data/storage/` is mirrored to `./data/backups/storage_mirror/` preserving directory hierarchy (`raw_files/`, `documents/`, `exports/`).
3. **External Off-Host Sync (Linux / Windows)**:
   - Linux/macOS:
     ```bash
     rsync -avz --checksum ./data/storage/ /mnt/offsite_backup/vistaar/storage/
     ```
   - Windows PowerShell:
     ```powershell
     Robocopy.exe .\data\storage .\data\backups\storage_mirror /MIR /Z /R:3 /W:5
     ```

---

## 4. Configuration Backup & Secret Hygiene

1. **Sanitized Runtime Configuration Backup**:
   - Every DR snapshot includes `build_sanitized_config_snapshot(RUNTIME_ADMIN_CONFIG)`, preserving:
     - Governance flags (`strict_claim_verification`, `require_editorial_approval`, `max_upload_size_mb`, `ai_rate_limit_rpm`)
     - Non-sensitive service settings (`ENVIRONMENT`, `MONGODB_DB_NAME`, `STORAGE_PROVIDER`, `AI_PROVIDER`, `AI_MODEL_NAME`, `EMBEDDING_MODEL_NAME`)
2. **Strict Zero-Secret Rule (Prompts 26, 28 & 29)**:
   - Backup archives **never** store raw `JWT_SECRET_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `BHASHINI_API_KEY`, user password hashes, or MongoDB URI passwords.
   - Database URIs in snapshots are automatically scrubbed via `redact_sensitive_text()` (`mongodb+srv://user:[REDACTED]@...`).

---

## 5. Audit Retention Policy

1. **Immutable Governance Ledger (`audit_events`)**:
   - All state-changing operations (dataset ingestion, QC flagging, claim verification overrides, editorial status transitions, publication sign-offs, admin configuration updates, and DR snapshot/restore actions) write append-only records to `db.audit_events`.
2. **Captured Correlation Fields**:
   - `event_id`, `timestamp`, `actor_id`, `actor_email`, `action`, `resource_type`, `resource_id`, `reason`, `before_version`, `after_version`, `request_id`, and secret-redacted `details`.
3. **Retention Window**:
   - **Active Online Retention**: 7 years in MongoDB Atlas indexed by `(resource_type, resource_id, timestamp)` and `(actor_id, timestamp)`.
   - **Cold Archive Retention**: Every `.json.gz` DR snapshot preserves the full `audit_events` collection with SHA-256 tamper detection.

---

## 6. Database Restore & Provenance-Intact Content Recovery

### 6.1 Restoring Published Scientific Content with Provenance Intact
VISTAAR enforces a strict provenance chain:
$$\text{Raw Dataset / PDF} \longrightarrow \text{Normalized Records / BBox Chunks} \longrightarrow \text{Extracted Claims} \longrightarrow \text{Deterministic Claim Verifications} \longrightarrow \text{Published Story + Version History}$$

To restore all (or a specific) published scientific publication with 100% of its upstream evidence links, claim verifications, translations, and version history intact:

- **Via Operational CLI**:
  ```bash
  .\.venv\Scripts\python.exe -m scripts.backup_and_restore restore --snapshot-id snap_20260930T120000Z_daily_backup
  ```
- **Via Admin API** (`SUPER_ADMIN` role required):
  ```bash
  curl -X POST http://localhost:8000/api/v1/admin/dr/verify-restore \
    -H "Authorization: Bearer <SUPER_ADMIN_JWT>" \
    -H "Content-Type: application/json" \
    -d '{"snapshot_id": "snap_20260930T120000Z_daily_backup", "restore_storage_files": true}'
  ```
- **What `restore_published_content_with_provenance()` Executes**:
  1. Reads `./data/backups/<snapshot_id>.json.gz` and verifies its **SHA-256 digest** against `<snapshot_id>.meta.json` (aborts with `422` if tampered or corrupted).
  2. Upserts upstream `datasets`, `documents`, and `document_chunks` first so all foreign evidence references exist.
  3. Upserts `claims` and `claim_verifications` (`VERIFIED` / `APPROXIMATE` badges and statistical proof payloads).
  4. Upserts `publications`, `publication_versions`, and `translations`.
  5. Restores any missing raw files from `./data/backups/storage_mirror` into `./data/storage` and validates each file's SHA-256 checksum.
  6. Executes `verify_provenance_integrity()` to confirm `broken_provenance_count == 0`.

### 6.2 Full Binary `mongorestore` + Index Re-Initialization
```bash
# 1. Restore BSON archive
mongorestore --uri="$MONGODB_URI" \
  --archive="./data/backups/vistaar_bson_latest.archive.gz" \
  --gzip --drop

# 2. Re-initialize all 24 production compound indexes
.\.venv\Scripts\python.exe -c "import asyncio; from apps.api.core.database import connect_to_mongo; asyncio.run(connect_to_mongo())"
```

---

## 7. Media & Object-Storage Restore Procedure

1. **Automated Mirror Restore**:
   - Triggered automatically when `restore_published_content_with_provenance(..., restore_storage_files=True)` runs.
2. **Manual Directory Restore + Checksum Audit**:
   ```powershell
   # Restore missing or corrupted files from mirror
   Robocopy.exe .\data\backups\storage_mirror .\data\storage /E /XO
   # Verify storage manifest and provenance links
   .\.venv\Scripts\python.exe -m scripts.backup_and_restore status
   ```
3. **Integrity Guarantee**:
   - Every restored PDF document is verified against `documents.sha256` and every dataset CSV is verified against `datasets.checksum_sha256` before serving page renders or downloads.

---

## 8. Deployment Rollback Procedure

If a newly deployed backend or frontend release introduces regressions:

1. **Identify Last Known Good Commit / Tag**:
   ```bash
   git log --oneline -n 5
   ```
2. **Pre-Rollback Snapshot**:
   ```bash
   .\.venv\Scripts\python.exe -m scripts.backup_and_restore snapshot --label pre_rollback
   ```
3. **Codebase Rollback**:
   ```bash
   git revert HEAD --no-edit
   git push origin main
   ```
4. **Rebuild Frontend & Restart API**:
   ```powershell
   cd apps/web; npm run build; cd ../..
   .\.venv\Scripts\python.exe -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000
   ```
5. **Post-Rollback Smoke & Readiness Verification**:
   - Check `GET /health/ready` $\rightarrow$ verify `status: "ready"` and `database.healthy: true`, `worker.healthy: true`, `storage.healthy: true`.
   - Check `GET /api/v1/admin/dr/status` $\rightarrow$ verify `provenance_integrity.all_provenance_intact: true`.

---

## 9. Operational Recovery Checklists

### Checklist A — Accidental Deletion or Corruption of Published Scientific Article
- [ ] **Step 1**: Run `python -m scripts.backup_and_restore status` to identify the latest valid `snapshot_id` and inspect `broken_links`.
- [ ] **Step 2**: Run `python -m scripts.backup_and_restore restore --snapshot-id <snapshot_id> --publication-id <pub_id>`.
- [ ] **Step 3**: Confirm output reports `"checksum_verified": true` and `"all_provenance_intact": true`.
- [ ] **Step 4**: Open `GET /api/v1/publications/<pub_id>` and verify inline citations, claim verification badges, and PDF/dataset provenance links render accurately.

### Checklist B — Missing or Corrupted Expedition PDF / Raw Dataset File on Disk
- [ ] **Step 1**: Check `GET /health/ready` and `GET /api/v1/admin/dr/status` to inspect `storage_manifest`.
- [ ] **Step 2**: Run `POST /api/v1/admin/dr/verify-restore` with `"restore_storage_files": true` to copy missing files from `./data/backups/storage_mirror` and verify SHA-256 digests.
- [ ] **Step 3**: Test PDF page rendering (`GET /api/v1/documents/{id}/pages/1/render`) and dataset streaming (`GET /api/v1/datasets/{id}/records/stream`).

### Checklist C — Full Database Outage or Collection Drop
- [ ] **Step 1**: Verify MongoDB Atlas connectivity and credentials in `.env`.
- [ ] **Step 2**: Restore collections from the latest `.json.gz` snapshot via `python -m scripts.backup_and_restore restore --snapshot-id <latest_snapshot_id>` (or `mongorestore` for full BSON archives).
- [ ] **Step 3**: Re-verify all 24 MongoDB compound indexes via `GET /api/v1/health/performance` (`database_indexes.count == 24`).
- [ ] **Step 4**: Re-seed RBAC accounts if needed (`python -m scripts.seed_rbac_users`).

### Checklist D — Bad Application Deployment / High 5xx Error Rate
- [ ] **Step 1**: Inspect `GET /api/v1/health/metrics` (`observability_metrics.error_rate` and `request_latency`).
- [ ] **Step 2**: Revert the offending commit (`git revert HEAD --no-edit`) or redeploy the previous container tag.
- [ ] **Step 3**: Restore sanitized runtime governance settings (`RUNTIME_ADMIN_CONFIG`) from the latest snapshot metadata.
- [ ] **Step 4**: Run `pytest tests/test_api_health.py` to confirm green liveness, readiness, and observability probes.
