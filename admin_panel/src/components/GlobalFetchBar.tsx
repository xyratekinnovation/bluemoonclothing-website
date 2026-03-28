import { useIsFetching } from "@tanstack/react-query";

export default function GlobalFetchBar() {
  const n = useIsFetching({ stale: false });
  if (n === 0) return null;
  return (
    <div className="pointer-events-none fixed top-0 left-0 right-0 z-[100] h-1 overflow-hidden bg-primary/20">
      <div
        className="h-full w-1/3 bg-gold-gradient opacity-90"
        style={{ animation: "bluemoon-indeterminate 1.15s ease-in-out infinite" }}
      />
    </div>
  );
}
