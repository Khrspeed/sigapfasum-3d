import { useEffect, useState } from "react";

export function useSplash(duration = 2000) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return showSplash;
}
