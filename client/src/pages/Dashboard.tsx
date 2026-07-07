import { useState } from "react";
import { useQueue } from "../hooks/useQueue";
import { QueueStatus } from "../components/queue/QueueStatus";
import { QueueList } from "../components/queue/QueueList";
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
    createSwapRequest,
    approveSwapRequest,
    rejectSwapRequest,
    confirmSwapRequest,
  } = useQueue(token);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedForApproval, setSelectedForApproval] = useState<SwapRequest | null>(null);
  const [selectedForConfirmation, setSelectedForConfirmation] = useState<SwapRequest | null>(null);

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

  const handleCreateRequest = async (message: string) => {
    const result = await createSwapRequest(message);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast("درخواست معاوضه ارسال شد", "success");
    }
  };

  const handleApprove = async (offerId: number) => {
    const result = await approveSwapRequest(offerId);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast("درخواست تأیید شد", "success");
    }
  };

  const handleReject = async (offerId: number) => {
    const result = await rejectSwapRequest(offerId);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast("درخواست رد شد", "info");
    }
  };

  const handleConfirm = async (offerId: number, accepted: boolean) => {
    const result = await confirmSwapRequest(offerId, accepted);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast(
        accepted ? "جای شما در صف تغییر کرد!" : "معاوضه رد شد",
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

  const { queue, queueOpen, queueCloseTime, myEntry, mySwapRequests, requestsToApprove } =
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

  // Check if user can create a swap request (position > 0 and no active request)
  const canCreateRequest =
    myEntry &&
    myEntry.status === "WAITING" &&
    myEntry.position > 0 &&
    !mySwapRequests.some((r) => r.status === "PENDING" || r.status === "APPROVED");

  // Find approved request awaiting confirmation
  const approvedRequest = mySwapRequests.find((r) => r.status === "APPROVED");

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

      {/* Approved request awaiting my confirmation */}
      {approvedRequest && (
        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {approvedRequest.approvedByQueueEntry?.user.firstName}{" "}
                {approvedRequest.approvedByQueueEntry?.user.lastName}
              </p>
              <p className="text-sm" style={{ color: "var(--tg-theme-hint-color)" }}>
                درخواست معاوضه شما را تأیید کرد
              </p>
            </div>
            <button
              onClick={() => setSelectedForConfirmation(approvedRequest)}
              className="btn-primary !w-auto text-sm"
            >
              تأیید نهایی
            </button>
          </div>
        </div>
      )}

      {/* Requests I can approve */}
      {requestsToApprove.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold">درخواست‌های معاوضه</h3>
          {requestsToApprove.map((req) => (
            <div key={req.id} className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {req.queueEntry.user.firstName} {req.queueEntry.user.lastName}
                  </p>
                  <p className="text-sm" style={{ color: "var(--tg-theme-hint-color)" }}>
                    {req.message}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedForApproval(req)}
                  className="btn-primary !w-auto text-sm"
                >
                  مشاهده
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Swap Request Button */}
      {canCreateRequest && (
        <Button
          onClick={() => setShowRequestForm(true)}
          variant="secondary"
        >
          ارسال درخواست معاوضه
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
            swapRequests={queueState.swapRequests}
            myEntry={myEntry}
            onApprove={(offerId) => {
              const req = requestsToApprove.find((r) => r.id === offerId);
              if (req) setSelectedForApproval(req);
            }}
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
            swapRequests={queueState.swapRequests}
            myEntry={myEntry}
            onApprove={(offerId) => {
              const req = requestsToApprove.find((r) => r.id === offerId);
              if (req) setSelectedForApproval(req);
            }}
            onComplete={handleComplete}
            onLeave={handleLeave}
          />
        </div>
      </div>

      {/* Create Swap Request Modal */}
      <SwapPopup
        isOpen={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        request={{} as SwapRequest}
        mode="request"
        onSubmit={handleCreateRequest}
      />

      {/* Approve/Reject Modal */}
      {selectedForApproval && (
        <SwapPopup
          isOpen={!!selectedForApproval}
          onClose={() => setSelectedForApproval(null)}
          request={selectedForApproval}
          mode="approve"
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Final Confirmation Modal */}
      {selectedForConfirmation && (
        <SwapPopup
          isOpen={!!selectedForConfirmation}
          onClose={() => setSelectedForConfirmation(null)}
          request={selectedForConfirmation}
          mode="confirm"
          onConfirm={handleConfirm}
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
