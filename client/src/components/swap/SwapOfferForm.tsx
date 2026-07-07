import { useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface SwapOfferFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  targetName?: string;
}

export function SwapOfferForm({ isOpen, onClose, onSubmit, targetName }: SwapOfferFormProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    await onSubmit(message.trim());
    setLoading(false);
    setMessage("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={targetName ? `درخواست معاوضه با ${targetName}` : "ایجاد پیشنهاد معاوضه"}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            پیام معاوضه
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="در ازای یک قهوه"
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
