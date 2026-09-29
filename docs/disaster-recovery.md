# VISTAAR — Disaster Recovery & Backup Plan

**Platform**: VISTAAR (National Polar Science Outreach & Knowledge Repository)  
**Host Organization**: NCPOR, Ministry of Earth Sciences, Govt. of India  
**Date**: 2026-09-29  

---

## 1. Operational RPO & RTO Targets

| Component | Target RPO (Recovery Point Objective) | Target RTO (Recovery Time Objective) | Mechanism |
|---|---|---|---|
| **MongoDB Atlas Cluster** | **< 1 Hour** | **< 30 Minutes** | Continuous Cloud Backups & Point-in-Time Restore (PITR) via Atlas Snapshot Manager. |
| **Object Storage (`/data/storage`)** | **< 24 Hours** | **< 1 Hour** | Daily mirrored rsync / S3 cross-region bucket replication. |
| **Git Codebase & Configs** | **0 Minutes (Immediate)** | **< 15 Minutes** | Remote GitHub master branch + containerized redeployment. |
| **Audit Logs** | **< 15 Minutes** | **< 30 Minutes** | Append-only MongoDB collection with read-only replica archives. |

---

## 2. Backup Procedures

### 2.1 Database Backup (MongoDB Atlas)
1. **Automated Continuous Snapshots**: Atlas executes daily automated snapshots with a 7-day retention window.
2. **Local Dump Snapshot**:
   ```bash
   mongodump --uri="mongodb+srv://ayushmang06_db_user:<PASSWORD>@polarbearvistaar.qmtf9h5.mongodb.net/vistaar_production" --archive="data/backups/vistaar_$(date +%Y%m%d).archive" --gzip
   ```

### 2.2 Storage & Media Assets
All uploaded documents and generated press kits stored in `./data/storage` are backed up using:
```bash
rsync -avz --delete ./data/storage/ /backup/vistaar/storage/
```

---

## 3. Disaster Recovery & Rollback Checklist

1. **Database Restore**:
   - Navigate to MongoDB Atlas Dashboard -> Cluster -> Backup -> Point in Time Restore.
   - Alternatively, restore local archive:
     ```bash
     mongorestore --uri="mongodb+srv://.../vistaar_production" --archive="data/backups/vistaar_recent.archive" --gzip --drop
     ```
2. **Re-initialize Compound Indexes**:
   ```bash
   .venv\Scripts\python -c "import asyncio; from apps.api.core.database import connect_to_mongo; asyncio.run(connect_to_mongo())"
   ```
3. **Application Redeploy & Rollback**:
   - Revert git commit:
     ```bash
     git revert HEAD --no-edit
     git push origin main
     ```
   - Build frontend & restart backend:
     ```bash
     cd apps/web && npm run build
     python -m uvicorn apps.api.main:app --port 8000
     ```
4. **Health Verification**:
   - Execute `GET http://localhost:8000/health/ready` and confirm `status: "ready"` with database latency reported.
