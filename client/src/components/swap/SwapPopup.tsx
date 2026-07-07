import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { SwapRequest } from "../../api/types";

interface SwapPopupProps {
  isOpen: boolean;
  onClose: () => void;
  request: SwapRequest;
  mode: "request" | "approve" | "confirm";
  onSubmit?: (message: string) => void;
  onApprove?: (offerId: number) => void;
  onReject?: (offerId: number) => void;
  onConfirm?: (offerId: number, accepted: boolean) => void;
}

export function SwapPopup({
  isOpen,
  onClose,
  request,
  mode,
  onSubmit,
  onApprove,
  onReject,
  onConfirm,
}: SwapPopupProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    await onSubmit?.(message.trim());
    setLoading(false);
    setMessage("");
    onClose();
  };

  const handleApprove = async () => {
    setLoading(true);
    await onApprove?.(request.id);
    setLoading(false);
    onClose();
  };

  const handleReject = async () => {
    setLoading(true);
    await onReject?.(request.id);
    setLoading(false);
    onClose();
  };

  const handleConfirm = async (accepted: boolean) => {
    setLoading(true);
    await onConfirm?.(request.id, accepted);
    setLoading(false);
    onClose();
  };

  // Mode: Create new swap request
  if (mode === "request") {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="ارسال درخواست معاوضه">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              پیام معاوضه
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="مثلاً: در ازای یک قهوه"
              className="w-full px-4 py-3 rounded-xl border-0 text-base"
              style={{
                backgroundColor: "var(--tg-theme-secondary-bg-color)",
                color: "var(--tg-theme-text-color)",
              }}
              maxLength={100}
            />
            <p className="text-xs mt-1" style={{ color: "var(--tg-theme-hint-color)" }}>
              {message.length}/100
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={onClose} variant="secondary">
              لغو
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!message.trim()}
              loading={loading}
            >
              ارسال درخواست
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Mode: Approve/Reject (for person ahead)
  if (mode === "approve") {
    const requester = request.queueEntry.user;
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="درخواست معاوضه">
        <div className="flex flex-col items-center gap-4">
          <Avatar
            src={requester.photoUrl}
            name={`${requester.firstName} ${requester.lastName || ""}`}
            size="lg"
          />

          <div className="text-center">
            <p className="font-semibold">
              {requester.firstName} {requester.lastName}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--tg-theme-hint-color)" }}>
              درخواست معاوضه دارد
            </p>
          </div>

          {request.message && (
            <div
              className="w-full p-3 rounded-xl text-center"
              style={{ backgroundColor: "var(--tg-theme-secondary-bg-color)" }}
            >
              <p className="text-sm font-medium">{request.message}</p>
            </div>
          )}

          <div className="flex gap-2 w-full">
            <Button
              onClick={handleReject}
              variant="danger"
              disabled={loading}
            >
              رد
            </Button>
            <Button
              onClick={handleApprove}
              variant="primary"
              disabled={loading}
            >
              تأیید
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Mode: Final confirmation (for requester)
  if (mode === "confirm") {
    const approver = request.approvedByQueueEntry?.user;
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="تأیید نهایی معاوضه">
        <div className="flex flex-col items-center gap-4">
          {approver && (
            <Avatar
              src={approver.photoUrl}
              name={`${approver.firstName} ${approver.lastName || ""}`}
              size="lg"
            />
          )}

          <div className="text-center">
            <p className="font-semibold">
              {approver?.firstName} {approver?.lastName}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--tg-theme-hint-color)" }}>
              درخواست معاوضه شما را تأیید کرد
            </p>
          </div>

          <div
            className="w-full p-3 rounded-xl text-center"
            style={{ backgroundColor: "var(--tg-theme-secondary-bg-color)" }}
          >
            <p className="text-sm">
              آیا می‌خواهید جای خود را با{" "}
              <span className="font-semibold">{approver?.firstName}</span>{" "}
              عوض کنید؟
            </p>
          </div>

          <div className="flex gap-2 w-full">
            <Button
              onClick={() => handleConfirm(false)}
              variant="danger"
              disabled={loading}
            >
              رد
            </Button>
            <Button
              onClick={() => handleConfirm(true)}
              variant="primary"
              disabled={loading}
            >
              تأیید نهایی
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return null;
}
