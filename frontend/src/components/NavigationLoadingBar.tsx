import { useIsFetching } from "@tanstack/react-query";

/** Thin top bar when any query is fetching (premium “something is happening” cue). */
export default function NavigationLoadingBar() {
  const fetching = useIsFetching({ stale: false });
  if (fetching === 0) return null;
  return (
    <div
      className="pointer-events-none fixed top-0 left-0 right-0 z-[60] h-0.5 overflow-hidden bg-primary/15"
      role="progressbar"
      aria-label="Loading"
    >
      <div
        className="h-full w-1/3 bg-primary"
        style={{ animation: "bluemoon-indeterminate 1.15s ease-in-out infinite" }}
      />
    </div>
  );
}
