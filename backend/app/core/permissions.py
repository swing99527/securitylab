"""
RBAC Permission definitions and utilities
"""
from typing import Dict, List, Set

# Role-based permissions matrix
ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "admin": ["*"],  # All permissions
    
    "director": [
        "dashboard:view",
        "project:*",
        "report:view", "report:review", "report:sign", "report:download",
        "sample:view",
        "compliance:view", "compliance:approve",
        "knowledge:view",
        "settings:view", "settings:hardware",
        "hardware:*",
    ],
    
    "manager": [
        "dashboard:view",
        "project:view", "project:create", "project:edit", "project:assign",
        "task:view", "task:create",
        "report:view", "report:create", "report:download",
        "sample:view", "sample:checkout", "sample:return",
        "compliance:view",
        "knowledge:view", "knowledge:create",
        "settings:view",
    ],
    
    "engineer": [
        "dashboard:view",
        "project:view",
        "task:view", "task:create", "task:execute", "task:pause", "task:cancel",
        "report:view", "report:create", "report:edit",
        "sample:view", "sample:checkout", "sample:return",
        "compliance:view", "compliance:edit",
        "knowledge:view", "knowledge:create", "knowledge:edit",
        "settings:view",
    ],
    
    "reviewer": [
        "dashboard:view",
        "project:view",
        "task:view",
        "report:view", "report:review", "report:download",
        "compliance:view", "compliance:approve",
        "knowledge:view",
        "settings:view",
    ],
    
    "signer": [
        "dashboard:view",
        "project:view",
        "report:view", "report:sign", "report:download",
        "knowledge:view",
        "settings:view",
    ],
    
    "sample_admin": [
        "dashboard:view",
        "project:view",
        "sample:*",
        "knowledge:view",
        "settings:view",
    ],
    
    "client": [
        "project:view",  # Only own projects
        "report:view", "report:download",  # Only own reports
        "sample:view",  # Only own samples
    ],
}

def get_role_permissions(role: str) -> Set[str]:
    """Get all permissions for a role"""
    return set(ROLE_PERMISSIONS.get(role, []))

def has_permission(user_role: str, required_permission: str) -> bool:
    """
    Check if a user role has a specific permission
    
    Args:
        user_role: User's role
        required_permission: Permission to check (format: "module:action")
    
    Returns:
        True if user has permission, False otherwise
    """
    if user_role not in ROLE_PERMISSIONS:
        return False
    
    user_perms = ROLE_PERMISSIONS[user_role]
    
    # Admin has all permissions
    if "*" in user_perms:
        return True
    
    # Exact match
    if required_permission in user_perms:
        return True
    
    # Wildcard match (e.g., "task:*" matches "task:create")
    module = required_permission.split(":")[0]
    if f"{module}:*" in user_perms:
        return True
    
    return False

def has_any_permission(user_role: str, required_permissions: List[str]) -> bool:
    """Check if user has ANY of the required permissions"""
    return any(has_permission(user_role, perm) for perm in required_permissions)

def has_all_permissions(user_role: str, required_permissions: List[str]) -> bool:
    """Check if user has ALL of the required permissions"""
    return all(has_permission(user_role, perm) for perm in required_permissions)
