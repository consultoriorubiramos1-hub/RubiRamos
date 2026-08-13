"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  CircleStackIcon,
  ArrowDownTrayIcon,
  UsersIcon,
  ArchiveBoxIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";

export const dynamic = 'force-dynamic';

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

type UsersApiResponse = {
  ok?: boolean;
  data?: UserRow[];
  message?: string;
};

type BackupRow = {
  filename: string;
  sizeBytes: number;
  createdAt: string;
  downloadUrl: string;
};

type BackupsApiResponse = {
  ok?: boolean;
  data?: BackupRow[];
  message?: string;
};

type StatsResponse = {
  ok?: boolean;
  data?: {
    dbName: string;
    dbSizeBytes: number;
    dbSizePretty: string;
    backupsCount: number;
    backupsTotalBytes: number;
    backupsTotalPretty: string;
  };
  message?: string;
};

type ExportTablesResponse = {
  ok?: boolean;
  data?: string[];
  message?: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Error";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
}

function formatDate(date: string | null): string {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("es-MX");
}

function getSafeDownloadName(base: string, ext: string): string {
  return `${base.replaceAll(/[^a-zA-Z0-9_-]/g, "_")}.${ext}`;
}

type StatCardProps = Readonly<{
  title: string;
  value: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}>;

function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#E6E3DE] hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-wide font-semibold text-[#6E7C72]">{title}</p>
          <p className="mt-1 text-2xl font-black text-[#2C3E34]">{value}</p>
        </div>
        <div className="rounded-xl bg-[#6B8E7B]/10 p-2">
          <Icon className="h-6 w-6 text-[#6B8E7B]" />
        </div>
      </div>
    </div>
  );
}

type PillProps = Readonly<{
  text: string | null;
}>;

