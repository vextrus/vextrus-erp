#!/usr/bin/env python3
"""Add csrfPrevention: false to services with inline GraphQL configs."""

import re
import sys
from pathlib import Path

SERVICES = [
    'workflow',
    'scheduler',
    'notification',
    'audit',
    'import-export',
    'file-storage',
    'document-generator',
]

def update_csrf_prevention(app_module_path):
    """Add csrfPrevention: false if not present."""
    with open(app_module_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if csrfPrevention already exists
    if 'csrfPrevention' in content:
        print(f"  [OK] csrfPrevention already set")
        return False

    # Pattern: Find plugins line and add csrfPrevention after it
    pattern = r'(plugins:\s*\[ApolloServerPluginLandingPageLocalDefault\(\)\],)\s*\n'
    replacement = r'\1\n        csrfPrevention: false, // Required for Apollo Sandbox\n'

    updated_content = re.sub(pattern, replacement, content)

    if updated_content == content:
        print(f"  [SKIP] Could not find pattern to update")
        return False

    with open(app_module_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)

    print(f"  [DONE] Added csrfPrevention: false")
    return True

def main():
    base_path = Path(__file__).parent
    updated_count = 0

    for service in SERVICES:
        app_module = base_path / 'services' / service / 'src' / 'app.module.ts'

        if not app_module.exists():
            print(f"[ERROR] {service}: app.module.ts not found")
            continue

        print(f"\n[{service}]:")
        if update_csrf_prevention(app_module):
            updated_count += 1

    print(f"\n[SUCCESS] Updated {updated_count}/{len(SERVICES)} services")

if __name__ == '__main__':
    main()
