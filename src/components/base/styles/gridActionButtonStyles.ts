const disabledSx = {
  bgcolor: '#e5e7eb',
  color: '#9ca3af',
  '&:hover': { bgcolor: '#e5e7eb' },
};

const withDisabled = (active: Record<string, unknown>) => ({
  ...active,
  borderRadius: 2,
  '&.Mui-disabled': disabledSx,
});

export const gridActionButtonSx = {
  view: withDisabled({
    bgcolor: '#eef2ff',
    color: '#4f46e5',
    '&:hover': { bgcolor: '#eef2ff' },
  }),
  upload: withDisabled({
    bgcolor: '#eaf2ff',
    color: '#2E82FF',
    '&:hover': { bgcolor: '#eaf2ff' },
  }),
  approve: withDisabled({
    bgcolor: '#e8f8ef',
    color: '#22a06b',
    '&:hover': { bgcolor: '#e8f8ef' },
  }),
  reject: withDisabled({
    bgcolor: '#ffeaf0',
    color: '#FF6B86',
    '&:hover': { bgcolor: '#ffeaf0' },
  }),
  download: withDisabled({
    bgcolor: '#eaf2ff',
    color: '#2E82FF',
    '&:hover': { bgcolor: '#eaf2ff' },
  }),
  certificate: withDisabled({
    bgcolor: '#fff7ed',
    color: '#ea580c',
    '&:hover': { bgcolor: '#fff7ed' },
  }),
  edit: withDisabled({
    bgcolor: '#eaf2ff',
    color: '#2E82FF',
    '&:hover': { bgcolor: '#eaf2ff' },
  }),
  delete: withDisabled({
    bgcolor: '#ffeaf0',
    color: '#FF6B86',
    '&:hover': { bgcolor: '#ffeaf0' },
  }),
};
