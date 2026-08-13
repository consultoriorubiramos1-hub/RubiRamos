import { NextResponse } from 'next/server';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { query } from '@/lib/db';

type DbStatsRow = {
  db_name: string;
  db_size_bytes: string;
  db_size_pretty: string;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
}

export async function GET() {
  try {
    const sql = `
      SELECT
        current_database()::text AS db_name,
        pg_database_size(current_database())::text AS db_size_bytes,
        pg_size_pretty(pg_database_size(current_database()))::text AS db_size_pretty
    `;

    const { rows } = await query<DbStatsRow>(sql);
    const db = rows[0];

    const backupDir = path.join(process.cwd(), 'backups');
    await mkdir(backupDir, { recursive: true });

    const files = await readdir(backupDir);
    const tarFiles = files.filter((f) => f.toLowerCase().endsWith('.tar'));

    let backupsTotalBytes = 0;

    for (const filename of tarFiles) {
      const info = await stat(path.join(backupDir, filename));
      backupsTotalBytes += info.size;
    }

    return NextResponse.json({
      ok: true,
      data: {
        dbName: db?.db_name ?? 'neondb',
        dbSizeBytes: Number(db?.db_size_bytes ?? 0),
        dbSizePretty: db?.db_size_pretty ?? '0 bytes',
        backupsCount: tarFiles.length,
        backupsTotalBytes,
        backupsTotalPretty: formatBytes(backupsTotalBytes),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error al cargar estadísticas';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}