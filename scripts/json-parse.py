#!/usr/bin/env python
"""
Simple JSON parser for Windows environments where jq is not available.
Usage: python json-parse.py [field.path]
Example: curl -s http://localhost:3001/api/health | python json-parse.py status
"""
import sys
import json

def parse_json(json_str, path=None):
    try:
        data = json.loads(json_str)

        if path:
            # Navigate through the path (e.g., "status" or "data.items.0.name")
            parts = path.split('.')
            result = data
            for part in parts:
                if part.isdigit():
                    result = result[int(part)]
                else:
                    result = result[part]
            return result
        else:
            # Pretty print the entire JSON
            return json.dumps(data, indent=2)
    except json.JSONDecodeError as e:
        return f"Error parsing JSON: {e}"
    except (KeyError, IndexError, TypeError) as e:
        return f"Path not found: {path}"
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    # Read from stdin
    input_data = sys.stdin.read()

    # Get path argument if provided
    path = sys.argv[1] if len(sys.argv) > 1 else None

    result = parse_json(input_data, path)
    print(result)