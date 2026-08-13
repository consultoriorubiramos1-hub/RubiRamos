import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

function safe(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date =
    url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const time =
    url.searchParams.get('time') ?? new Date().toISOString().slice(11, 16);

  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!connectionString) {
    return NextResponse.json(
      { ok: false, message: 'Falta DATABASE_URL_UNPOOLED o DATABASE_URL' },
      { status: 500 }
    );
  }

  const backupDir = path.join(process.cwd(), 'backups');
  await mkdir(backupDir, { recursive: true });

  const filename = `backup_neondb_${safe(date)}_${safe(time)}.tar`;
  const filePath = path.join(backupDir, filename);

  const args = ['--dbname', connectionString, '-Ft', '-f', filePath];

  const child = spawn('pg_dump', args, {
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  const exitCode: number = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 0));
  });

  if (exitCode !== 0) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'pg_dump falló. Revisa que pg_dump esté instalado y que DATABASE_URL_UNPOOLED sea válida.',
        detail: stderr || `Exit code: ${exitCode}`,
      },
      { status: 500 }
    );
  }

  const info = await stat(filePath);

  if (info.size <= 0) {
    return NextResponse.json(
      {
        ok: false,
        message: 'El backup se generó vacío.',
        detail: stderr || 'Sin stderr',
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    filename,
    sizeBytes: info.size,
    createdAt: info.birthtime.toISOString(),
    downloadUrl: `/api/db/backups/${encodeURIComponent(filename)}`,
  });
}