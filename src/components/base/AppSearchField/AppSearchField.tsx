'use client';

import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

type AppSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

/** Search box with a clear button, as used above every list grid. */
export const AppSearchField = ({ value, onChange, placeholder }: AppSearchFieldProps) => (
  <TextField
    placeholder={placeholder}
    aria-label="Cari"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    sx={{ minWidth: 320 }}
    slotProps={{
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <SearchOutlinedIcon fontSize="small" />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton aria-label="Hapus pencarian" size="small" onClick={() => onChange('')}>
              <CloseOutlinedIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      },
    }}
  />
);
