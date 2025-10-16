# Disaster Recovery Procedures

## Overview
This document outlines disaster recovery procedures for Vextrus ERP production environment with Bangladesh compliance requirements.

## RTO/RPO Targets
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 24 hours
- **Bangladesh Data Retention**: 7 years (NBR requirement)

## Backup Strategy

### Automated Backups
- **Database**: Daily at 2 AM Bangladesh time
- **Elasticsearch**: Daily at 3 AM Bangladesh time  
- **MinIO/Files**: Daily at 4 AM Bangladesh time
- **Retention**: 30 days local, 7 years offsite (S3)

### Backup Locations
```
Primary: /backup (PVC in Kubernetes)
Secondary: MinIO (vextrus-backups bucket)
Offsite: AWS S3 (Bangladesh region when available)
```

## Recovery Scenarios

### Scenario 1: Database Corruption/Loss

#### Detection
```bash
# Check database health
kubectl exec -n vextrus deployment/auth-service -- \
  psql -U vextrus -d vextrus_erp -c "SELECT 1"

# Check for corruption
kubectl exec -n vextrus postgres-0 -- \
  pg_dumpall --schema-only > /tmp/schema_test.sql
```

#### Recovery Steps
```bash
# 1. Stop all services to prevent data writes
kubectl scale deployment --all --replicas=0 -n vextrus

# 2. Identify latest valid backup
kubectl exec -n vextrus backup-pod -- ls -la /backup/*.sql.gz

# 3. Drop corrupted database
kubectl exec -n vextrus postgres-0 -- \
  psql -U postgres -c "DROP DATABASE IF EXISTS vextrus_erp;"

# 4. Create fresh database
kubectl exec -n vextrus postgres-0 -- \
  psql -U postgres -c "CREATE DATABASE vextrus_erp OWNER vextrus;"

# 5. Restore from backup
kubectl exec -n vextrus postgres-0 -- bash -c \
  "gunzip < /backup/vextrus_erp_20250109_020000.sql.gz | \
   pg_restore -U vextrus -d vextrus_erp --verbose"

# 6. Run migrations
kubectl exec -n vextrus deployment/auth-service -- \
  npm run migration:run

# 7. Verify data integrity
kubectl exec -n vextrus postgres-0 -- \
  psql -U vextrus -d vextrus_erp -c \
  "SELECT COUNT(*) FROM organizations;"

# 8. Restart services
kubectl scale deployment --all --replicas=3 -n vextrus

# 9. Verify service health
for service in auth organization notification file-storage \
               audit configuration import-export document-generator; do
  kubectl exec -n vextrus deployment/$service-service -- \
    curl -f http://localhost:3000/health || echo "$service unhealthy"
done
```

### Scenario 2: Complete Cluster Failure

#### Recovery Steps
```bash
# 1. Provision new Kubernetes cluster
eksctl create cluster --name vextrus-prod \
  --region ap-south-1 --node-type t3.large --nodes 3

# 2. Install required operators
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/aws/deploy.yaml
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# 3. Restore persistent volumes from snapshots
aws ec2 describe-snapshots --owner-ids self \
  --filters "Name=tag:Name,Values=vextrus-backup-*"

# 4. Create PVs from snapshots
for snapshot in $(aws ec2 describe-snapshots --query 'Snapshots[].SnapshotId' --output text); do
  kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolume
metadata:
  name: restored-pv-$snapshot
spec:
  capacity:
    storage: 100Gi
  accessModes:
    - ReadWriteOnce
  awsElasticBlockStore:
    volumeID: $snapshot
    fsType: ext4
EOF
done

# 5. Deploy infrastructure services
kubectl apply -f infrastructure/kubernetes/namespace/
kubectl apply -f infrastructure/kubernetes/secrets/
kubectl apply -f infrastructure/kubernetes/configmaps/

# 6. Deploy databases and message queues
kubectl apply -f infrastructure/kubernetes/infrastructure/

# 7. Wait for infrastructure to be ready
kubectl wait --for=condition=ready pod \
  -l app=postgres -n vextrus --timeout=300s

# 8. Restore database from backup
./scripts/restore-database.sh

# 9. Deploy application services
kubectl apply -f infrastructure/kubernetes/services/
kubectl apply -f infrastructure/kubernetes/deployments/

# 10. Update DNS records
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch file://dns-update.json

# 11. Verify deployment
./scripts/smoke-tests.sh https://api.vextrus.com.bd
```

### Scenario 3: Service-Specific Failure

