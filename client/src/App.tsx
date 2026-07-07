import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { Dashboard } from "./pages/Dashboard";
import { AdminPage } from "./pages/AdminPage";
import { Spinner } from "./components/ui/Spinner";
import { fa } from "./locales/fa";

export function App() {
  const {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    loginWithTelegram,
  } = useAuth();

  // Auto-login on Telegram WebApp mount
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      loginWithTelegram();
    }
  }, [isAuthenticated, loading]);

  const [currentView, setCurrentView] = useState<"dashboard" | "admin">(
    "dashboard"
  );

  // Loading state
  if (loading || !isAuthenticated || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {error ? (
          <div className="text-center px-4">
            <p className="text-lg font-medium mb-4">{error}</p>
            <button onClick={loginWithTelegram} className="btn-primary">
              تلاش مجدد
            </button>
          </div>
        ) : (
          <Spinner size="lg" />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen safe-area-top safe-area-bottom">
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
        style={{
          backgroundColor: "var(--tg-theme-header-bg-color)",
          borderBottom: "1px solid color-mix(in srgb, var(--tg-theme-hint-color) 15%, transparent)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🍽️</span>
          <h1 className="text-lg font-bold">{fa.appTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin toggle */}
          {user?.isAdmin && (
            <button
              onClick={() =>
                setCurrentView((v) => (v === "dashboard" ? "admin" : "dashboard"))
              }
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor:
                  currentView === "admin"
                    ? "var(--tg-theme-button-color)"
                    : "var(--tg-theme-secondary-bg-color)",
                color:
                  currentView === "admin"
                    ? "var(--tg-theme-button-text-color)"
                    : "var(--tg-theme-text-color)",
              }}
            >
              {currentView === "admin" ? "بازگشت" : fa.adminPanel}
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4">
        {currentView === "dashboard" && (
          <Dashboard token={token} currentUserId={user?.id} />
        )}
        {currentView === "admin" && user?.isAdmin && <AdminPage />}
      </main>
    </div>
  );
}
