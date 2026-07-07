import { Button } from "../ui/Button";
import { SwapRequest } from "../../api/types";

interface SwapOfferCardProps {
  offer: SwapRequest;
  canRequest?: boolean;
  onRequest?: () => void;
}

export function SwapOfferCard({ offer, canRequest, onRequest }: SwapOfferCardProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔄</span>
        <span className="text-sm font-medium" style={{ color: "var(--tg-theme-accent-text-color)" }}>
          {offer.message}
        </span>
      </div>

      {canRequest && (
        <Button
          onClick={onRequest}
          variant="secondary"
          size="sm"
          fullWidth={false}
          className="!w-auto text-xs"
        >
          درخواست معاوضه
        </Button>
      )}
    </div>
  );
}
