import { QueueState } from "../../api/types";
import { toPersianDigits } from "../../utils/persianDigits";

interface QueueStatusProps {
  queueState: QueueState;
  currentUserId?: number;
}

export function QueueStatus({ queueState, currentUserId }: QueueStatusProps) {
  const { queue, myEntry } = queueState;

  const microwave1Waiting = queue.filter(
    (e) => e.status === "WAITING" && e.microwaveId === 1
  );
  const microwave2Waiting = queue.filter(
    (e) => e.status === "WAITING" && e.microwaveId === 2
  );

  let myPosition = -1;
  let peopleAhead = 0;
  let myMicrowaveId = 0;

  if (myEntry && myEntry.status === "WAITING") {
    myMicrowaveId = myEntry.microwaveId;
    const myQueue = myMicrowaveId === 1 ? microwave1Waiting : microwave2Waiting;
    myPosition = myEntry.position;
    peopleAhead = myQueue.filter((e) => e.position < myEntry.position).length;
  }

  const activeQueue = myMicrowaveId === 1 ? microwave1Waiting : microwave2Waiting;

  const stats = [
    {
      label: "موقعیت شما",
      value: myEntry && myEntry.status === "WAITING" ? toPersianDigits(myPosition + 1) : "-",
      icon: "📍",
    },
    {
      label: "نفرات جلوتر",
      value: myEntry && myEntry.status === "WAITING" ? toPersianDigits(peopleAhead) : "-",
      icon: "👥",
    },
    {
      label: "طول صف",
      value: toPersianDigits(activeQueue.length),
      icon: "📊",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card">
          <span className="text-lg">{stat.icon}</span>
          <p className="text-xl font-bold mt-1">{stat.value}</p>
          <p className="text-xs" style={{ color: "var(--tg-theme-hint-color)" }}>
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
