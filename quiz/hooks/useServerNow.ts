"use client";

import { useEffect, useState } from "react";

/** Re-renders every `tickMs` with the offset-corrected server time. */
export function useServerNow(serverNow: () => number, tickMs = 200): number {
  const [now, setNow] = useState(() => serverNow());
  useEffect(() => {
    const id = setInterval(() => setNow(serverNow()), tickMs);
    return () => clearInterval(id);
  }, [serverNow, tickMs]);
  return now;
}
