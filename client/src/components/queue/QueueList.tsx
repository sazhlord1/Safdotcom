import { AnimatePresence } from "framer-motion";
import { QueueCard } from "./QueueCard";
import { QueueEntry, SwapOffer } from "../../api/types";

interface QueueListProps {
  entries: QueueEntry[];
  currentUserId?: number;
  swapOffers: SwapOffer[];
  onRequestSwap?: (offerId: number) => void;
  onComplete?: () => void;
  onLeave?: () => void;
}

export function QueueList({
  entries,
  currentUserId,
  swapOffers,
  onRequestSwap,
  onComplete,
  onLeave,
}: QueueListProps) {
  const activeEntries = entries.filter(
    (e) => e.status === "WAITING" || e.status === "ACTIVE"
  );

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {activeEntries.map((entry) => {
          const swapOffer = swapOffers.find(
            (o) => o.queueEntry.id === entry.id && o.status === "PENDING"
          );
          const isCurrentUser = entry.user.id === currentUserId;

          return (
            <QueueCard
              key={entry.id}
              entry={entry}
              position={entry.position}
              isCurrentUser={isCurrentUser}
              swapOffer={swapOffer}
              canRequestSwap={
                !isCurrentUser &&
                entry.status === "WAITING" &&
                !!swapOffer
              }
              onRequestSwap={onRequestSwap}
              onComplete={onComplete}
              onLeave={onLeave}
            />
          );
        })}
      </AnimatePresence>

      {activeEntries.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">🍽️</span>
          <p className="text-lg font-medium" style={{ color: "var(--tg-theme-hint-color)" }}>
            صف خالی است
          </p>
        </div>
      )}
    </div>
  );
}
