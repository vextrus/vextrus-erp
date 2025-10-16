#!/usr/bin/env python3
"""
Health Endpoint Testing Script for Vextrus ERP Services
Tests all health endpoint variations for all 13 services systematically
"""

import requests
import json
import time
from typing import Dict, List, Optional

class HealthEndpointTester:
    def __init__(self):
        self.services = {
            1: {"name": "Auth", "port": 3001, "status": "running"},
            2: {"name": "Master Data", "port": 3002, "status": "running"},
            3: {"name": "Notification", "port": 3003, "status": "port_not_exposed"},
            4: {"name": "Configuration", "port": 3004, "status": "port_not_exposed"},
            5: {"name": "Scheduler", "port": 3005, "status": "port_not_exposed"},
            6: {"name": "Document Generator", "port": 3006, "status": "port_not_exposed"},
            7: {"name": "Import-Export", "port": 3007, "status": "not_running"},
            8: {"name": "File Storage", "port": 3008, "status": "not_running"},
            9: {"name": "Audit", "port": 3009, "status": "port_not_exposed"},
            11: {"name": "Workflow", "port": 3011, "status": "running"},
            12: {"name": "Rules Engine", "port": 3012, "status": "running"},
            16: {"name": "Organization", "port": 3016, "status": "running"},
            4000: {"name": "API Gateway", "port": 4000, "status": "running"}
        }

        self.health_paths = [
            "/health",
            "/api/health",
            "/api/v1/health",
            "/health/live",
            "/health/ready"
        ]

        self.results = {}

    def test_service_health(self, service_id: int, service_info: Dict) -> Dict:
        """Test all health endpoints for a single service"""
        service_name = service_info["name"]
        port = service_info["port"]
        status = service_info["status"]

        print(f"\n=== Testing {service_name} Service ({port}) ===")

        if status in ["not_running", "port_not_exposed"]:
            print(f"[WARNING] Service {service_name}: {status.replace('_', ' ').title()}")
            return {"service": service_name, "port": port, "status": status, "endpoints": {}}

        service_results = {
            "service": service_name,
            "port": port,
            "status": "running",
            "endpoints": {}
        }

        for path in self.health_paths:
            url = f"http://localhost:{port}{path}"
            try:
                response = requests.get(url, timeout=5)
                status_code = response.status_code

                if status_code == 200:
                    print(f"[SUCCESS] {path}: SUCCESS (200)")
                    try:
                        content = response.json()
                        service_results["endpoints"][path] = {
                            "status": "success",
                            "code": 200,
                            "response": content
                        }
                    except:
                        service_results["endpoints"][path] = {
                            "status": "success",
                            "code": 200,
                            "response": response.text
                        }
                elif status_code == 404:
                    print(f"[FAILED] {path}: NOT FOUND (404)")
                    service_results["endpoints"][path] = {
                        "status": "not_found",
                        "code": 404
                    }
                else:
                    print(f"[FAILED] {path}: FAILED ({status_code})")
                    service_results["endpoints"][path] = {
                        "status": "failed",
                        "code": status_code
                    }

            except requests.exceptions.ConnectionError:
                print(f"[FAILED] {path}: CONNECTION REFUSED")
                service_results["endpoints"][path] = {
                    "status": "connection_refused",
                    "code": 0
                }
            except requests.exceptions.Timeout:
                print(f"[FAILED] {path}: TIMEOUT")
                service_results["endpoints"][path] = {
                    "status": "timeout",
                    "code": 0
                }
            except Exception as e:
                print(f"[ERROR] {path}: ERROR - {str(e)}")
                service_results["endpoints"][path] = {
                    "status": "error",
                    "code": 0,
                    "error": str(e)
                }

        return service_results

    def test_all_services(self):
        """Test health endpoints for all services"""
        print("HEALTH ENDPOINT TESTING FOR VEXTRUS ERP SERVICES")
        print("=" * 60)

        for service_id, service_info in self.services.items():
            result = self.test_service_health(service_id, service_info)
            self.results[service_id] = result
            time.sleep(0.5)  # Brief pause between services

    def generate_report(self):
        """Generate comprehensive health endpoint report"""
        print("\n" + "=" * 80)
        print("COMPREHENSIVE HEALTH ENDPOINT REPORT")
        print("=" * 80)

        working_services = []
        failed_services = []
        unavailable_services = []

        for service_id, result in self.results.items():
            service_name = result["service"]
            port = result["port"]
            status = result["status"]

            if status in ["not_running", "port_not_exposed"]:
                unavailable_services.append(f"{service_name} ({port}) - {status}")
                continue

            working_endpoints = []
            for path, endpoint_result in result["endpoints"].items():
                if endpoint_result["status"] == "success":
                    working_endpoints.append(path)

            if working_endpoints:
                working_services.append({
                    "service": service_name,
                    "port": port,
                    "endpoints": working_endpoints
                })
            else:
                failed_services.append(f"{service_name} ({port}) - No working health endpoints")

        print(f"\nWORKING SERVICES ({len(working_services)}):")
        for service in working_services:
            endpoints_str = ", ".join(service["endpoints"])
            print(f"  * {service['service']} ({service['port']}): {endpoints_str}")

        print(f"\nSERVICES WITH NO WORKING HEALTH ENDPOINTS ({len(failed_services)}):")
        for service in failed_services:
            print(f"  * {service}")

        print(f"\nUNAVAILABLE SERVICES ({len(unavailable_services)}):")
        for service in unavailable_services:
            print(f"  * {service}")

        # Summary table
        print(f"\nSUMMARY:")
        print(f"  Total Services: {len(self.services)}")
        print(f"  Services with Working Health Endpoints: {len(working_services)}")
        print(f"  Services with No Working Health Endpoints: {len(failed_services)}")
        print(f"  Unavailable Services: {len(unavailable_services)}")

        # Detailed endpoint analysis
        print(f"\nENDPOINT PATH ANALYSIS:")
        endpoint_stats = {}
        for path in self.health_paths:
            endpoint_stats[path] = {"success": 0, "total": 0}

        for service_id, result in self.results.items():
            if result["status"] in ["not_running", "port_not_exposed"]:
                continue

            for path in self.health_paths:
                endpoint_stats[path]["total"] += 1
                if path in result["endpoints"] and result["endpoints"][path]["status"] == "success":
                    endpoint_stats[path]["success"] += 1

        for path, stats in endpoint_stats.items():
            if stats["total"] > 0:
                success_rate = (stats["success"] / stats["total"]) * 100
                print(f"  {path}: {stats['success']}/{stats['total']} ({success_rate:.1f}%)")

    def save_results(self, filename: str = "health_endpoint_test_results.json"):
        """Save detailed results to JSON file"""
        with open(filename, 'w') as f:
            json.dump({
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "test_results": self.results,
                "summary": {
                    "total_services": len(self.services),
                    "tested_services": len([r for r in self.results.values() if r["status"] == "running"]),
                    "working_services": len([r for r in self.results.values()
                                           if r["status"] == "running" and
                                           any(ep["status"] == "success" for ep in r.get("endpoints", {}).values())])
                }
            }, f, indent=2)
        print(f"\nDetailed results saved to: {filename}")

def main():
    tester = HealthEndpointTester()
    tester.test_all_services()
    tester.generate_report()
    tester.save_results()

if __name__ == "__main__":
    main()