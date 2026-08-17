'use client';

import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { appDialogCancelButtonSx } from '@/components/base/AppDialog/appDialogActionsStyles';

type Props = {
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel?: string;
  saveDisabled?: boolean;
};

export const SettingsFormDialogActions = ({
  onCancel,
  onSave,
  saving = false,
  saveLabel = 'Save',
  saveDisabled = false,
}: Props) => (
  <>
    <Button
      color="inherit"
      disabled={saving}
      onClick={onCancel}
      startIcon={<CloseOutlinedIcon />}
      sx={appDialogCancelButtonSx}
    >
      Cancel
    </Button>
    <Button
      color="secondary"
      disabled={saving || saveDisabled}
      onClick={onSave}
      startIcon={saving ? <CircularProgress color="inherit" size={16} /> : <SaveOutlinedIcon />}
      variant="contained"
    >
      {saveLabel}
    </Button>
  </>
);
