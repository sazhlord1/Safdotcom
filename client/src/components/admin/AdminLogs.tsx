import { useState, useEffect } from "react";
import api from "../../api/client";
import { AuditLogEntry, PaginatedLogs } from "../../api/types";
import { Spinner } from "../ui/Spinner";

const ACTION_LABELS: Record<string, string> = {
  JOIN: "پیوستن به صف",
  LEAVE: "خروج از صف",
  COMPLETE: "تکمیل گرم کردن",
  SWAP_OFFER_CREATED: "ایجاد پیشنهاد معاوضه",
  SWAP_OFFER_CANCELLED: "لغو پیشنهاد معاوضه",
  SWAP_REQUEST: "درخواست معاوضه",
  SWAP_ACCEPTED: "تأیید معاوضه",
  SWAP_REJECTED: "رد معاوضه",
  ADMIN_REMOVE: "حذف توسط مدیر",
  ADMIN_REORDER: "تغییر ترتیب توسط مدیر",
  ADMIN_RESET: "بازنشانی توسط مدیر",
};

const ACTION_COLORS: Record<string, string> = {
  JOIN: "text-emerald-500",
  LEAVE: "text-red-500",
  COMPLETE: "text-blue-500",
  SWAP_OFFER_CREATED: "text-purple-500",
  SWAP_REQUEST: "text-amber-500",
  SWAP_ACCEPTED: "text-emerald-500",
  SWAP_REJECTED: "text-red-500",
  ADMIN_REMOVE: "text-red-600",
  ADMIN_REORDER: "text-amber-600",
  ADMIN_RESET: "text-red-700",
};

export function AdminLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    loadLogs();
  }, [page, filter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (filter) params.action = filter;
      const res = await api.get("/admin/logs", { params });
      setLogs(res.data.logs);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">گزارش رویدادها</h3>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filter === ""
              ? "bg-tg-button text-tg-button-text"
              : "bg-tg-secondary-bg text-tg-text"
          }`}
        >
          همه
        </button>
        {Object.entries(ACTION_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === key
                ? "bg-tg-button text-tg-button-text"
                : "bg-tg-secondary-bg text-tg-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Logs list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl"
              style={{ backgroundColor: "var(--tg-theme-secondary-bg-color)" }}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-semibold ${
                    ACTION_COLORS[log.action] || "text-tg-text"
                  }`}
                >
                  {ACTION_LABELS[log.action] || log.action}
                </span>
                <span className="text-xs" style={{ color: "var(--tg-theme-hint-color)" }}>
                  {formatTime(log.createdAt)}
                </span>
              </div>
              {log.user && (
                <p className="text-sm mt-1">
                  {log.user.firstName} {log.user.lastName}
                </p>
              )}
              {log.details && (
                <pre className="text-xs mt-1 opacity-60 overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          ))}

          {logs.length === 0 && (
            <p className="text-center py-8" style={{ color: "var(--tg-theme-hint-color)" }}>
              گزارشی یافت نشد
            </p>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg disabled:opacity-50"
            style={{ backgroundColor: "var(--tg-theme-secondary-bg-color)" }}
          >
            قبلی
          </button>
          <span className="text-sm font-medium">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg disabled:opacity-50"
            style={{ backgroundColor: "var(--tg-theme-secondary-bg-color)" }}
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}
