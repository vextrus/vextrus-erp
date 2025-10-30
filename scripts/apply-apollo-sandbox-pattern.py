#!/usr/bin/env python3
"""
Bulk apply Apollo Sandbox pattern to all GraphQL services
"""
import json
import re
import os
from pathlib import Path

SERVICES = [
    'finance', 'organization', 'configuration', 'rules-engine',
    'workflow', 'scheduler', 'notification', 'audit',
    'import-export', 'file-storage', 'document-generator'
]

EXPRESS_MIDDLEWARE = '''import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Explicitly add Express body parsing middleware
  // Required for Apollo Sandbox landing page to work properly
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter.getType() === 'express') {
    const expressApp = httpAdapter.getInstance();
    expressApp.use(express.json());
    expressApp.use(express.urlencoded({ extended: true }));
  }'''

def add_express_to_package_json(service_path):
    """Add express dependency to package.json"""
    pkg_path = service_path / 'package.json'
    if not pkg_path.exists():
        print(f"  ❌ package.json not found in {service_path}")
        return False

    with open(pkg_path, 'r', encoding='utf-8') as f:
        pkg = json.load(f)

    if 'express' in pkg.get('dependencies', {}):
        print(f"  [OK] express already in dependencies")
        return True

    # Find a good insertion point (after class-validator or first dependency)
    deps = pkg.get('dependencies', {})
    deps_list = list(deps.items())

    # Insert express after class-validator or at beginning
    new_deps = {}
    inserted = False
    for key, value in deps_list:
        new_deps[key] = value
        if key == 'class-validator' and not inserted:
            new_deps['express'] = '^4.18.2'
            inserted = True

    if not inserted:
        new_deps['express'] = '^4.18.2'

    pkg['dependencies'] = new_deps

    with open(pkg_path, 'w', encoding='utf-8') as f:
        json.dump(pkg, f, indent=2)
        f.write('\n')

    print(f"  [OK] Added express dependency")
    return True

def add_express_middleware_to_main(service_path):
    """Add Express middleware to main.ts"""
    main_path = service_path / 'src' / 'main.ts'
    if not main_path.exists():
        print(f"  [ERROR] main.ts not found in {service_path}/src")
        return False

    with open(main_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if already has express middleware
    if 'express.json()' in content:
        print(f"  [OK] Express middleware already present")
        return True

    # Add import
    if "import * as express from 'express';" not in content:
        # Find last import statement
        import_pattern = r"(import .+ from .+;)\n"
        imports = list(re.finditer(import_pattern, content))
        if imports:
            last_import_pos = imports[-1].end()
            content = (content[:last_import_pos] +
                      "\nimport * as express from 'express';\n" +
                      content[last_import_pos:])

    # Add middleware after app creation
    app_create_pattern = r'(const app = await NestFactory\.create\(AppModule\);)'

    middleware_code = '''

  // Explicitly add Express body parsing middleware
  // Required for Apollo Sandbox landing page to work properly
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter.getType() === 'express') {
    const expressApp = httpAdapter.getInstance();
    expressApp.use(express.json());
    expressApp.use(express.urlencoded({ extended: true }));
  }'''

    content = re.sub(
        app_create_pattern,
        r'\1' + middleware_code,
        content,
        count=1
    )

    with open(main_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  [OK] Added Express middleware to main.ts")
    return True

def process_service(service_name):
    """Process a single service"""
    print(f"\nProcessing: {service_name}")
    service_path = Path(f'services/{service_name}')

    if not service_path.exists():
        print(f"  ERROR: Service directory not found: {service_path}")
        return False

    success = True
    success &= add_express_to_package_json(service_path)
    success &= add_express_middleware_to_main(service_path)

    if success:
        print(f"  SUCCESS: {service_name} migration complete")
    else:
        print(f"  WARNING: {service_name} migration incomplete")

    return success

def main():
    print("=" * 60)
    print("Bulk Apollo Sandbox Pattern Application")
    print("=" * 60)

    os.chdir(Path(__file__).parent.parent)

    results = {}
    for service in SERVICES:
        results[service] = process_service(service)

    print("\n" + "=" * 60)
    print("Migration Summary")
    print("=" * 60)
    successful = sum(1 for v in results.values() if v)
    print(f"Successful: {successful}/{len(SERVICES)}")
    print(f"Failed: {len(SERVICES) - successful}/{len(SERVICES)}")

    if successful == len(SERVICES):
        print("\nAll services migrated successfully!")
    else:
        print("\nSome services need manual review:")
        for service, success in results.items():
            if not success:
                print(f"  - {service}")

if __name__ == '__main__':
    main()
