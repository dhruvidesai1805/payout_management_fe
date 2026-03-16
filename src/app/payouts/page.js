'use client';

import { useAuth } from '@/context/AuthContext';
import PrivateRoute from '@/components/PrivateRoute';
import AppShell from '@/components/AppShell';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import {
  Typography,
  Button,
  Chip,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FilterListIcon from '@mui/icons-material/FilterList';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const STATUS_STYLES = {
  Draft: { color: 'default', variant: 'outlined' },
  Submitted: { color: 'info', variant: 'outlined' },
  Approved: { color: 'success', variant: 'outlined' },
  Rejected: { color: 'error', variant: 'outlined' },
};

const payoutSchema = z.object({
  vendor_id: z.string().min(1, 'Please select a vendor'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  mode: z.enum(['UPI', 'IMPS', 'NEFT'], { message: 'Please select a payment mode' }),
  note: z.string().optional(),
});

const rejectSchema = z.object({
  decision_reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <Typography
      variant="caption"
      sx={{ color: 'error.main', fontStyle: 'italic', mt: 0.4, display: 'block', ml: 0.5 }}
    >
      {msg}
    </Typography>
  );
}

export default function PayoutsPage() {
  return (
    <PrivateRoute>
      <AppShell>
        <PayoutsContent />
      </AppShell>
    </PrivateRoute>
  );
}

function PayoutsContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const prefetchedIds = useRef(new Set());
  const [payouts, setPayouts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectErrors, setRejectErrors] = useState({});

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ vendor_id: '', amount: '', mode: 'UPI', note: '' });
  const [createFieldErrors, setCreateFieldErrors] = useState({});
  const [creating, setCreating] = useState(false);

  const fetchPayouts = useCallback(async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (vendorFilter) params.set('vendor_id', vendorFilter);

      const res = await fetch(`${API_URL}/api/payouts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch payouts');
      setPayouts(await res.json());
    } catch (err) {
      setError(err.message || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  }, [user, token, statusFilter, vendorFilter]);

  useEffect(() => {
    if (!user || !token) return;
    if (user.role === 'OPS') {
      fetch(`${API_URL}/api/vendors`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.ok ? r.json() : [])
        .then(setVendors)
        .catch(() => {});
    }
  }, [user, token]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleAction = async (payoutId, action, body) => {
    setActionLoading(payoutId);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/payouts/${payoutId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || `Failed to ${action}`);
      }
      const labels = { submit: 'Payout submitted', approve: 'Payout approved', reject: 'Payout rejected' };
      toast.success(labels[action] || `${action} successful`);
      setRejectTarget(null);
      setRejectReason('');
      await fetchPayouts();
    } catch (err) {
      const msg = err.message || `Failed to ${action}`;
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateFieldErrors({});

    const parsed = {
      vendor_id: createForm.vendor_id,
      amount: Number(createForm.amount),
      mode: createForm.mode,
      note: createForm.note,
    };

    const result = payoutSchema.safeParse(parsed);
    if (!result.success) {
      const errs = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (key && !errs[key]) errs[key] = issue.message;
      }
      setCreateFieldErrors(errs);
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/payouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create payout');
      }
      setCreateOpen(false);
      toast.success('Payout created successfully');
      await fetchPayouts();
    } catch (err) {
      setCreateFieldErrors({ _form: err.message || 'Failed to create payout' });
    } finally {
      setCreating(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Payouts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.role === 'FINANCE' ? 'Review and approve payout requests' : 'Create and manage payout requests'}
          </Typography>
        </Box>
        {user.role === 'OPS' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setCreateForm({ vendor_id: '', amount: '', mode: 'UPI', note: '' });
              setCreateFieldErrors({});
              setCreateOpen(true);
            }}
            sx={{ borderRadius: 1.5 }}
          >
            New Payout
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          mb: 2,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          alignItems: 'center',
        }}
      >
        <FilterListIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="Draft">Draft</MenuItem>
            <MenuItem value="Submitted">Submitted</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
          </Select>
        </FormControl>

        {user.role === 'OPS' && vendors.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Vendor</InputLabel>
            <Select
              value={vendorFilter}
              label="Vendor"
              onChange={(e) => setVendorFilter(e.target.value)}
            >
              <MenuItem value="">All vendors</MenuItem>
              {vendors.map((v) => (
                <MenuItem key={v._id} value={v._id}>
                  {v.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {(statusFilter || vendorFilter) && (
          <Button
            size="small"
            onClick={() => { setStatusFilter(''); setVendorFilter(''); }}
            sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
          >
            Clear filters
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : payouts.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ p: 5, textAlign: 'center', borderRadius: 2.5 }}
        >
          <Typography color="text.secondary">No payouts found.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary' }}>VENDOR</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary' }}>AMOUNT</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary' }}>MODE</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary' }}>CREATED BY</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary' }}>DATE</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payouts.map((p) => {
                const isActioning = actionLoading === p._id;
                const canSubmit = user.role === 'OPS' && p.status === 'Draft';
                const canApprove = user.role === 'FINANCE' && p.status === 'Submitted';
                const canReject = user.role === 'FINANCE' && p.status === 'Submitted';
                const style = STATUS_STYLES[p.status] || STATUS_STYLES.Draft;

                return (
                  <TableRow
                    key={p._id}
                    hover
                    sx={{ '&:last-child td': { border: 0 } }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{p.vendor_id?.name || '—'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      ₹{p.amount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Chip label={p.mode} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={p.status}
                        color={style.color}
                        variant={style.variant}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                      {p.created_by?.email || '—'}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                      {new Date(p.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={0.5} justifyContent="flex-end">
                        {canSubmit && (
                          <Tooltip title="Submit for approval">
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={!!actionLoading}
                                onClick={() => handleAction(p._id, 'submit')}
                              >
                                {isActioning ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <SendIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        {canApprove && (
                          <Tooltip title="Approve">
                            <span>
                              <IconButton
                                size="small"
                                color="success"
                                disabled={!!actionLoading}
                                onClick={() => handleAction(p._id, 'approve')}
                              >
                                {isActioning ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <CheckCircleOutlineIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        {canReject && (
                          <Tooltip title="Reject">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={!!actionLoading}
                                onClick={() => setRejectTarget(p._id)}
                              >
                                <HighlightOffIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        <Tooltip title="View details">
                          <IconButton
                            size="small"
                            onMouseEnter={() => {
                              if (!prefetchedIds.current.has(p._id)) {
                                prefetchedIds.current.add(p._id);
                                router.prefetch(`/payouts/${p._id}`);
                              }
                            }}
                            onClick={() => router.push(`/payouts/${p._id}`)}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Reject dialog */}
      <Dialog
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectReason(''); setRejectErrors({}); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Payout</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 0.5 }}>
            <TextField
              label="Reason for rejection"
              required
              fullWidth
              multiline
              rows={3}
              size="small"
              value={rejectReason}
              onChange={(e) => { setRejectReason(e.target.value); setRejectErrors({}); }}
              placeholder="Explain clearly why this payout is being rejected..."
              error={!!rejectErrors.decision_reason}
            />
            <FieldError msg={rejectErrors.decision_reason} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => { setRejectTarget(null); setRejectReason(''); setRejectErrors({}); }}
            disabled={!!actionLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={!!actionLoading}
            onClick={() => {
              const result = rejectSchema.safeParse({ decision_reason: rejectReason });
              if (!result.success) {
                const errs = {};
                for (const issue of result.error.issues) {
                  const key = issue.path[0];
                  if (key && !errs[key]) errs[key] = issue.message;
                }
                setRejectErrors(errs);
                return;
              }
              if (rejectTarget) handleAction(rejectTarget, 'reject', { decision_reason: rejectReason });
            }}
            sx={{ borderRadius: 1.5 }}
          >
            {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Reject Payout'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Payout dialog */}
      <Dialog
        open={createOpen}
        onClose={() => { if (!creating) { setCreateOpen(false); setCreateFieldErrors({}); } }}
        maxWidth="sm"
        fullWidth
      >
        <Box component="form" onSubmit={handleCreate} noValidate>
          <DialogTitle sx={{ fontWeight: 700 }}>New Payout Request</DialogTitle>
          <DialogContent>
            {createFieldErrors._form && (
              <Alert severity="error" sx={{ mb: 1.5, borderRadius: 1.5 }}>
                {createFieldErrors._form}
              </Alert>
            )}

            <Box sx={{ mt: 1 }}>
              <FormControl fullWidth size="small" error={!!createFieldErrors.vendor_id}>
                <InputLabel required>Vendor</InputLabel>
                <Select
                  value={createForm.vendor_id}
                  label="Vendor"
                  onChange={(e) => { setCreateForm((f) => ({ ...f, vendor_id: e.target.value })); setCreateFieldErrors((f) => ({ ...f, vendor_id: undefined })); }}
                >
                  {vendors.length === 0 && (
                    <MenuItem disabled value="">
                      No vendors available — add one first
                    </MenuItem>
                  )}
                  {vendors.map((v) => (
                    <MenuItem key={v._id} value={v._id}>
                      {v.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FieldError msg={createFieldErrors.vendor_id} />
            </Box>

            <Box sx={{ mt: 2 }}>
              <TextField
                label="Amount (₹)"
                type="number"
                required
                fullWidth
                size="small"
                value={createForm.amount}
                onChange={(e) => { setCreateForm((f) => ({ ...f, amount: e.target.value })); setCreateFieldErrors((f) => ({ ...f, amount: undefined })); }}
                inputProps={{ min: 0.01, step: 0.01 }}
                error={!!createFieldErrors.amount}
              />
              <FieldError msg={createFieldErrors.amount} />
            </Box>

            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth size="small" error={!!createFieldErrors.mode}>
                <InputLabel required>Payment Mode</InputLabel>
                <Select
                  value={createForm.mode}
                  label="Payment Mode"
                  onChange={(e) => { setCreateForm((f) => ({ ...f, mode: e.target.value })); setCreateFieldErrors((f) => ({ ...f, mode: undefined })); }}
                >
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="IMPS">IMPS</MenuItem>
                  <MenuItem value="NEFT">NEFT</MenuItem>
                </Select>
              </FormControl>
              <FieldError msg={createFieldErrors.mode} />
            </Box>

            <Box sx={{ mt: 2 }}>
              <TextField
                label="Note (optional)"
                fullWidth
                size="small"
                multiline
                rows={2}
                value={createForm.note}
                onChange={(e) => setCreateForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Add any notes or remarks..."
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => { setCreateOpen(false); setCreateFieldErrors({}); }} disabled={creating}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={creating}
              sx={{ minWidth: 140, borderRadius: 1.5 }}
            >
              {creating ? <CircularProgress size={20} color="inherit" /> : 'Create Payout'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
