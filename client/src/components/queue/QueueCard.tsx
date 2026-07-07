import { motion } from "framer-motion";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { SwapOfferCard } from "../swap/SwapOfferCard";
import { QueueEntry, SwapOffer } from "../../api/types";
import { toPersianDigits } from "../../utils/persianDigits";

interface QueueCardProps {
  entry: QueueEntry;
  position: number;
  isCurrentUser: boolean;
  swapOffer?: SwapOffer | null;
  canRequestSwap?: boolean;
  onRequestSwap?: (offerId: number) => void;
  onComplete?: () => void;
  onLeave?: () => void;
}

export function QueueCard({
  entry,
  position,
  isCurrentUser,
  swapOffer,
  canRequestSwap,
  onRequestSwap,
  onComplete,
  onLeave,
}: QueueCardProps) {
  const statusConfig: Record<string, { label: string; variant: "default" | "info" | "success" | "danger" }> = {
    WAITING: { label: "در انتظار", variant: "default" },
    ACTIVE: { label: "در حال استفاده", variant: "info" },
    COMPLETED: { label: "انجام شده", variant: "success" },
    LEFT: { label: "خارج شده", variant: "danger" },
  };

  const status = statusConfig[entry.status] || statusConfig.WAITING;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className={`glass-card ${isCurrentUser ? "ring-2 ring-tg-accent/30" : ""}`}
    >
      <div className="flex items-center gap-3">
        {/* Position number */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
          style={{
            backgroundColor: isCurrentUser
              ? "var(--tg-theme-button-color)"
              : "var(--tg-theme-secondary-bg-color)",
            color: isCurrentUser
              ? "var(--tg-theme-button-text-color)"
              : "var(--tg-theme-text-color)",
          }}
        >
          {toPersianDigits(position + 1)}
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Avatar
              src={entry.user.photoUrl}
              name={`${entry.user.firstName} ${entry.user.lastName || ""}`}
              size="sm"
            />
            <div className="truncate">
              <p className="font-semibold truncate">
                {entry.user.firstName} {entry.user.lastName}
              </p>
              {entry.user.username && (
                <p className="text-xs truncate" style={{ color: "var(--tg-theme-hint-color)" }}>
                  @{entry.user.username}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {/* Swap offer below the card */}
      {swapOffer && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--tg-theme-hint-color)" }}>
          <SwapOfferCard
            offer={swapOffer}
            canRequest={canRequestSwap}
            onRequest={() => onRequestSwap?.(swapOffer.id)}
          />
        </div>
      )}

      {/* Current user actions - only position 0 gets "غذام گرم شد" */}
      {isCurrentUser && entry.status === "WAITING" && position === 0 && (
        <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: "1px solid var(--tg-theme-hint-color)" }}>
          <button onClick={onComplete} className="btn-primary flex-1">
            غذام گرم شد
          </button>
          <button onClick={onLeave} className="btn-danger flex-1">
            خروج از صف
          </button>
        </div>
      )}

      {/* Other positions only get "خروج از صف" */}
      {isCurrentUser && entry.status === "WAITING" && position !== 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--tg-theme-hint-color)" }}>
          <button onClick={onLeave} className="btn-danger w-full">
            خروج از صف
          </button>
        </div>
      )}
    </motion.div>
  );
}
