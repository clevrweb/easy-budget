"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_REVERT_MS = 3000;

/**
 * Two-tap "arm, then confirm" state machine for destructive swipe actions.
 * First call to `trigger()` arms it (and starts a revert timer); a second
 * call within `revertMs` invokes `onConfirm`. `reset()` cancels the armed
 * state immediately (e.g. when the row is swiped closed).
 */
export function useConfirmAction(onConfirm: () => void, revertMs = DEFAULT_REVERT_MS) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setArmed(false);
  }, []);

  const trigger = useCallback(() => {
    if (armed) {
      reset();
      onConfirm();
      return;
    }
    setArmed(true);
    timerRef.current = setTimeout(() => setArmed(false), revertMs);
  }, [armed, onConfirm, reset, revertMs]);

  return { armed, trigger, reset };
}
