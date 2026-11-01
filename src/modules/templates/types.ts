export type TemplateRecord = {
  id: number;
  name: string;
  /** Text with `{{variable}}` placeholders; the opt-out footer is never stored here. */
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TemplatePayload = {
  name: string;
  body: string;
  is_active: boolean;
};

export type TemplatePreview = {
  /** The body rendered with sample data, ending in the opt-out footer. */
  rendered: string;
  /** Placeholder names the server does not know (unique, in order of appearance). */
  unknown_variables: string[];
};

export type TemplateFilters = {
  is_active?: boolean;
};
