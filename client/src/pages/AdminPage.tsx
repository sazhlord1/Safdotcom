import { useState } from "react";
import { AdminDashboard } from "../components/admin/AdminDashboard";
import { AdminControls } from "../components/admin/AdminControls";
import { AdminLogs } from "../components/admin/AdminLogs";

type AdminTab = "dashboard" | "logs" | "controls";

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs: { key: AdminTab; label: string; icon: string }[] = [
    { key: "dashboard", label: "داشبورد", icon: "📊" },
    { key: "logs", label: "گزارش‌ها", icon: "📋" },
    { key: "controls", label: "کنترل‌ها", icon: "⚙️" },
  ];

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-xl font-bold">پنل مدیریت</h2>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--tg-theme-secondary-bg-color)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-tg-button text-tg-button-text shadow-sm"
                : ""
            }`}
          >
            <span className="ml-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div key={refreshKey}>
        {activeTab === "dashboard" && <AdminDashboard />}
        {activeTab === "logs" && <AdminLogs />}
        {activeTab === "controls" && (
          <AdminControls onRefresh={() => setRefreshKey((k) => k + 1)} />
        )}
      </div>
    </div>
  );
}