#### Auth Service Recovery
```bash
# 1. Check service status
kubectl get pods -n vextrus -l app=auth-service

# 2. Check logs for errors
kubectl logs -n vextrus deployment/auth-service --tail=100

# 3. Restart if needed
kubectl rollout restart deployment/auth-service -n vextrus

# 4. If persistent issues, rollback
kubectl rollout undo deployment/auth-service -n vextrus

# 5. Verify JWT signing keys
kubectl get secret -n vextrus auth-secret -o yaml
```

#### Notification Service Recovery
```bash
# 1. Check Bull queue status
kubectl exec -n vextrus deployment/notification-service -- \
  node -e "require('./dist/queue').getQueueStatus()"

# 2. Clear stuck jobs if needed
kubectl exec -n vextrus deployment/notification-service -- \
  redis-cli -h redis FLUSHDB

# 3. Restart workers
kubectl scale deployment notification-service --replicas=0 -n vextrus
kubectl scale deployment notification-service --replicas=3 -n vextrus

# 4. Verify SMS providers (Bangladesh)
kubectl exec -n vextrus deployment/notification-service -- \
  curl -X POST https://api.alpha-sms.com/health
```

### Scenario 4: Data Center Outage (Bangladesh Specific)

#### BTRC Compliance During Outage
```bash
# 1. Activate secondary data center (if available)
kubectl config use-context dhaka-secondary

# 2. Ensure data remains in Bangladesh
kubectl get nodes -o wide | grep -E "zone|region"

# 3. Verify data localization
kubectl exec -n vextrus deployment/audit-service -- \
  ls -la /data/bangladesh/

# 4. Generate compliance report
kubectl exec -n vextrus deployment/audit-service -- \
  node scripts/generate-btrc-report.js > btrc-compliance-$(date +%Y%m%d).pdf
```

### Scenario 5: Ransomware/Security Breach

#### Immediate Response
```bash
# 1. Isolate affected systems
kubectl cordon node1 node2 node3

# 2. Disable external access
kubectl delete ingress --all -n vextrus

# 3. Snapshot current state for forensics
for node in $(kubectl get nodes -o name); do
  aws ec2 create-snapshot --volume-id $(kubectl get $node -o jsonpath='{.spec.providerID}')
done

# 4. Rotate all secrets
./scripts/rotate-all-secrets.sh

# 5. Restore from clean backup
./scripts/restore-from-clean-backup.sh

# 6. Audit all access logs
kubectl exec -n vextrus deployment/audit-service -- \
  node scripts/security-audit-full.js
```

## Testing Procedures

### Monthly DR Drill
```bash
# 1. Create test namespace
kubectl create namespace vextrus-dr-test

# 2. Deploy test instance
helm install vextrus-test ./charts/vextrus \
  --namespace vextrus-dr-test \
  --values values-dr-test.yaml

# 3. Restore test data
./scripts/restore-test-data.sh

# 4. Run validation tests
npm run test:dr

# 5. Clean up
kubectl delete namespace vextrus-dr-test
```

## Contact Information

### Escalation Matrix
| Level | Role | Contact | Phone |
|-------|------|---------|-------|
| L1 | DevOps On-Call | ops@vextrus.com | +880-1234567890 |
| L2 | Platform Lead | platform@vextrus.com | +880-1234567891 |
| L3 | CTO | cto@vextrus.com | +880-1234567892 |

### External Contacts
- AWS Support: Premium Support Case
- MinIO Support: support@min.io
- Bangladesh BTRC: compliance@btrc.gov.bd

## Compliance Requirements

### NBR (National Board of Revenue)
- Maintain 7 years of financial audit logs
- Generate monthly compliance reports
- Ensure data sovereignty in Bangladesh

### BTRC (Bangladesh Telecommunication Regulatory Commission)
- Data must remain within Bangladesh borders
- SMS logs retained for 2 years
- Regular compliance audits

## Recovery Validation

### Post-Recovery Checklist
- [ ] All services responding to health checks
- [ ] Database consistency verified
- [ ] Multi-tenant isolation confirmed
- [ ] RBAC permissions working (<10ms)
- [ ] Audit logging functional
- [ ] SMS/Email notifications operational
- [ ] File storage accessible
- [ ] Monitoring dashboards updated
- [ ] Bangladesh compliance verified
- [ ] Performance benchmarks met

### Validation Commands
```bash
# Complete validation suite
./scripts/post-recovery-validation.sh

# Generate recovery report
./scripts/generate-recovery-report.sh > recovery-$(date +%Y%m%d).md
```

## Lessons Learned Log

### Template for Post-Incident Review
```markdown
## Incident: [Date]
### What Happened
### Root Cause
### Recovery Time
### Improvements Needed
### Action Items
```

---

*Last Updated: 2025-01-10*
*Next Review: 2025-02-10*
*Document Owner: Platform Team*