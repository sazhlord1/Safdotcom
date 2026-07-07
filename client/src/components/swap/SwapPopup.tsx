import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { SwapRequest } from "../../api/types";

interface SwapPopupProps {
  isOpen: boolean;
  onClose: () => void;
  request: SwapRequest;
  mode: "respond" | "confirm";
  onRespond?: (requestId: number, accepted: boolean) => void;
  onConfirm?: (requestId: number, accepted: boolean) => void;
}

export function SwapPopup({ isOpen, onClose, request, mode, onRespond, onConfirm }: SwapPopupProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (accepted: boolean) => {
    setLoading(true);
    if (mode === "respond" && onRespond) {
      await onRespond(request.id, accepted);
    } else if (mode === "confirm" && onConfirm) {
      await onConfirm(request.id, accepted);
    }
    setLoading(false);
    onClose();
  };

  if (mode === "confirm") {
    // Requester confirmation view
    const offerOwner = request.swapOffer.queueEntry.user;
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="تأیید معاوضه">
        <div className="flex flex-col items-center gap-4">
          <Avatar
            src={offerOwner.photoUrl}
            name={`${offerOwner.firstName} ${offerOwner.lastName || ""}`}
            size="lg"
          />

          <div className="text-center">
            <p className="font-semibold">
              {offerOwner.firstName} {offerOwner.lastName}
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
              <span className="font-semibold">{offerOwner.firstName}</span>{" "}
              عوض کنید؟
            </p>
          </div>

          <div className="flex gap-2 w-full">
            <Button
              onClick={() => handleAction(false)}
              variant="danger"
              disabled={loading}
            >
              رد
            </Button>
            <Button
              onClick={() => handleAction(true)}
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

  // Offer owner respond view
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="درخواست معاوضه">
      <div className="flex flex-col items-center gap-4">
        <Avatar
          src={request.requester.photoUrl}
          name={`${request.requester.firstName} ${request.requester.lastName || ""}`}
          size="lg"
        />

        <div className="text-center">
          <p className="font-semibold">
            {request.requester.firstName} {request.requester.lastName}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--tg-theme-hint-color)" }}>
            می‌خواهد با شما معاوضه کند
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
            onClick={() => handleAction(false)}
            variant="danger"
            disabled={loading}
          >
            رد
          </Button>
          <Button
            onClick={() => handleAction(true)}
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
