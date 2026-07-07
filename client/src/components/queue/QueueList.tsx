import { AnimatePresence } from "framer-motion";
import { QueueCard } from "./QueueCard";
import { QueueEntry, SwapRequest } from "../../api/types";

interface QueueListProps {
  entries: QueueEntry[];
  currentUserId?: number;
  swapRequests: SwapRequest[];
  myEntry: QueueEntry | null;
  onApprove?: (offerId: number) => void;
  onComplete?: () => void;
  onLeave?: () => void;
}

export function QueueList({
  entries,
  currentUserId,
  swapRequests,
  myEntry,
  onApprove,
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
          const swapRequest = swapRequests.find(
            (r) => r.queueEntry.id === entry.id && r.status !== "CANCELLED" && r.status !== "REJECTED"
          );
          const isCurrentUser = entry.user.id === currentUserId;

          // Can approve if: not current user, requester is behind me, and I'm ahead
          const canApprove =
            !isCurrentUser &&
            myEntry &&
            entry.status === "WAITING" &&
            swapRequest?.status === "PENDING" &&
            entry.microwaveId === myEntry.microwaveId &&
            entry.position > myEntry.position;

          return (
            <QueueCard
              key={entry.id}
              entry={entry}
              position={entry.position}
              isCurrentUser={isCurrentUser}
              swapRequest={swapRequest}
              canApprove={canApprove || undefined}
              onApprove={onApprove}
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
