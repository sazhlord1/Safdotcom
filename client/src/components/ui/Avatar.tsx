interface AvatarProps {
  src: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ src, name, size = "md" }: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-lg",
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-tg-accent/20`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold ring-2 ring-tg-accent/20`}
      style={{
        background: `linear-gradient(135deg, var(--tg-theme-button-color), var(--tg-theme-accent-text-color))`,
        color: "var(--tg-theme-button-text-color)",
      }}
    >
      {initials}
    </div>
  );
}
