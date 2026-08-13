import { NextResponse } from 'next/server';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

type BackupItem = {
  filename: string;
  sizeBytes: number;
  createdAt: string;
  downloadUrl: string;
};

export const runtime = 'nodejs';

export async function GET() {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    await mkdir(backupDir, { recursive: true });

    const files = await readdir(backupDir);
    const tarFiles = files.filter((f) => f.toLowerCase().endsWith('.tar'));

    const items: BackupItem[] = [];

    for (const filename of tarFiles) {
      const fullPath = path.join(backupDir, filename);
      const info = await stat(fullPath);

      items.push({
        filename,
        sizeBytes: info.size,
        createdAt: info.birthtime.toISOString(),
        downloadUrl: `/api/db/backups/${encodeURIComponent(filename)}`,
      });
    }

    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ ok: true, data: items });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error al listar backups';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}