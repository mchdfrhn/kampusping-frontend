import type { TemplateRecord } from '@/modules/templates/types';

export type ScheduleRuleTemplate = Pick<TemplateRecord, 'id' | 'name'>;

export type ScheduleRuleRecord = {
  id: number;
  name: string;
  /** Days relative to the due date: negative = before, 0 = on the day, positive = after. */
  offset_days: number;
  /** The embedded summary has no `is_active`; look the template up in the template list. */
  template: ScheduleRuleTemplate;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ScheduleRulePayload = {
  name: string;
  offset_days: number;
  template_id: number;
  is_active: boolean;
};
