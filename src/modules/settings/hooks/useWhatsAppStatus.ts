'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { whatsappService } from '../services/whatsapp.service';
import type { WhatsAppStatus } from '../types';

export const WHATSAPP_POLL_INTERVAL_MS = 3000;
export const WHATSAPP_POLL_MAX_BACKOFF_MS = 30000;

/** 3 s while healthy; doubled after every failure in a row, capped at 30 s. */
export const nextPollDelay = (failures: number): number =>
  failures <= 0
    ? WHATSAPP_POLL_INTERVAL_MS
    : Math.min(WHATSAPP_POLL_INTERVAL_MS * 2 ** failures, WHATSAPP_POLL_MAX_BACKOFF_MS);

type Result = {
  /** Last good answer; `null` until the first one, and cleared while the status cannot be read. */
  status: WhatsAppStatus | null;
  /** True while the last request failed. */
  failed: boolean;
  /** Ask again right now (also resets the backoff). */
  refresh: () => void;
};

/**
 * Poll `GET /whatsapp/status` while `enabled`, the component is mounted and the tab is visible.
 *
 * One request at a time: the next one is scheduled only after the previous finished, so a slow
 * answer can never pile up. The timer and the request are cancelled on unmount.
 */
export const useWhatsAppStatus = (enabled: boolean): Result => {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const pollNow = useRef<() => void>(() => {});

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let inFlight = false;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    const clearTimer = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };

    const tick = async () => {
      clearTimer();
      if (!active || inFlight) return;
      // A hidden tab stays quiet; the visibilitychange listener below starts polling again.
      if (document.visibilityState === 'hidden') return;

      inFlight = true;
      controller = new AbortController();
      try {
        const next = await whatsappService.status(controller.signal);
        if (!active) return;
        failures = 0;
        setStatus(next);
        setFailed(false);
      } catch {
        if (!active) return;
        failures += 1;
        setStatus(null);
        setFailed(true);
      } finally {
        inFlight = false;
        controller = undefined;
      }
      if (active) timer = setTimeout(() => void tick(), nextPollDelay(failures));
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !inFlight) void tick();
    };

    pollNow.current = () => {
      failures = 0;
      void tick();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    void tick();

    return () => {
      active = false;
      clearTimer();
      controller?.abort();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      pollNow.current = () => {};
    };
  }, [enabled]);

  const refresh = useCallback(() => pollNow.current(), []);

  return { status, failed, refresh };
};
