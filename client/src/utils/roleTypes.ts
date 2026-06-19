export interface Role {
  id: number;
  role_name: string;
  description?: string;
  is_system_role: boolean | number;
  is_active: boolean | number;
  permission_count?: number;
}

export interface RoleFormData {
  role_name: string;
  description: string;
  is_active: boolean | number;
}

export interface Permission {
  id: number;
  action: string;
  module: string;
  description?: string;
  assigned?: boolean;
}

export interface RolePermissionsData {
  permissionsByModule?: Record<string, Permission[]>;
}
