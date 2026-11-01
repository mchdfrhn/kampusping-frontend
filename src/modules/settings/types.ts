/** `GET/PUT /settings`. Times are `HH:MM:SS` wall-clock time; weekdays are ISO 1 (Senin) to 7. */
export type SettingsRecord = {
  campus_name: string;
  finance_contact: string;
  payment_link_siakad: string;
  payment_guide_sipema: string;
  window_start: string;
  window_end: string;
  working_days: number[];
  auto_send_enabled: boolean;
  daily_cap: number;
  throttle_min_s: number;
  throttle_max_s: number;
  max_attempts: number;
  consecutive_failure_limit: number;
  escalation_offset_days: number;
  /** Set by the system (e.g. `circuit_breaker`); cleared by `POST /settings/resume`. */
  paused_reason: string | null;
  consecutive_failures: number;
  updated_at: string;
};

/** The editable part: the pause state and the failure counter are owned by the server. */
export type SettingsPayload = Omit<
  SettingsRecord,
  'paused_reason' | 'consecutive_failures' | 'updated_at'
>;

export type WhatsAppState = 'connected' | 'connecting' | 'qr' | 'disconnected';

/** `GET /whatsapp/status`. `qr` is a pairing secret: render it, never log or store it. */
export type WhatsAppStatus = {
  state: WhatsAppState;
  qr: string | null;
  paused_reason: string | null;
};
