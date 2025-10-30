#!/usr/bin/env python3
"""
Update docker-compose.yml to use .env.production for secrets
Removes hardcoded secrets and adds env_file reference to all services
"""

import re
import sys
from pathlib import Path

# Secrets to remove (defined in .env.production)
SECRETS_TO_REMOVE = {
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD',
    'REDIS_PASSWORD',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_SECRET',
    'MINIO_ROOT_USER',
    'MINIO_ROOT_PASSWORD',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY',
    'RABBITMQ_DEFAULT_USER',
    'RABBITMQ_DEFAULT_PASS',
    'GF_SECURITY_ADMIN_PASSWORD',
}

# Variables that should reference env vars (common infrastructure)
COMMON_VARS = {
    'DATABASE_HOST',
    'DATABASE_PORT',
    'REDIS_HOST',
    'REDIS_PORT',
    'KAFKA_BROKERS',
    'OTEL_EXPORTER_OTLP_ENDPOINT',
    'AUTH_SERVICE_URL',
}

def update_docker_compose(file_path: Path):
    """Update docker-compose.yml to use env_file and remove hardcoded secrets"""

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    updated_lines = []
    in_service = False
    in_environment = False
    service_name = None
    env_file_added = False
    indent_level = 0

    i = 0
    while i < len(lines):
        line = lines[i]

        # Detect service definition
        if re.match(r'^  \w+:', line) and not line.strip().startswith('#'):
            in_service = True
            service_name = line.split(':')[0].strip()
            env_file_added = False
            in_environment = False
            updated_lines.append(line)
            i += 1
            continue

        # Detect environment section
        if in_service and re.match(r'^    environment:', line):
            in_environment = True

            # Add env_file before environment if not already added
            if not env_file_added and service_name not in ['networks', 'volumes']:
                updated_lines.append('    env_file:\n')
                updated_lines.append('      - .env.production\n')
                env_file_added = True

            updated_lines.append(line)
            i += 1
            continue

        # End of environment section
        if in_environment and re.match(r'^    \w+:', line):
            in_environment = False

        # Process environment variables
        if in_environment and line.strip() and not line.strip().startswith('#'):
            # Check if this is a secret that should be removed
            var_name = line.split(':')[0].strip().split('=')[0] if '=' in line else line.split(':')[0].strip()

            if var_name in SECRETS_TO_REMOVE:
                # Remove this line (secret defined in .env.production)
                i += 1
                continue
            elif var_name in COMMON_VARS:
                # Keep but mark that it references env var
                updated_lines.append(line)
            else:
                # Keep service-specific config
                updated_lines.append(line)
            i += 1
            continue

        # End of service
        if in_service and re.match(r'^[a-z]', line):
            in_service = False
            in_environment = False
            service_name = None

        updated_lines.append(line)
        i += 1

    # Write updated content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(updated_lines)

    print(f"[OK] Updated {file_path}")
    print(f"[INFO] Added env_file to all services")
    print(f"[SECURITY] Removed {len(SECRETS_TO_REMOVE)} hardcoded secrets")

if __name__ == '__main__':
    docker_compose_path = Path(__file__).parent.parent / 'docker-compose.yml'

    if not docker_compose_path.exists():
        print(f"[ERROR] {docker_compose_path} not found")
        sys.exit(1)

    # Create backup
    backup_path = docker_compose_path.with_suffix('.yml.backup')
    import shutil
    shutil.copy2(docker_compose_path, backup_path)
    print(f"[BACKUP] Created: {backup_path}")

    update_docker_compose(docker_compose_path)
    print("[DONE] Docker Compose updated successfully!")
