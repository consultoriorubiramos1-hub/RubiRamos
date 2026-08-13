import { NextResponse } from "next/server";
import { spawn } from "node:child_process";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const list = searchParams.get("list");
  const table = searchParams.get("table");
  const format = searchParams.get("format"); // csv | tar

  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!connectionString) {
    return NextResponse.json(
      { ok: false, message: "Falta DATABASE_URL" },
      { status: 500 }
    );
  }

  // ==============================
  // 🔹 LISTAR TABLAS (STRING[])
  // ==============================
  if (list === "true") {
    const psql = spawn("psql", [
      connectionString,
      "-t",
      "-c",
      "SELECT tablename FROM pg_tables WHERE schemaname='public';",
    ]);

    let output = "";

    for await (const chunk of psql.stdout) {
      output += chunk.toString();
    }

    const tables = output
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);

    return NextResponse.json({
      ok: true,
      data: tables, // 👈 IMPORTANTE: STRING[]
    });
  }

  // ==============================
  // 🔹 VALIDACIÓN
  // ==============================
  if (!table || !format) {
    return NextResponse.json(
      { ok: false, message: "Faltan parámetros" },
      { status: 400 }
    );
  }

  // ==============================
  // 🔹 EXPORT CSV
  // ==============================
  if (format === "csv") {
    const child = spawn("psql", [
      connectionString,
      "-c",
      `COPY ${table} TO STDOUT WITH CSV HEADER`,
    ]);

    return new NextResponse(child.stdout as any, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${table}.csv"`,
      },
    });
  }

  // ==============================
  // 🔹 EXPORT TAR
  // ==============================
  if (format === "tar") {
    const child = spawn("pg_dump", [
      "--dbname",
      connectionString,
      "-Ft",
      "-t",
      table,
    ]);

    return new NextResponse(child.stdout as any, {
      headers: {
        "Content-Type": "application/x-tar",
        "Content-Disposition": `attachment; filename="${table}.tar"`,
      },
    });
  }

  return NextResponse.json(
    { ok: false, message: "Formato inválido" },
    { status: 400 }
  );
}