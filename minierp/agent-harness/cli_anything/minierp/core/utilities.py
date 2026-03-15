"""Core: Utilities — export, backup, data management."""

from typing import Optional, Any
from cli_anything.minierp.utils.erp_backend import make_client


def export_data(
    entity_type: str,
    format: str = "csv",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> dict:
    """Export data to CSV or JSON."""
    client = make_client()
    params = {"format": format}
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date
    return client.get(f"/utils/export/{entity_type}", params=params)


def backup_database(backup_name: Optional[str] = None) -> dict:
    """Create database backup."""
    client = make_client()
    body = {}
    if backup_name:
        body["backup_name"] = backup_name
    return client.post("/utils/backup", body=body)


def list_backups() -> list[dict]:
    """List available backups."""
    client = make_client()
    return client.get("/utils/backups")


def restore_backup(backup_id: int) -> dict:
    """Restore from backup."""
    client = make_client()
    return client.post(f"/utils/restore/{backup_id}")


def delete_backup(backup_id: int) -> dict:
    """Delete a backup."""
    client = make_client()
    return client.delete(f"/utils/backups/{backup_id}")


def get_system_info() -> dict:
    """Get system information."""
    client = make_client()
    return client.get("/utils/system-info")


def clear_cache() -> dict:
    """Clear application cache."""
    client = make_client()
    return client.post("/utils/clear-cache")


def optimize_database() -> dict:
    """Run database optimization (VACUUM, ANALYZE)."""
    client = make_client()
    return client.post("/utils/optimize-db")


def get_database_stats() -> dict:
    """Get database statistics."""
    client = make_client()
    return client.get("/utils/db-stats")


def import_data(
    entity_type: str,
    file_path: str,
    format: str = "csv",
) -> dict:
    """Import data from file."""
    client = make_client()
    return client.post(
        f"/utils/import/{entity_type}",
        body={"file_path": file_path, "format": format},
    )


def get_audit_log(
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100,
) -> list[dict]:
    """Get audit log entries."""
    client = make_client()
    params = {"limit": limit}
    if entity_type:
        params["entity_type"] = entity_type
    if entity_id:
        params["entity_id"] = entity_id
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date
    return client.get("/utils/audit-log", params=params)


def get_data_dictionary() -> dict:
    """Get data dictionary (schema documentation)."""
    client = make_client()
    return client.get("/utils/data-dictionary")


def run_health_check() -> dict:
    """Run system health check."""
    client = make_client()
    return client.get("/utils/health-check")
