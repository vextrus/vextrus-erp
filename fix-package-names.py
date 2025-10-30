import os
import json

services = ["crm", "finance", "hr", "organization", "project-management", "scm"]

for service in services:
    package_file = f"services/{service}/package.json"

    # Read the file
    with open(package_file, 'r') as f:
        content = f.read()

    # Replace the incorrect package names
    content = content.replace('"@vextrus/shared-kernel"', '"@vextrus/kernel"')
    content = content.replace('"@vextrus/shared-contracts"', '"@vextrus/contracts"')
    content = content.replace('"@vextrus/shared-utils"', '"@vextrus/utils"')

    # Write back
    with open(package_file, 'w') as f:
        f.write(content)

    print(f"[OK] Fixed package names in {service}/package.json")

print("\nAll package.json files fixed!")