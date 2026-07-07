import { useState } from "react";
import { useQueue } from "../hooks/useQueue";
import { QueueStatus } from "../components/queue/QueueStatus";
import { QueueList } from "../components/queue/QueueList";
import { SwapOfferForm } from "../components/swap/SwapOfferForm";
import { SwapPopup } from "../components/swap/SwapPopup";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { Toast } from "../components/ui/Toast";
import { fa } from "../locales/fa";
import { toPersianDigits } from "../utils/persianDigits";
import { SwapRequest } from "../api/types";

interface DashboardProps {
  token: string | null;
  currentUserId?: number;
}

export function Dashboard({ token, currentUserId }: DashboardProps) {
  const {
    queueState,
    loading,
    error,
    fetchQueue,
    joinQueue,
    completeHeating,
    leaveQueue,
    createSwapOffer,
    cancelSwapOffer,
    requestSwap,
    respondToSwap,
    confirmSwap,
  } = useQueue(token);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [showSwapForm, setShowSwapForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SwapRequest | null>(null);
  const [selectedApprovedRequest, setSelectedApprovedRequest] = useState<SwapRequest | null>(null);
  const [requestPopupMode, setRequestPopupMode] = useState<"respond" | "confirm">("respond");

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleJoin = async (microwaveId: number) => {
    const result = await joinQueue(microwaveId);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast("با موفقیت به صف پیوستید", "success");
    }
  };

  const handleComplete = async () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.HapticFeedback?.notificationOccurred("success");
    }

    const result = await completeHeating();
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast("غذای شما گرم شد!", "success");
    }
  };

  const handleLeave = async () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.showConfirm(fa.leaveConfirmation, async (confirmed: boolean) => {
        if (confirmed) {
          tg.HapticFeedback?.impactOccurred("medium");
          const result = await leaveQueue();
          if (result.error) {
            showToast(result.error, "error");
          } else {
            showToast("از صف خارج شدید", "info");
          }
        }
      });
    }
  };

  const handleCreateOffer = async (message: string) => {
    const result = await createSwapOffer(message);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast("پیشنهاد معاوضه ایجاد شد", "success");
    }
  };

  const handleRequestSwap = async (offerId: number) => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.showConfirm("آیا می‌خواهید درخواست معاوضه ارسال کنید؟", async (confirmed: boolean) => {
        if (confirmed) {
          const result = await requestSwap(offerId);
          if (result.error) {
            showToast(result.error, "error");
          } else {
            showToast("درخواست معاوضه ارسال شد", "success");
          }
        }
      });
    }
  };

  const handleRespondToSwap = async (requestId: number, accepted: boolean) => {
    const result = await respondToSwap(requestId, accepted);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast(
        accepted ? "درخواست تأیید شد - منتظر تأیید نهایی" : "معاوضه رد شد",
        accepted ? "success" : "info"
      );
    }
  };

  const handleConfirmSwap = async (requestId: number, accepted: boolean) => {
    const result = await confirmSwap(requestId, accepted);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast(
        accepted ? "معاوضه با موفقیت انجام شد!" : "معاوضه رد شد",
        accepted ? "success" : "info"
      );
    }
  };

  if (loading && !queueState) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <span className="text-4xl mb-4 block">⚠️</span>
        <p className="text-lg font-medium mb-4">{error}</p>
        <Button onClick={fetchQueue}>{fa.retry}</Button>
      </div>
    );
  }

  if (!queueState) return null;

  const { queue, queueOpen, queueCloseTime, myEntry, pendingRequests, approvedRequests } =
    queueState;

  // Split queue by microwave (only WAITING entries)
  const microwave1Queue = queue.filter(
    (e) => e.status === "WAITING" && e.microwaveId === 1
  );
  const microwave2Queue = queue.filter(
    (e) => e.status === "WAITING" && e.microwaveId === 2
  );

  // Check if user has completed and can rejoin
  const canRejoin = myEntry && myEntry.status === "COMPLETED" && queueOpen;

  return (
    <div className="space-y-4 pb-4">
      {/* Queue Status */}
      <QueueStatus queueState={queueState} currentUserId={currentUserId} />

      {/* Queue Status Banner */}
      <div
        className={`p-4 rounded-xl text-center font-semibold ${
          queueOpen
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-red-500/10 text-red-600 dark:text-red-400"
        }`}
      >
        {queueOpen ? (
          <>
            <span className="text-lg">🟢</span>
            <p>{fa.queueOpen}</p>
            <p className="text-sm mt-1 opacity-80">
              {fa.queueClosesAt}:{" "}
              {new Date(queueCloseTime).toLocaleTimeString("fa-IR", {
                timeZone: "Asia/Tehran",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </>
        ) : (
          <>
            <span className="text-lg">🔴</span>
            <p>{fa.queueClosed}</p>
          </>
        )}
      </div>

      {/* Join / Rejoin Buttons */}
      {!myEntry && queueOpen && (
        <div className="space-y-2">
          <p className="text-center font-medium">مایکرویو مورد نظر را انتخاب کنید:</p>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => handleJoin(1)} loading={loading}>
              مایکرویو ۱ ({toPersianDigits(microwave1Queue.length)} نفر)
            </Button>
            <Button onClick={() => handleJoin(2)} loading={loading}>
              مایکرویو ۲ ({toPersianDigits(microwave2Queue.length)} نفر)
            </Button>
          </div>
        </div>
      )}

      {/* Rejoin after completed */}
      {canRejoin && (
        <div className="space-y-2">
          <p className="text-center font-medium">غذای شما گرم شد! می‌خواهید دوباره شرکت کنید؟</p>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => handleJoin(1)} loading={loading} variant="secondary">
              مایکرویو ۱ ({toPersianDigits(microwave1Queue.length)} نفر)
            </Button>
            <Button onClick={() => handleJoin(2)} loading={loading} variant="secondary">
              مایکرویو ۲ ({toPersianDigits(microwave2Queue.length)} نفر)
            </Button>
          </div>
        </div>
      )}

      {/* Approved Requests - waiting for requester confirmation */}
      {approvedRequests.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold">تأیید نهایی معاوضه</h3>
          {approvedRequests.map((req) => (
            <div key={req.id} className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {req.swapOffer.queueEntry.user.firstName} {req.swapOffer.queueEntry.user.lastName}
                  </p>
                  <p className="text-sm" style={{ color: "var(--tg-theme-hint-color)" }}>
                    درخواست شما را تأیید کرد
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedApprovedRequest(req);
                    setRequestPopupMode("confirm");
                  }}
                  className="btn-primary !w-auto text-sm"
                >
                  تأیید نهایی
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Swap Requests (from others) */}
      {pendingRequests.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold">{fa.pendingSwaps}</h3>
          {pendingRequests.map((req) => (
            <div key={req.id} className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {req.requester.firstName} {req.requester.lastName}
                  </p>
                  <p className="text-sm" style={{ color: "var(--tg-theme-hint-color)" }}>
                    {req.status === "APPROVED" ? "منتظر تأیید نهایی" : "درخواست معاوضه با شما"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedRequest(req);
                      setRequestPopupMode("respond");
                    }}
                    className="btn-primary !w-auto text-sm"
                  >
                    مشاهده
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Swap Offer Button */}
      {myEntry && myEntry.status === "WAITING" && !(queueState.swapOffers?.some(o => o.queueEntry.id === myEntry.id)) && (
        <Button
          onClick={() => setShowSwapForm(true)}
          variant="secondary"
        >
          {fa.createSwapOffer}
        </Button>
      )}

      {/* Two Microwave Queues */}
      <div className="grid grid-cols-2 gap-4">
        {/* Microwave 1 */}
        <div>
          <h3 className="font-bold mb-2 text-center">مایکرویو ۱</h3>
          <QueueList
            entries={microwave1Queue}
            currentUserId={currentUserId}
            swapOffers={queueState.swapOffers}
            onRequestSwap={handleRequestSwap}
            onComplete={handleComplete}
            onLeave={handleLeave}
          />
        </div>

        {/* Microwave 2 */}
        <div>
          <h3 className="font-bold mb-2 text-center">مایکرویو ۲</h3>
          <QueueList
            entries={microwave2Queue}
            currentUserId={currentUserId}
            swapOffers={queueState.swapOffers}
            onRequestSwap={handleRequestSwap}
            onComplete={handleComplete}
            onLeave={handleLeave}
          />
        </div>
      </div>

      {/* Swap Offer Form Modal */}
      <SwapOfferForm
        isOpen={showSwapForm}
        onClose={() => setShowSwapForm(false)}
        onSubmit={handleCreateOffer}
      />

      {/* Swap Request Popup (respond mode) */}
      {selectedRequest && (
        <SwapPopup
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          request={selectedRequest}
          mode="respond"
          onRespond={handleRespondToSwap}
        />
      )}

      {/* Swap Confirmation Popup (confirm mode) */}
      {selectedApprovedRequest && (
        <SwapPopup
          isOpen={!!selectedApprovedRequest}
          onClose={() => setSelectedApprovedRequest(null)}
          request={selectedApprovedRequest}
          mode="confirm"
          onConfirm={handleConfirmSwap}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
