# Backup Strategy

## PostgreSQL Backups
- **Continuous:** Write-Ahead Logging (WAL) archiving to S3 via `pgBackRest` or `wal-g`.
- **Scheduled:** Daily `pg_dump` snapshots executed at 02:00 UTC via a native Kubernetes `CronJob` (`deploy/k8s/base/cron-backup.yaml`).
- **Retention:** Daily snapshots retained for 30 days. Weekly for 1 year.

## Kafka Backups
- Kafka topics configured with `retention.ms` = 7 days for telemetry data.
- Event sourcing state is backed up natively by preserving the DB tables rather than infinitely holding Kafka streams.

## Restoring a Backup
```bash
# 1. Download snapshot
aws s3 cp s3://telecom-ai-backups/prod/db_20260923.sql.gz .

# 2. Decompress
gunzip db_20260923.sql.gz

# 3. Restore to target (Requires downtime or maintenance window)
psql -h <host> -U postgres -d telecom_ai < db_20260923.sql
```
