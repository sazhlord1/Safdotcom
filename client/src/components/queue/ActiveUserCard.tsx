import { Avatar } from "../ui/Avatar";
import { CountdownTimer } from "./CountdownTimer";

interface ActiveUserCardProps {
  user: {
    id: number;
    firstName: string;
    lastName: string | null;
    photoUrl: string | null;
  };
  startedAt: string | null;
  totalSeconds: number;
}

export function ActiveUserCard({ user, startedAt, totalSeconds }: ActiveUserCardProps) {
  return (
    <div className="glass-card queue-item-active animate-fade-in">
      <div className="flex items-center gap-4 mb-4">
        <Avatar
          src={user.photoUrl}
          name={`${user.firstName} ${user.lastName || ""}`}
          size="lg"
        />
        <div className="flex-1">
          <h3 className="text-lg font-bold">
            {user.firstName} {user.lastName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl">🔥</span>
            <span className="text-sm font-medium" style={{ color: "var(--tg-theme-accent-text-color)" }}>
              در حال گرم کردن غذا
            </span>
          </div>
        </div>
      </div>

      <CountdownTimer startedAt={startedAt} totalSeconds={totalSeconds} />
    </div>
  );
}
