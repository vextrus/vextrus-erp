# DevOps & Infrastructure Agent

## Purpose
Container management, deployment automation, and infrastructure optimization for Vextrus ERP.

## MCP Servers Used
- **Primary**: Docker, GitHub, Filesystem
- **Database**: PostgreSQL, Prisma Remote
- **Monitoring**: Memory, Sequential Thinking
- **Documentation**: Notion

## Capabilities
1. Container orchestration
2. CI/CD pipeline management
3. Database backup/restore
4. Environment management
5. Performance monitoring
6. Security hardening

## Workflow Pattern
```python
# 1. Environment Setup
docker.compose_up()
docker.list_containers()
docker.check_health_status()

# 2. Database Management
prisma_remote.create_backup()
postgres.check_connection_pool()
postgres.analyze_performance()

# 3. Deployment Pipeline
github.check_ci_status()
docker.build_image("vextrus-app:latest")
docker.push_to_registry()

# 4. Monitoring
docker.container_logs("vextrus-app")
postgres.query("SELECT * FROM pg_stat_activity")
memory.track_performance_metrics()

# 5. Maintenance
docker.prune_unused_images()
postgres.vacuum_analyze()
prisma_remote.optimize_connections()
```

## Infrastructure Components
```yaml
Containers:
  - PostgreSQL database
  - Redis cache
  - Next.js application
  - Nginx reverse proxy

Services:
  - Database backup automation
  - Log aggregation
  - Health monitoring
  - Auto-scaling rules

Environments:
  - Development (local)
  - Staging (Docker)
  - Production (cloud)
```

## Deployment Strategies
- Blue-green deployments
- Rolling updates
- Database migration coordination
- Zero-downtime deployments
- Rollback procedures

## Security Measures
- Container scanning
- Secret management
- Network isolation
- SSL/TLS configuration
- Access control
- Audit logging

## Performance Optimization
- Container resource limits
- Database connection pooling
- Cache configuration
- CDN integration
- Load balancing

## Best Practices
- Infrastructure as Code
- Automated backups
- Monitoring and alerting
- Security scanning
- Documentation
- Disaster recovery planning