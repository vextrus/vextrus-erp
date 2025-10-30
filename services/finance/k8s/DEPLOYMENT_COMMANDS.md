# Finance Service Kubernetes Deployment Commands

## Quick Reference

### Prerequisites
```bash
# Verify kubectl context
kubectl config current-context

# Verify namespace exists
kubectl get namespace vextrus-production

# Verify secrets exist
kubectl get secrets -n vextrus-production | grep finance
```

---

## Week 3 Deployment (60% Canary)

### Deploy
```bash
# Apply Week 3 configuration
kubectl apply -f services/finance/k8s/07-production-week3-60percent.yaml

# Watch rollout progress
kubectl rollout status deployment/finance-service-week3 -n vextrus-production

# Verify deployments
kubectl get deployments -n vextrus-production -l app=finance-service
```

### Monitor
```bash
# Check pod status
kubectl get pods -n vextrus-production -l app=finance-service

# View pod distribution
kubectl get pods -n vextrus-production -l app=finance-service -o wide

# Check resource usage
kubectl top pods -n vextrus-production -l app=finance-service

# View HPA status
kubectl get hpa -n vextrus-production finance-service-week3-hpa

# Check PDB status
kubectl get pdb -n vextrus-production finance-service-week3-pdb
```

### Logs
```bash
# Follow logs for canary pods
kubectl logs -f -n vextrus-production -l track=canary,app=finance-service

# Check for snapshot-related logs
kubectl logs -n vextrus-production -l track=canary --tail=100 | grep -i snapshot

# View all pod logs
kubectl logs -n vextrus-production deployment/finance-service-week3 --all-containers=true
```

### Validate Snapshots
```bash
# Check snapshot environment variables
kubectl get pods -n vextrus-production -l track=canary -o jsonpath='{.items[0].spec.containers[0].env[?(@.name=="SNAPSHOTS_ENABLED")].value}'

# Exec into pod to verify snapshot operation
kubectl exec -it -n vextrus-production deployment/finance-service-week3 -- env | grep SNAPSHOT
```

### Rollback Week 3
```bash
# Rollback to previous revision
kubectl rollout undo deployment/finance-service-week3 -n vextrus-production

# Rollback to specific revision
kubectl rollout history deployment/finance-service-week3 -n vextrus-production
kubectl rollout undo deployment/finance-service-week3 --to-revision=2 -n vextrus-production
```

---

## Week 4 Deployment (100% Production)

### Deploy
```bash
# Apply Week 4 configuration
kubectl apply -f services/finance/k8s/09-production-week4-100percent.yaml

# Watch rollout progress
kubectl rollout status deployment/finance-service-production -n vextrus-production

# Verify deployment
kubectl get deployment finance-service-production -n vextrus-production
```

### Monitor
```bash
# Check pod status
kubectl get pods -n vextrus-production -l track=production

# View pod distribution across nodes
kubectl get pods -n vextrus-production -l track=production -o wide

# Check resource usage
kubectl top pods -n vextrus-production -l track=production

# View HPA status
kubectl get hpa -n vextrus-production finance-service-production-hpa

# Check PDB status
kubectl get pdb -n vextrus-production finance-service-production-pdb

# Verify ServiceMonitor
kubectl get servicemonitor -n vextrus-production finance-service-production

# Verify PrometheusRule
kubectl get prometheusrule -n vextrus-production finance-service-production-alerts
```

### Logs
```bash
# Follow logs for production pods
kubectl logs -f -n vextrus-production -l track=production,app=finance-service

# Check snapshot metrics
kubectl logs -n vextrus-production -l track=production --tail=100 | grep -E "snapshot|SNAPSHOT"

# View specific pod logs
kubectl logs -n vextrus-production <pod-name> --all-containers=true
```

### Validate Production
```bash
# Check all environment variables
kubectl exec -n vextrus-production deployment/finance-service-production -- env | sort

# Verify snapshot configuration
kubectl exec -n vextrus-production deployment/finance-service-production -- env | grep -E "SNAPSHOT|EVENTSTORE"

# Test health endpoints
kubectl exec -n vextrus-production deployment/finance-service-production -- curl -s http://localhost:3014/health
kubectl exec -n vextrus-production deployment/finance-service-production -- curl -s http://localhost:3014/health/ready
kubectl exec -n vextrus-production deployment/finance-service-production -- curl -s http://localhost:3014/health/live
```

