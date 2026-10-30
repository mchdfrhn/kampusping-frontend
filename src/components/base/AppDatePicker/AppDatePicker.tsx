import { DatePicker, type DatePickerProps } from '@mui/x-date-pickers/DatePicker';

import { DATE_INPUT_FORMAT } from '@/core/utils/date.util';

export type AppDatePickerProps = DatePickerProps;

const FIELD_WIDTH = 220;

const mergeSx = (...parts: Array<AppDatePickerProps['sx'] | undefined>) =>
  parts.flatMap((part) => {
    if (!part) return [];
    return Array.isArray(part) ? part : [part];
  });

export const AppDatePicker = ({
  slotProps,
  sx,
  format = DATE_INPUT_FORMAT,
  ...props
}: AppDatePickerProps) => (
  <DatePicker
    {...props}
    format={format}
    sx={mergeSx({ width: FIELD_WIDTH }, sx)}
    slotProps={{
      ...slotProps,
      field: (ownerState) => {
        const fieldProps =
          typeof slotProps?.field === 'function'
            ? slotProps.field(ownerState)
            : (slotProps?.field ?? {});

        return {
          clearable: true,
          clearButtonPosition: 'end',
          ...fieldProps,
        };
      },
      clearButton: {
        size: 'small',
        ...(typeof slotProps?.clearButton === 'object' ? slotProps.clearButton : {}),
      },
      openPickerButton: {
        edge: false,
        ...(typeof slotProps?.openPickerButton === 'object' ? slotProps.openPickerButton : {}),
      },
      textField: (ownerState) => {
        const textFieldProps =
          typeof slotProps?.textField === 'function'
            ? slotProps.textField(ownerState)
            : (slotProps?.textField ?? {});

        const existingSlotProps = textFieldProps.slotProps ?? {};

        return {
          ...textFieldProps,
          slotProps: {
            ...existingSlotProps,
            inputLabel: {
              shrink: true,
              ...(existingSlotProps.inputLabel ?? {}),
            },
          },
          sx: mergeSx(
            {
              width: FIELD_WIDTH,
              '& .MuiOutlinedInput-root, & .MuiPickersInputBase-root': {
                pr: 0.75,
              },
              '& .MuiPickersSectionList-root': {
                flex: '1 1 auto',
                minWidth: 0,
                overflow: 'hidden',
              },
              '& .MuiInputAdornment-positionEnd': {
                ml: 0.25,
                mr: 0.25,
              },
              '& .MuiInputAdornment-positionEnd .MuiIconButton-root': {
                p: 0.375,
              },
              '& .MuiInputAdornment-positionEnd .MuiIconButton-edgeEnd': {
                marginRight: 0,
              },
            },
            textFieldProps.sx,
          ),
        };
      },
    }}
  />
);
