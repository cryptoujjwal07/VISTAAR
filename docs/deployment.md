# VISTAAR Production CI/CD, Deployment & Rollback Runbook (Prompt 31)

**Organization:** National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences (MoES), Government of India  
**Problem Statement:** SIH 26063 — Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal

---

## 1. Environment Separation Architecture (`development` / `staging` / `production`)

VISTAAR enforces strict separation across three isolated runtime tiers. Unvalidated local code is never deployed directly to staging or production, and credentials are never committed to version control.

| Tier | Config Template | Database Namespace | Storage Backend | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Development** | [`infra/environments/development.env.example`](file:///c:/Users/ayush/OneDrive/Desktop/SIH%20Project%202/infra/environments/development.env.example) | `vistaar_dev` | Local (`./data/storage_dev`) | Local developer iteration & unit testing |
| **Staging** | [`infra/environments/staging.env.example`](file:///c:/Users/ayush/OneDrive/Desktop/SIH%20Project%202/infra/environments/staging.env.example) | `vistaar_staging` | S3 / MeghRaj Staging (`vistaar-polar-assets-staging`) | Pre-production QA, editorial workflow validation & migration dry-run |
| **Production** | [`infra/environments/production.env.example`](file:///c:/Users/ayush/OneDrive/Desktop/SIH%20Project%202/infra/environments/production.env.example) | `vistaar_production` | S3 / MeghRaj Sovereign Cloud (`vistaar-polar-assets-prod`) | Live public portal (`vistaar.ncpor.res.in`) & official PIB/MoES outreach |

---

## 2. Automated CI/CD Pipeline Gates ([`.github/workflows/ci.yml`](file:///c:/Users/ayush/OneDrive/Desktop/SIH%20Project%202/.github/workflows/ci.yml))

Every Pull Request and push triggers the 5-stage pipeline:

1. **`security-and-secret-scan`**:
   - Runs `python scripts/ci_cd_verify_and_deploy.py --step secret-scan` to ensure `.env` files, private keys, API keys, and raw MongoDB credentials are never committed.
   - Runs `python scripts/ci_cd_verify_and_deploy.py --step env-validate` to verify isolated `MONGODB_DB_NAME` namespaces (`vistaar_dev`, `vistaar_staging`, `vistaar_production`).
2. **`backend-validation`** (`needs: [security-and-secret-scan]`):
   - Runs static bytecode compilation (`python -m compileall -q apps/api apps/worker scripts tests`).
   - Runs the full automated pytest suite (`tests/`), covering unit, scientific unit/timestamp normalization, AI structured-output validation, RBAC/IDOR security, and end-to-end tests.
3. **`frontend-validation`** (`needs: [security-and-secret-scan]`):
   - Runs `npm test` (`apps/web/tests/frontend_suite.test.mjs`) for component, workflow, and WCAG 2.1 AA / GIGW accessibility verification.
   - Runs `npx tsc --noEmit` (strict TypeScript typecheck) and `npm run build` (Next.js production build).
4. **`deploy-staging`** (`needs: [security-and-secret-scan, backend-validation, frontend-validation]`):
   - Executes idempotent MongoDB collection and compound index migrations (`--step migrate-indexes`).
   - Executes mandatory post-deployment health checks (`--step health-gate`).
5. **`deploy-production`** (`needs: [deploy-staging]`, `main` branch only):
   - Creates an immutable pre-deployment disaster recovery snapshot (`python scripts/backup_and_restore.py snapshot --label pre_deploy_<sha>`).
   - Applies idempotent database index migrations (`--step migrate-indexes`).
   - Enforces post-deployment health checks (`--step health-gate`). If any health probe fails, the deployment exits with code `1` and triggers rollback.

---

## 3. Database Migration & Index Deployment Strategy

MongoDB schema and compound index migrations are managed idempotently via [`scripts/init_mongo_data_model.py`](file:///c:/Users/ayush/OneDrive/Desktop/SIH%20Project%202/scripts/init_mongo_data_model.py) and [`scripts/ci_cd_verify_and_deploy.py`](file:///c:/Users/ayush/OneDrive/Desktop/SIH%20Project%202/scripts/ci_cd_verify_and_deploy.py):

- **Additive & Non-Destructive**: Migrations never drop existing collections or mutate raw NPDC scientific telemetry (`dataset_records` or `documents`).
- **Idempotent Index Creation**: All 21 collections (`users`, `roles`, `documents`, `document_pages`, `document_chunks`, `datasets`, `dataset_metadata`, `dataset_records`, `media_assets`, `expeditions`, `stations`, `claims`, `claim_verifications`, `generated_content`, `review_tasks`, `translations`, `quizzes`, `publications`, `audit_events`, `notifications`, `jobs`) have their unique and compound indexes verified before traffic cutover.

---

## 4. Post-Deployment Health Gate Enforcement

Every deployment executes:
```bash
python scripts/ci_cd_verify_and_deploy.py --env production --step health-gate --target-url https://api.vistaar.ncpor.res.in
```
The health gate verifies:
1. `GET /api/v1/health/live` $\rightarrow$ `HTTP 200` (`status == "ALIVE"`)
2. `GET /api/v1/health/ready` $\rightarrow$ `HTTP 200` (`status == "READY"`, `all_critical_healthy == true` across MongoDB, Redis/Queue, Object Storage, and AI Provider)
3. `GET /api/v1/health/metrics` $\rightarrow$ `HTTP 200`

If any probe returns non-200 or `DEGRADED`, `DeploymentHealthGateError` is raised and the deployment fails immediately.

---

## 5. Rollback Procedures

### 5.1 Application Container Rollback
If the post-deployment health gate fails or elevated 5xx error rates are observed:
```bash
# 1. Revert service containers to previous verified image tag
docker compose -f infra/docker-compose.yml up -d --no-deps api worker web

# 2. Verify post-rollback health gate
python scripts/ci_cd_verify_and_deploy.py --env production --step health-gate
```

### 5.2 Database & Provenance Snapshot Rollback
Every production deployment creates a cryptographic pre-deploy snapshot (`pre_deploy_<commit_sha>`). To restore database collections while preserving SHA-256 dataset/PDF provenance integrity:
```bash
# 1. Verify snapshot cryptographic integrity first
python scripts/backup_and_restore.py verify --snapshot-id <snapshot_id>

# 2. Execute audited non-destructive restore
python scripts/backup_and_restore.py restore --snapshot-id <snapshot_id>
```

### 5.3 Editorial Publication Version Rollback
To roll back an individual published outreach item to a previously approved historical version without redeploying:
```bash
curl -X POST https://api.vistaar.ncpor.res.in/api/v1/publications/<pub_id>/rollback \
  -H "Authorization: Bearer <SUPER_ADMIN_OR_EDITOR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"target_version": 1, "reason": "Revert to prior approved PIB bulletin version"}'
```