### Rollback Week 4
```bash
# Rollback to Week 3
kubectl rollout undo deployment/finance-service-production -n vextrus-production

# View rollout history
kubectl rollout history deployment/finance-service-production -n vextrus-production

# Rollback to specific revision
kubectl rollout undo deployment/finance-service-production --to-revision=3 -n vextrus-production
```

---

## Debugging

### Describe Resources
```bash
# Describe deployment
kubectl describe deployment finance-service-week3 -n vextrus-production
kubectl describe deployment finance-service-production -n vextrus-production

# Describe pods
kubectl describe pods -n vextrus-production -l app=finance-service

# Describe service
kubectl describe service finance-service -n vextrus-production
kubectl describe service finance-service-production -n vextrus-production
```

### Events
```bash
# View recent events
kubectl get events -n vextrus-production --sort-by='.lastTimestamp' | grep finance

# Watch events in real-time
kubectl get events -n vextrus-production --watch
```

### Resource Usage
```bash
# Check node capacity
kubectl top nodes

# Check pod resource requests/limits
kubectl get pods -n vextrus-production -l app=finance-service -o json | jq '.items[] | {name: .metadata.name, resources: .spec.containers[].resources}'

# View HPA metrics
kubectl describe hpa finance-service-week3-hpa -n vextrus-production
kubectl describe hpa finance-service-production-hpa -n vextrus-production
```

### Exec into Pod
```bash
# Week 3 pod
kubectl exec -it -n vextrus-production deployment/finance-service-week3 -- /bin/sh

# Week 4 pod
kubectl exec -it -n vextrus-production deployment/finance-service-production -- /bin/sh

# Check EventStore connectivity
kubectl exec -it -n vextrus-production deployment/finance-service-production -- curl -v http://eventstore:2113
```

---

## Scaling

### Manual Scaling
```bash
# Scale Week 3 canary
kubectl scale deployment finance-service-week3 --replicas=8 -n vextrus-production

# Scale Week 4 production
kubectl scale deployment finance-service-production --replicas=15 -n vextrus-production

# Verify scaling
kubectl get deployment -n vextrus-production -l app=finance-service
```

### HPA Management
```bash
# Disable HPA (for manual scaling)
kubectl delete hpa finance-service-week3-hpa -n vextrus-production

# Re-enable HPA
kubectl apply -f services/finance/k8s/07-production-week3-60percent.yaml

# Patch HPA min/max replicas
kubectl patch hpa finance-service-production-hpa -n vextrus-production -p '{"spec":{"minReplicas":12}}'
```

---

## Traffic Management

### Service Endpoints
```bash
# View service endpoints
kubectl get endpoints finance-service -n vextrus-production
kubectl get endpoints finance-service-production -n vextrus-production

# Describe service for session affinity
kubectl describe service finance-service -n vextrus-production
```

### Port Forwarding (for testing)
```bash
# Port forward to Week 3 canary
kubectl port-forward -n vextrus-production deployment/finance-service-week3 8080:3014

# Port forward to Week 4 production
kubectl port-forward -n vextrus-production deployment/finance-service-production 8080:3014

# Access locally
curl http://localhost:8080/health
```

---

## Monitoring & Alerting

### Prometheus Metrics
```bash
# Port forward to Prometheus
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090

# Access Prometheus UI
# http://localhost:9090

# Query snapshot metrics
# eventstore_snapshot_errors_total
# eventstore_snapshot_duration_seconds
# eventstore_connection_errors_total
```

### View Alerts
```bash
# Get PrometheusRule
kubectl get prometheusrule -n vextrus-production finance-service-production-alerts -o yaml

# Describe alert rules
kubectl describe prometheusrule finance-service-production-alerts -n vextrus-production
```

### Grafana Dashboards
```bash
# Port forward to Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000

# Access Grafana UI
# http://localhost:3000
```

---

## Secret Management

### View Secrets (without values)
```bash
# List secrets
kubectl get secrets -n vextrus-production | grep finance

# Describe secret
kubectl describe secret finance-db-production -n vextrus-production
kubectl describe secret finance-secrets-production -n vextrus-production
```

