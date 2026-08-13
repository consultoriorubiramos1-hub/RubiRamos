export type Usuario = {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    verified: boolean;
    active: boolean;
    rol_id: number;
};

export type UsuarioAuth = {
  id: string;
  username: string;
  email: string;
  verified: boolean;
  active: boolean;
  rol_id: number;
};

export type Paciente = {
    id: number;
    first_name: string;
    second_name: string | null;
    last_name: string;
    second_last_name: string | null;
    age: number;
    phone: string;
    email: string;
    password: string;
    code: string;
    expiracion: Date | null;
    recovery_token: string | null;
    recovery_exp: Date | null;
    verified: boolean;
    created_at: Date;
    updated_at: Date;
    active: Boolean;
};

export type Categoria = {
    id: number;
    name: string;
    description: string;
    created_at: Date;
    updated_at: Date;
    active: Boolean;
};

export type Producto = {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    image_url: string;
    created_at: Date;
    updated_at: Date;
    active: Boolean;
};

export type Producto_Categoria = {
    producto_id: number;
    categoria_id: number;
    created_at: Date;
}

export type Auditoria = {
    id: number;
    usuario: string;
    accion: 'INSERT' | 'UPDATE' | 'DELETE';
    tabla_afectada: string;
    query_text: string | null;
    datos_anteriores: any | null;
    datos_nuevos: any | null;
    created_at: Date;
};