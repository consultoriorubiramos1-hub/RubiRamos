import { NextResponse } from 'next/server';
import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;

    if (!filename || !filename.toLowerCase().endsWith('.tar')) {
      return NextResponse.json(
        { ok: false, message: 'Archivo inválido' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'backups', filename);
    await access(filePath);

    const nodeStream = createReadStream(filePath);
    const webStream = Readable.toWeb(
      nodeStream
    ) as unknown as ReadableStream<Uint8Array>;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-tar',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: 'No se encontró el backup' },
      { status: 404 }
    );
  }
}