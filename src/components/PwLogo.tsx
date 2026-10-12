export function PwLogo({
  size = "md",
  showText = true,
}: {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}) {
  const circleSize =
    size === "sm"
      ? "h-6 w-6 text-[10px]"
      : size === "lg"
        ? "h-10 w-10 text-base"
        : "h-8 w-8 text-xs";

  return (
    <div className="flex items-center gap-2 select-none">
      {/* Official PW circular badge */}
      <div
        className={`${circleSize} rounded-full bg-[#1b2124] text-white font-extrabold tracking-tight flex items-center justify-center shrink-0 shadow-xs`}
      >
        <span>PW</span>
      </div>

      {showText && (
        <div className="flex flex-col text-left leading-none">
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Physics Wallah
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">PW.LIVE</span>
        </div>
      )}
    </div>
  );
}
