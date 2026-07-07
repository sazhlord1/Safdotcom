interface SpinnerProps {
  size?: "sm" | "md" | "lg";
}

export function Spinner({ size = "md" }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-t-transparent`}
        style={{
          borderColor: `color-mix(in srgb, var(--tg-theme-hint-color) 30%, transparent)`,
          borderTopColor: "var(--tg-theme-button-color)",
        }}
      />
    </div>
  );
}
