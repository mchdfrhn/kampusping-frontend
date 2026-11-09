'use client';

import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { getErrorMessage } from '@/core/http/api-error';
import { useNotify } from '@/core/notify/NotifyProvider';
import { formatDisplayDate } from '@/core/utils/date.util';
import { formatRupiah } from '@/core/utils/format.util';

import { invoicesService } from '../services/invoices.service';
import type { InvoiceDeleteByFilePreview } from '../types';

const visuallyHidden = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
} as const;

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export const DeleteInvoicesFileDialog = ({ open, onClose, onSuccess }: Props) => {
  const notify = useNotify();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<InvoiceDeleteByFilePreview | null>(null);
  const [hardDelete, setHardDelete] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setHardDelete(false);
    setLoadingPreview(false);
    setSubmitting(false);
    setErrorMessage(null);
    setInputKey((k) => k + 1);
  };

  const handleClose = () => {
    if (submitting) return;
    resetState();
    onClose();
  };

  const handleFileChange = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setErrorMessage(null);
    setLoadingPreview(true);

    try {
      const result = await invoicesService.previewDeleteByFile(selectedFile);
      setPreview(result);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Gagal memproses berkas.'));
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDelete = async () => {
    if (!preview || preview.found_count === 0) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const codes = preview.found_invoices.map((i) => i.invoice_code);
      const result = await invoicesService.deleteByCodes(codes, hardDelete);
      notify.success(
        `${result.deleted_invoices_count} tagihan berhasil dihapus${
          result.affected_messages_count > 0
            ? ` (${result.affected_messages_count} antrean pesan dibatalkan)`
            : ''
        }.`,
      );
      resetState();
      onSuccess();
      onClose();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Gagal menghapus tagihan.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="delete-invoices-dialog-title"
    >
      <DialogTitle
        id="delete-invoices-dialog-title"
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          m: 0,
          p: 2,
        }}
      >
        Hapus Tagihan via Berkas
        <IconButton
          aria-label="Tutup dialog"
          size="small"
          onClick={handleClose}
          disabled={submitting}
        >
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          {!preview ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Unggah berkas Excel (<code>.xlsx</code>) atau <code>.csv</code> yang berisi daftar
                kode tagihan yang ingin dihapus. Berkas dapat menggunakan kolom bernama{' '}
                <strong>Kode Tagihan</strong> atau <strong>invoice_code</strong>.
              </Typography>

              <Box
                sx={{
                  alignItems: 'center',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  p: 4,
                  textAlign: 'center',
                }}
              >
                <UploadFileOutlinedIcon sx={{ color: 'text.secondary', fontSize: 48 }} />
                <Typography variant="body1">
                  {file?.name ?? 'Pilih berkas untuk menghapus tagihan'}
                </Typography>
                <Button
                  component="label"
                  variant="contained"
                  disabled={loadingPreview}
                  startIcon={
                    loadingPreview ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <UploadFileOutlinedIcon />
                    )
                  }
                >
                  {loadingPreview ? 'Membaca berkas...' : 'Pilih berkas (.csv / .xlsx)'}
                  <input
                    key={inputKey}
                    type="file"
                    data-testid="delete-file-input"
                    accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                    style={visuallyHidden}
                    onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Maksimal ukuran berkas 5 MB (hingga 20.000 baris data).
                </Typography>
              </Box>
            </Box>
          ) : (
            <Stack spacing={2}>
              <Alert severity={preview.found_count > 0 ? 'warning' : 'info'}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Ringkasan Berkas: {file?.name}
                </Typography>
                <Typography variant="body2">
                  • Total kode tagihan di berkas: <strong>{preview.total_codes_in_file}</strong>
                  <br />• Tagihan terdaftar yang cocok: <strong>{preview.found_count}</strong>
                  <br />• Tagihan tidak ditemukan / sudah terhapus:{' '}
                  <strong>{preview.not_found_count}</strong>
                  <br />• Antrean pesan WhatsApp yang terdampak:{' '}
                  <strong>{preview.affected_messages_count}</strong>
                </Typography>
              </Alert>

              {preview.found_count > 0 ? (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Pratinjau Data Tagihan yang Akan Dihapus ({preview.found_count}):
                  </Typography>

                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 240 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Kode Tagihan</TableCell>
                          <TableCell>NIM</TableCell>
                          <TableCell>Nama Mahasiswa</TableCell>
                          <TableCell>Semester</TableCell>
                          <TableCell align="right">Nominal</TableCell>
                          <TableCell>Jatuh Tempo</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {preview.found_invoices.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell sx={{ fontWeight: 500 }}>{inv.invoice_code}</TableCell>
                            <TableCell>{inv.student_nim}</TableCell>
                            <TableCell>{inv.student_name}</TableCell>
                            <TableCell>{inv.semester}</TableCell>
                            <TableCell align="right">{formatRupiah(inv.amount)}</TableCell>
                            <TableCell>{formatDisplayDate(inv.due_date)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={hardDelete}
                        onChange={(e) => setHardDelete(e.target.checked)}
                        color="error"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Hapus permanen dari database (Hard Delete)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Bila tidak dicentang, data hanya ditandai nonaktif (Soft Delete) dan pesan
                          antrean dibatalkan.
                        </Typography>
                      </Box>
                    }
                  />
                </>
              ) : (
                <Alert severity="error">
                  Tidak ditemukan tagihan aktif di database yang cocok dengan kode pada berkas ini.
                </Alert>
              )}
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {preview ? (
          <Button color="inherit" onClick={resetState} disabled={submitting}>
            Pilih berkas lain
          </Button>
        ) : null}
        <Button color="inherit" onClick={handleClose} disabled={submitting}>
          Batal
        </Button>
        {preview && preview.found_count > 0 ? (
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleDelete()}
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DeleteOutlineOutlinedIcon />
              )
            }
          >
            {submitting ? 'Menghapus...' : `Hapus ${preview.found_count} Tagihan`}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};