function Pill({ text }: PillProps) {
  const value = text ?? "SIN ROL";

  const cls =
    value.toUpperCase() === "ADMIN"
      ? "bg-[#F58634]/20 text-[#F58634] ring-[#F58634]/30"
      : value.toUpperCase() === "PACIENTE"
        ? "bg-[#6B8E7B]/20 text-[#6B8E7B] ring-[#6B8E7B]/30"
        : "bg-[#A8CF45]/20 text-[#A8CF45] ring-[#A8CF45]/30";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${cls}`}
    >
      {value}
    </span>
  );
}

type SectionCardProps = Readonly<{
  title: string;
  subtitle?: string;
  children: ReactNode;
}>;

function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#E6E3DE]">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold font-serif text-[#2C3E34]">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-[#6E7C72]">{subtitle}</p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

type FieldProps = Readonly<{
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
}>;

function Field({ label, icon: Icon, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-[#6E7C72]">
        <Icon className="h-4 w-4 text-[#6B8E7B]" />
        {label}
      </span>
      {children}
    </label>
  );
}

export default function AdminDbPage() {
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);

  const [rows, setRows] = useState<UserRow[]>([]);
  const [backups, setBackups] = useState<BackupRow[]>([]);
  const [tables, setTables] = useState<string[]>([]);

  const [q, setQ] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [exportFormat, setExportFormat] = useState<"csv" | "tar">("csv");

  const [stats, setStats] = useState({
    dbName: "neondb",
    dbSizePretty: "0 B",
    backupsCount: 0,
    backupsTotalPretty: "0 B",
  });

  const today = new Date();
  const defaultDate = today.toISOString().slice(0, 10);
  const defaultTime =
    String(today.getHours()).padStart(2, "0") +
    ":" +
    String(today.getMinutes()).padStart(2, "0");

  const [backupDate, setBackupDate] = useState<string>(defaultDate);
  const [backupTime, setBackupTime] = useState<string>(defaultTime);

  const scheduledAt = useMemo(() => {
    return `${backupDate} ${backupTime}`;
  }, [backupDate, backupTime]);

  async function downloadFile(url: string, filename: string): Promise<void> {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      throw new Error("No se pudo descargar el archivo");
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(objectUrl);
  }

  async function loadUsers(): Promise<void> {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/db/pacientes", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar usuarios");

      const data: UsersApiResponse = await res.json();
      setRows(data?.data ?? []);
    } catch (e: unknown) {
      alert(getErrorMessage(e));
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadStats(): Promise<void> {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/db/stats", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudieron cargar estadísticas");

      const data: StatsResponse = await res.json();
      if (data.data) {
        setStats({
          dbName: data.data.dbName,
          dbSizePretty: data.data.dbSizePretty,
          backupsCount: data.data.backupsCount,
          backupsTotalPretty: data.data.backupsTotalPretty,
        });
      }
    } catch (e: unknown) {
      alert(getErrorMessage(e));
    } finally {
      setLoadingStats(false);
    }
  }

  async function loadBackups(): Promise<void> {
    try {
      const res = await fetch("/api/db/backups", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar el historial de backups");

      const data: BackupsApiResponse = await res.json();
      setBackups(data?.data ?? []);
    } catch (e: unknown) {
      alert(getErrorMessage(e));
    }
  }

  async function loadTables(): Promise<void> {
    try {
      const res = await fetch("/api/db/export?list=true", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("No se pudieron cargar las tablas");

      const data: ExportTablesResponse = await res.json();
      setTables(data?.data ?? []);
    } catch (e: unknown) {
      alert(getErrorMessage(e));
    }
  }

  async function refreshAll(): Promise<void> {
    await Promise.all([loadUsers(), loadStats(), loadBackups(), loadTables()]);
  }

  async function generateBackup(): Promise<void> {
    setLoadingBackup(true);
    try {
      const res = await fetch(
        `/api/db/backup?date=${encodeURIComponent(backupDate)}&time=${encodeURIComponent(backupTime)}`,
        { cache: "no-store" },
      );

      if (!res.ok) {
        let msg = "No se pudo generar backup";
        try {
          const j = (await res.json()) as { message?: string; detail?: string };
          msg = j.detail
            ? `${j.message ?? msg}\n${j.detail}`
            : (j.message ?? msg);
        } catch {}
        throw new Error(msg);
      }

      const data = (await res.json()) as {
        ok?: boolean;
        downloadUrl?: string;
        filename?: string;
      };

      await Promise.all([loadStats(), loadBackups()]);

      if (data.downloadUrl && data.filename) {
        await downloadFile(data.downloadUrl, data.filename);
      }
    } catch (e: unknown) {
      alert(getErrorMessage(e));
    } finally {
      setLoadingBackup(false);
    }
  }

  async function exportTable(): Promise<void> {
    if (!selectedTable) {
      alert("Selecciona una tabla");
      return;
    }

    setLoadingExport(true);
    try {
      const url = `/api/db/export?table=${encodeURIComponent(
        selectedTable,
      )}&format=${encodeURIComponent(exportFormat)}`;

      await downloadFile(url, getSafeDownloadName(selectedTable, exportFormat));
    } catch (e: unknown) {
      alert(getErrorMessage(e));
    } finally {
      setLoadingExport(false);
    }
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  const filteredUsers = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;

    return rows.filter((r) => {
      const full =
        `${r.id} ${r.username ?? ""} ${r.email ?? ""} ${r.rol ?? ""}`.toLowerCase();
      return full.includes(qq);
    });
  }, [rows, q]);

  const totalUsers = rows.length;
  const verifiedCount = rows.filter((r) => r.verified === true).length;
  const activeCount = rows.filter((r) => r.active === true).length;

  return (
    <div className="p-6 bg-[#FAF9F7] min-h-screen">
      {/* Header principal */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#E6E3DE] mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#6B8E7B]/10 p-3">
              <CircleStackIcon className="h-7 w-7 text-[#6B8E7B]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif text-[#2C3E34]">Administrar Base de Datos</h1>
              <p className="mt-1 text-sm text-[#6E7C72]">
                Dashboard de gestión, respaldos y exportación de datos
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={refreshAll}
              disabled={loadingUsers || loadingStats}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B8E7B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4a7768] disabled:opacity-50 shadow-sm"
            >
              <UsersIcon className="h-5 w-5" />
              Actualizar dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Tamaño BD"
          value={loadingStats ? "..." : stats.dbSizePretty}
          icon={CircleStackIcon}
        />
        <StatCard
          title="Respaldos generados"
          value={loadingStats ? "..." : `${stats.backupsCount}`}
          icon={ArchiveBoxIcon}
        />
        <StatCard
          title="Peso total respaldos"
          value={loadingStats ? "..." : stats.backupsTotalPretty}
          icon={ArrowDownTrayIcon}
        />
        <StatCard
          title="Usuarios registrados"
          value={`${totalUsers}`}
          icon={UsersIcon}
        />
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Columna izquierda */}
        <div className="xl:col-span-2 space-y-6">
          <SectionCard
  title="Generar respaldo"
  subtitle="Crea un backup completo de la base de datos"
>
  <div className="grid grid-cols-1 gap-4">
    {/* Info del formato del archivo */}
    <div className="rounded-xl bg-[#6B8E7B]/5 p-4 border border-[#6B8E7B]/20">
      <p className="text-xs font-semibold text-[#6B8E7B]">
        Formato del archivo:
      </p>
      <p className="mt-1 text-sm font-mono text-[#2C3E34]">
        backup_neondb_{new Date().toISOString().slice(0, 10)}_{new Date().getHours()}-{new Date().getMinutes()}.tar
      </p>
      <p className="mt-2 text-xs text-[#6E7C72]">
        El respaldo se genera con la fecha y hora actual del sistema
      </p>
    </div>

    <button
      onClick={generateBackup}
      disabled={loadingBackup}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#BD7D4A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#a66a3a] disabled:opacity-50 shadow-sm"
    >
      <ArrowDownTrayIcon className="h-5 w-5" />
      {loadingBackup ? "Generando respaldo..." : "Generar y descargar backup"}
    </button>

    <p className="text-xs text-[#6E7C72]">
      El respaldo se guarda en la carpeta{" "}
      <span className="font-semibold text-[#2C3E34]">/backups</span> y
      queda disponible en el historial para descargarlo después.
    </p>
  </div>
</SectionCard>

          <SectionCard
            title="Exportar tabla"
            subtitle="Selecciona una tabla y el formato de exportación"
          >
            <div className="grid grid-cols-1 gap-4">
              <Field label="Tabla" icon={TableCellsIcon}>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full rounded-xl bg-[#FAF9F7] px-4 py-2 text-sm text-[#2C3E34] border border-[#E6E3DE] focus:border-[#6B8E7B] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                >
                  <option value="">Selecciona una tabla</option>
                  {tables.map((table) => (
                    <option key={table} value={table}>
                      {table}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Formato" icon={ArchiveBoxIcon}>
                <select
                  value={exportFormat}
                  onChange={(e) =>
                    setExportFormat(e.target.value as "csv" | "tar")
                  }
                  className="w-full rounded-xl bg-[#FAF9F7] px-4 py-2 text-sm text-[#2C3E34] border border-[#E6E3DE] focus:border-[#6B8E7B] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                >
                  <option value="csv">CSV</option>
                  <option value="tar">TAR</option>
                </select>
              </Field>

              <button
                onClick={exportTable}
                disabled={!selectedTable || loadingExport}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B8E7B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4a7768] disabled:opacity-50 shadow-sm"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                {loadingExport ? "Exportando..." : "Exportar tabla"}
              </button>

              <p className="text-xs text-[#6E7C72]">
                Exporta cualquier tabla en formato{" "}
                <span className="font-semibold text-[#2C3E34]">CSV</span> o{" "}
                <span className="font-semibold text-[#2C3E34]">TAR</span>.
              </p>
            </div>
          </SectionCard>
        </div>

        {/* Columna derecha - Tabla de usuarios */}
        <div className="xl:col-span-3">
          <SectionCard
            title="Usuarios y roles"
            subtitle={`Base de datos: ${stats.dbName}`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por ID, usuario, email o rol..."
                className="w-full rounded-xl bg-[#FAF9F7] px-4 py-2 text-sm text-[#2C3E34] border border-[#E6E3DE] placeholder:text-[#6E7C72]/50 focus:border-[#6B8E7B] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
              />
              <div className="text-xs text-[#6E7C72] whitespace-nowrap">
                Verificados:{" "}
                <span className="font-semibold text-[#2C3E34]">{verifiedCount}</span>{" "}
                · Activos:{" "}
                <span className="font-semibold text-[#2C3E34]">{activeCount}</span>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl border border-[#E6E3DE]">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#6B8E7B]/5 text-xs text-[#6B8E7B] border-b border-[#E6E3DE]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold">Usuario</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Rol</th>
                    <th className="px-4 py-3 font-semibold">Verificado</th>
                    <th className="px-4 py-3 font-semibold">Activo</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E6E3DE] bg-white">
                  {loadingUsers && (
                    <tr>
                      <td className="px-4 py-4 text-[#6E7C72]" colSpan={6}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-[#6B8E7B] border-t-transparent rounded-full animate-spin"></div>
                          Cargando usuarios...
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loadingUsers && filteredUsers.length === 0 && (
                    <tr>
                      <td className="px-4 py-4 text-[#6E7C72]" colSpan={6}>
                        No hay datos registrados.
                      </td>
                    </tr>
                  )}

                  {!loadingUsers &&
                    filteredUsers.map((r) => (
                      <tr key={r.id} className="hover:bg-[#FAF9F7] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-[#2C3E34]">{r.id}</td>
                        <td className="px-4 py-3 text-[#2C3E34]">{r.username ?? "-"}</td>
                        <td className="px-4 py-3 text-[#6E7C72]">{r.email ?? "-"}</td>
                        <td className="px-4 py-3">
                          <Pill text={r.rol} />
                        </td>
                        <td className="px-4 py-3">
                          {r.verified ? (
                            <span className="text-[#A8CF45] font-semibold">✓ Sí</span>
                          ) : (
                            <span className="text-[#F58634]">✗ No</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.active ? (
                            <span className="text-[#A8CF45] font-semibold">✓ Sí</span>
                          ) : (
                            <span className="text-[#6E7C72]">✗ No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Historial de respaldos */}
      <div className="mt-6">
        <SectionCard
          title="Historial de respaldos"
          subtitle="Descarga cualquier respaldo generado anteriormente"
        >
          <div className="overflow-x-auto rounded-xl border border-[#E6E3DE]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#6B8E7B]/5 text-xs text-[#6B8E7B] border-b border-[#E6E3DE]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Archivo</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Peso</th>
                  <th className="px-4 py-3 font-semibold">Acción</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E6E3DE] bg-white">
                {backups.length === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-[#6E7C72]" colSpan={4}>
                      No hay respaldos generados todavía.
                    </td>
                  </tr>
                )}

                {backups.map((backup) => (
                  <tr
                    key={backup.filename}
                    className="hover:bg-[#FAF9F7] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#2C3E34]">{backup.filename}</td>
                    <td className="px-4 py-3 text-[#6E7C72]">
                      {formatDate(backup.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-[#2C3E34]">
                      {formatBytes(backup.sizeBytes)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={async () => {
                          try {
                            await downloadFile(
                              backup.downloadUrl,
                              backup.filename,
                            );
                          } catch (e: unknown) {
                            alert(getErrorMessage(e));
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#6B8E7B]/10 px-3 py-2 text-xs font-semibold text-[#6B8E7B] transition hover:bg-[#6B8E7B]/20"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Descargar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}