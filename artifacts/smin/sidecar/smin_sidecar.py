"""Small, dependency-free Phase 1 sidecar boundary.

The desktop shell owns persistence. This process is intentionally limited to
deterministic validation primitives until later phases are approved.
"""
import json
import sys


def validate_record(record: dict) -> dict:
    required = ("hole_id", "easting", "northing", "elevation", "total_depth")
    missing = [key for key in required if key not in record or record[key] in ("", None)]
    return {"ok": not missing, "missing": missing, "hole_id": record.get("hole_id")}


def main() -> None:
    for line in sys.stdin:
        try:
            print(json.dumps(validate_record(json.loads(line))), flush=True)
        except (json.JSONDecodeError, TypeError) as error:
            print(json.dumps({"ok": False, "error": str(error)}), flush=True)


if __name__ == "__main__":
    main()