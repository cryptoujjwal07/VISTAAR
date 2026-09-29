// MongoDB Index Initialization Script for VISTAAR Production Database
db = db.getSiblingDB("vistaar_production");

// 1. Dataset Records (Compound queries by station and timestamp)
db.dataset_records.createIndex({ "station_id": 1, "timestamp": -1 }, { background: true });
db.dataset_records.createIndex({ "record_id": 1 }, { unique: true, background: true });
db.dataset_records.createIndex({ "provenance.sha256": 1 }, { background: true });

// 2. Datasets Catalog
db.datasets.createIndex({ "dataset_id": 1 }, { unique: true, background: true });
db.datasets.createIndex({ "station_id": 1 }, { background: true });

// 3. Publications & Governance
db.publications.createIndex({ "id": 1 }, { unique: true, background: true });
db.publications.createIndex({ "status": 1, "created_at": -1 }, { background: true });
db.publications.createIndex({ "station_id": 1 }, { background: true });

// 4. Audit Trail
db.audit_events.createIndex({ "event_id": 1 }, { unique: true, background: true });
db.audit_events.createIndex({ "timestamp": -1 }, { background: true });
db.audit_events.createIndex({ "actor_id": 1 }, { background: true });

// 5. Users & Auth
db.users.createIndex({ "email": 1 }, { unique: true, background: true });

print("VISTAAR production database indexes initialized successfully.");
