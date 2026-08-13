import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

type UserRow = {
  id: string;
  username: string | null;
  email: string | null;
  rol_id: string | null;
  rol: string | null;
  verified: boolean | null;
  active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function GET() {
  try {
    const sql = `
      SELECT
        u.id::text AS id,
        u.username::text AS username,
        u.email::text AS email,
        u.rol_id::text AS rol_id,
        r.rol::text AS rol,
        u.verified,
        u.active,
        u.created_at::text AS created_at,
        u.updated_at::text AS updated_at
      FROM tblusers u
      LEFT JOIN tblroles r ON r.id = u.rol_id
      ORDER BY u.created_at DESC, u.id DESC
      LIMIT 1000;
    `;

    const { rows } = await query<UserRow>(sql);
    return NextResponse.json({ ok: true, data: rows });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error al cargar usuarios';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}