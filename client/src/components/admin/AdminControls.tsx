import { useState } from "react";
import { Button } from "../ui/Button";
import api from "../../api/client";

interface AdminControlsProps {
  onRefresh: () => void;
}

export function AdminControls({ onRefresh }: AdminControlsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleReset = async () => {
    const confirmed = window.confirm("آیا مطمئن هستید که می‌خواهید صف امروز را بازنشانی کنید؟");
    if (!confirmed) return;

    setLoading("reset");
    try {
      await api.post("/admin/reset");
      onRefresh();
    } catch (err) {
      console.error("Reset failed:", err);
    } finally {
      setLoading(null);
    }
  };

  const handleExport = async () => {
    setLoading("export");
    try {
      const res = await api.get("/admin/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "microwave-queue-logs.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold">کنترل‌ها</h3>
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={handleReset}
          variant="danger"
          loading={loading === "reset"}
        >
          بازنشانی صف
        </Button>
        <Button
          onClick={handleExport}
          variant="secondary"
          loading={loading === "export"}
        >
          خروجی CSV
        </Button>
      </div>
    </div>
  );
}
