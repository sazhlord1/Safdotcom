import { useState, useEffect } from "react";
import api from "../../api/client";
import { AdminDashboard as DashboardType } from "../../api/types";
import { Spinner } from "../ui/Spinner";

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/admin/dashboard");
      setDashboard(res.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p style={{ color: "var(--tg-theme-hint-color)" }}>خطا در بارگذاری داشبورد</p>
      </div>
    );
  }

  const { todayStats, swapStats } = dashboard;

  const statCards = [
    { label: "کاربران امروز", value: todayStats.totalUsers, icon: "👥" },
    { label: "صف فعال", value: todayStats.activeQueue, icon: "📋" },
    { label: "تکمیل شده", value: todayStats.completed, icon: "✅" },
    { label: "زمان میانگین", value: `${todayStats.avgWaitMinutes} دقیقه`, icon: "⏱️" },
    { label: "طول صف", value: todayStats.queueLength, icon: "📊" },
    { label: "پیک استفاده", value: todayStats.peakUsageTime || "-", icon: "📈" },
  ];

  const swapCards = [
    { label: "کل پیشنهادات", value: swapStats.totalOffers, icon: "🔄" },
    { label: "تأیید شده", value: swapStats.accepted, icon: "✅" },
    { label: "رد شده", value: swapStats.rejected, icon: "❌" },
    { label: "در انتظار", value: swapStats.pending, icon: "⏳" },
  ];

  return (
    <div className="space-y-6">
      {/* Today's Stats */}
      <section>
        <h3 className="text-lg font-bold mb-3">آمار امروز</h3>
        <div className="grid grid-cols-2 gap-2">
          {statCards.map((stat) => (
            <div key={stat.label} className="stat-card">
              <span className="text-lg">{stat.icon}</span>
              <p className="text-xl font-bold mt-1">{stat.value}</p>
              <p className="text-xs" style={{ color: "var(--tg-theme-hint-color)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Swap Stats */}
      <section>
        <h3 className="text-lg font-bold mb-3">آمار معاوضه</h3>
        <div className="grid grid-cols-2 gap-2">
          {swapCards.map((stat) => (
            <div key={stat.label} className="stat-card">
              <span className="text-lg">{stat.icon}</span>
              <p className="text-xl font-bold mt-1">{stat.value}</p>
              <p className="text-xs" style={{ color: "var(--tg-theme-hint-color)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Most Active Users */}
      <section>
        <h3 className="text-lg font-bold mb-3">فعال‌ترین کاربران</h3>
        <div className="space-y-2">
          {dashboard.mostActiveUsers.map((item, index) => (
            <div
              key={item.user.id}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ backgroundColor: "var(--tg-theme-secondary-bg-color)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold" style={{ color: "var(--tg-theme-hint-color)" }}>
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">
                    {item.user.firstName} {item.user.lastName}
                  </p>
                  {item.user.username && (
                    <p className="text-xs" style={{ color: "var(--tg-theme-hint-color)" }}>
                      @{item.user.username}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-sm font-bold" style={{ color: "var(--tg-theme-accent-text-color)" }}>
                {item.count} بار
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