### Update Secrets (if needed)
```bash
# Update database secret
kubectl create secret generic finance-db-production \
  --from-literal=host=postgres.production.svc.cluster.local \
  --from-literal=username=finance_user \
  --from-literal=password='new-secure-password' \
  --dry-run=client -o yaml | kubectl apply -n vextrus-production -f -

# Update EventStore connection
kubectl create secret generic finance-secrets-production \
  --from-literal=eventstore-connection='esdb://eventstore:2113?tls=false' \
  --from-literal=jwt-secret='new-jwt-secret' \
  --from-literal=cors-origin='https://app.vextrus.com' \
  --dry-run=client -o yaml | kubectl apply -n vextrus-production -f -
```

### Restart Pods After Secret Update
```bash
# Restart Week 3
kubectl rollout restart deployment/finance-service-week3 -n vextrus-production

# Restart Week 4
kubectl rollout restart deployment/finance-service-production -n vextrus-production
```

---

## Cleanup

### Remove Week 3 (after Week 4 validated)
```bash
# Delete Week 3 deployment
kubectl delete deployment finance-service-week3 -n vextrus-production

# Delete Week 3 HPA
kubectl delete hpa finance-service-week3-hpa -n vextrus-production

# Delete Week 3 PDB
kubectl delete pdb finance-service-week3-pdb -n vextrus-production
```

### Remove Stable (after full migration)
```bash
# Delete stable deployment
kubectl delete deployment finance-service-stable -n vextrus-production
```

---

## Troubleshooting

### Pods Not Starting
```bash
# Check pod events
kubectl describe pod <pod-name> -n vextrus-production

# Check container logs
kubectl logs <pod-name> -n vextrus-production

# Check resource constraints
kubectl get nodes
kubectl describe node <node-name>
```

### High Memory Usage
```bash
# Check memory by pod
kubectl top pods -n vextrus-production -l app=finance-service --sort-by=memory

# Describe pod resource limits
kubectl describe pod <pod-name> -n vextrus-production | grep -A 5 Limits

# Consider increasing memory limits in YAML
```

### Snapshot Errors
```bash
# Check EventStore logs
kubectl logs -n vextrus-production -l app=eventstore --tail=100

# Check finance service logs for snapshot errors
kubectl logs -n vextrus-production -l app=finance-service | grep -i "snapshot.*error"

# Verify EventStore connectivity
kubectl exec -n vextrus-production deployment/finance-service-production -- curl -v http://eventstore:2113/health/live
```

### HPA Not Scaling
```bash
# Check HPA status
kubectl describe hpa finance-service-production-hpa -n vextrus-production

# Verify metrics-server is running
kubectl get deployment metrics-server -n kube-system

# Check if metrics are available
kubectl top pods -n vextrus-production
```

---

## Best Practices

### Pre-Deployment Checklist
- [ ] Validate YAML syntax: `kubectl apply --dry-run=client -f <file>`
- [ ] Verify secrets exist
- [ ] Check cluster capacity: `kubectl top nodes`
- [ ] Review recent cluster events
- [ ] Ensure Prometheus/Grafana monitoring ready

### Post-Deployment Validation
- [ ] Verify all pods are running: `kubectl get pods`
- [ ] Check pod distribution across nodes
- [ ] Validate health endpoints return 200
- [ ] Confirm HPA is active and metrics available
- [ ] Test snapshot creation in logs
- [ ] Verify Prometheus is scraping metrics
- [ ] Check alert rules are loaded

### Rollout Strategy
1. Deploy to staging first
2. Monitor for 24 hours
3. Validate snapshot metrics
4. Check error rates and latency
5. Deploy to production during low-traffic window
6. Monitor closely for first 2 hours
7. Keep previous version available for quick rollback

---

## Useful Aliases

Add to `~/.bashrc` or `~/.zshrc`:
```bash
alias kgp='kubectl get pods -n vextrus-production'
alias kgd='kubectl get deployments -n vextrus-production'
alias kgs='kubectl get services -n vextrus-production'
alias kdp='kubectl describe pod -n vextrus-production'
alias klf='kubectl logs -f -n vextrus-production'
alias kex='kubectl exec -it -n vextrus-production'

# Finance-specific
alias kfp='kubectl get pods -n vextrus-production -l app=finance-service'
alias kfl='kubectl logs -f -n vextrus-production -l app=finance-service'
alias kfh='kubectl get hpa -n vextrus-production -l app=finance-service'
```

---

**Last Updated:** 2025-10-17
**Documentation Version:** 1.0
