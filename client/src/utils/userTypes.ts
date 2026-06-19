export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  role_id?: number | string;
  is_active: boolean | number;
  created_at: string;
}

export interface UserFormData {
  username: string;
  email: string;
  full_name: string;
  role_id: string | number;
  is_active: boolean | number;
  password: string;
}

export interface Role {
  id: number;
  role_name: string;
}
