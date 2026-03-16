'use client';

import { useAuth } from '@/context/AuthContext';
import PrivateRoute from '@/components/PrivateRoute';
import AppShell from '@/components/AppShell';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { z } from 'zod';
import {
  Typography,
  Button,
  Chip,
  Box,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import StoreIcon from '@mui/icons-material/Store';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

// Status workflow steps
const STATUS_STEPS = ['Draft', 'Submitted', 'Approved'];
const STATUS_ORDER = { Draft: 0, Submitted: 1, Approved: 2, Rejected: 2 };

const STATUS_COLOR_MAP = {
  Draft: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  Submitted: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  Approved: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  Rejected: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
};

const AUDIT_ACTION_CONFIG = {
  CREATED: { color: '#64748b', bgColor: '#f8fafc', borderColor: '#e2e8f0', label: 'Created' },
  SUBMITTED: { color: '#1d4ed8', bgColor: '#eff6ff', borderColor: '#bfdbfe', label: 'Submitted' },
  APPROVED: { color: '#15803d', bgColor: '#f0fdf4', borderColor: '#bbf7d0', label: 'Approved' },
  REJECTED: { color: '#b91c1c', bgColor: '#fef2f2', borderColor: '#fecaca', label: 'Rejected' },
};

function StatusProgressBar({ status }) {
  const currentStep = STATUS_ORDER[status] ?? 0;
  const isRejected = status === 'Rejected';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STATUS_STEPS.map((step, idx) => {
        const isActive = idx <= currentStep && !isRejected;
        const isLastApproved = idx === 2 && status === 'Approved';
        const isLastRejected = idx === 2 && isRejected;

        return (
          <Box key={step} sx={{ display: 'flex', alignItems: 'center', flex: idx < 2 ? 1 : 'none' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.4,
                minWidth: 72,
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: '2px solid',
                  borderColor: isLastRejected
                    ? '#b91c1c'
                    : isActive
                    ? '#0d9488'
                    : '#e2e8f0',
                  bgcolor: isLastRejected
                    ? '#fef2f2'
                    : isActive
                    ? idx === currentStep && !isLastApproved
                      ? '#0d9488'
                      : '#f0fdf4'
                    : '#f8fafc',
                  color: isLastRejected
                    ? '#b91c1c'
                    : isActive && idx === currentStep && !isLastApproved
                    ? 'white'
                    : isActive
                    ? '#0d9488'
                    : '#94a3b8',
                  transition: 'all 0.2s',
                }}
              >
                {isLastRejected ? '✕' : isLastApproved ? '✓' : idx + 1}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: isLastRejected
                    ? '#b91c1c'
                    : isActive
                    ? '#0d9488'
                    : '#94a3b8',
                  whiteSpace: 'nowrap',
                }}
              >
                {isLastRejected && idx === 2 ? 'Rejected' : step}
              </Typography>
            </Box>

            {idx < 2 && (
              <Box
                sx={{
                  flex: 1,
                  height: 2,
                  mx: 0.5,
                  mb: 2,
                  bgcolor: isActive && currentStep > idx && !isRejected ? '#0d9488' : '#e2e8f0',
                  transition: 'background-color 0.2s',
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function InfoCard({ icon, title, children }) {
  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 2.5, overflow: 'hidden', height: '100%' }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          bgcolor: '#f8fafc',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.8rem', letterSpacing: 0.3 }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}

function DetailRow({ label, value, mono = false }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 0.8 }}>
      <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ minWidth: 110, mt: 0.1 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={500}
        sx={{
          textAlign: 'right',
          fontFamily: mono ? 'monospace' : 'inherit',
          fontSize: mono ? '0.82rem' : '0.875rem',
        }}
      >
        {value || <span style={{ color: '#94a3b8' }}>—</span>}
      </Typography>
    </Box>
  );
}

export default function PayoutDetailPage() {
  return (
    <PrivateRoute>
      <AppShell>
        <PayoutDetailContent />
      </AppShell>
    </PrivateRoute>
  );
}

function PayoutDetailContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [payout, setPayout] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectErrors, setRejectErrors] = useState({});

  const fetchData = useCallback(async () => {
    if (!token || !id) return;
    try {
      const [payoutRes, auditRes] = await Promise.all([
        fetch(`${API_URL}/api/payouts/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/payouts/${id}/audit`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (!payoutRes.ok) throw new Error('Payout not found');
      setPayout(await payoutRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
    } catch (err) {
      setError(err.message || 'Failed to load payout');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (action, body) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/payouts/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || `Failed to ${action} payout`);
      }
      const labels = {
        submit: 'Payout submitted for review',
        approve: 'Payout approved successfully',
        reject: 'Payout rejected',
      };
      toast.success(labels[action] || `${action} successful`);
      setRejectOpen(false);
      setRejectReason('');
      setRejectErrors({});
      setLoading(true);
      await fetchData();
    } catch (err) {
      const msg = err.message || `Failed to ${action}`;
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (!payout) {
    return <Alert severity="error">{error || 'Payout not found'}</Alert>;
  }

  const canSubmit = user.role === 'OPS' && payout.status === 'Draft';
  const canApprove = user.role === 'FINANCE' && payout.status === 'Submitted';
  const canReject = user.role === 'FINANCE' && payout.status === 'Submitted';
  const statusStyle = STATUS_COLOR_MAP[payout.status] || STATUS_COLOR_MAP.Draft;

  return (
    <>
      {/* Top nav */}
      <Box display="flex" alignItems="center" gap={1} mb={2.5}>
        <IconButton size="small" onClick={() => router.push('/payouts')} sx={{ mr: 0.5 }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          Payouts
        </Typography>
        <Typography variant="body2" color="text.disabled">/</Typography>
        <Typography variant="body2" fontWeight={600} color="text.primary">
          Detail
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Hero header card */}
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2.5,
          mb: 2.5,
          overflow: 'hidden',
          borderColor: statusStyle.border,
        }}
      >
        {/* Colored top stripe */}
        <Box
          sx={{
            height: 4,
            bgcolor: payout.status === 'Approved'
              ? '#16a34a'
              : payout.status === 'Rejected'
              ? '#dc2626'
              : payout.status === 'Submitted'
              ? '#2563eb'
              : '#94a3b8',
          }}
        />

        <Box sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
            {/* Amount + ID */}
            <Box>
              <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1, mb: 0.5 }}>
                ₹{payout.amount.toLocaleString('en-IN')}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                #{payout._id.slice(-10).toUpperCase()}
              </Typography>
            </Box>

            {/* Status + progress */}
            <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1.5}>
              <Box
                sx={{
                  px: 2,
                  py: 0.6,
                  borderRadius: 2,
                  bgcolor: statusStyle.bg,
                  border: '1.5px solid',
                  borderColor: statusStyle.border,
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ color: statusStyle.text, fontSize: '0.8rem', letterSpacing: 0.5 }}
                >
                  {payout.status.toUpperCase()}
                </Typography>
              </Box>

              <StatusProgressBar status={payout.status} />
            </Box>
          </Box>

          {/* Action buttons */}
          {(canSubmit || canApprove || canReject) && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                  {canSubmit && 'Ready to submit for finance review.'}
                  {(canApprove || canReject) && 'This payout is awaiting your decision.'}
                </Typography>
                {canSubmit && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={actionLoading ? <CircularProgress size={14} color="inherit" /> : <SendIcon fontSize="small" />}
                    disabled={actionLoading}
                    onClick={() => handleAction('submit')}
                    sx={{ borderRadius: 1.5, px: 2 }}
                  >
                    Submit for Approval
                  </Button>
                )}
                {canApprove && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={actionLoading ? <CircularProgress size={14} color="inherit" /> : <CheckCircleOutlineIcon fontSize="small" />}
                    disabled={actionLoading}
                    onClick={() => handleAction('approve')}
                    sx={{ borderRadius: 1.5, px: 2 }}
                  >
                    Approve
                  </Button>
                )}
                {canReject && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<HighlightOffIcon fontSize="small" />}
                    disabled={actionLoading}
                    onClick={() => setRejectOpen(true)}
                    sx={{ borderRadius: 1.5, px: 2 }}
                  >
                    Reject
                  </Button>
                )}
              </Box>
            </>
          )}
        </Box>
      </Paper>

      {/* Two-column info section */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {/* Payout details */}
        <Grid item xs={12} md={7}>
          <InfoCard icon={<AccountBalanceWalletIcon sx={{ fontSize: 18 }} />} title="Payout Details">
            <DetailRow label="Payment Mode" value={payout.mode} />
            <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />
            <DetailRow
              label="Created by"
              value={payout.created_by?.email}
            />
            <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />
            <DetailRow
              label="Created at"
              value={new Date(payout.createdAt).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            />
            <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />
            <DetailRow
              label="Last updated"
              value={new Date(payout.updatedAt).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            />
            {payout.note && (
              <>
                <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />
                <DetailRow label="Note" value={payout.note} />
              </>
            )}
            {payout.decision_reason && (
              <>
                <Divider sx={{ my: 1 }} />
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: '#fef2f2',
                    border: '1px solid #fecaca',
                    display: 'flex',
                    gap: 1,
                    alignItems: 'flex-start',
                  }}
                >
                  <HighlightOffIcon sx={{ color: '#dc2626', fontSize: 16, mt: 0.2, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#b91c1c', display: 'block', mb: 0.3 }}>
                      REJECTION REASON
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#7f1d1d' }}>
                      {payout.decision_reason}
                    </Typography>
                  </Box>
                </Box>
              </>
            )}
          </InfoCard>
        </Grid>

        {/* Vendor details */}
        <Grid item xs={12} md={5}>
          <InfoCard icon={<StoreIcon sx={{ fontSize: 18 }} />} title="Vendor">
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <StoreIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {payout.vendor_id?.name || '—'}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Vendor
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 1.5 }} />

            {payout.vendor_id?.upi_id ? (
              <DetailRow label="UPI ID" value={payout.vendor_id.upi_id} mono />
            ) : null}
            {payout.vendor_id?.bank_account ? (
              <DetailRow label="Bank Account" value={payout.vendor_id.bank_account} mono />
            ) : null}
            {payout.vendor_id?.ifsc ? (
              <DetailRow label="IFSC Code" value={payout.vendor_id.ifsc} mono />
            ) : null}
            {!payout.vendor_id?.upi_id && !payout.vendor_id?.bank_account && !payout.vendor_id?.ifsc && (
              <Typography variant="caption" color="text.disabled">
                No payment details on record
              </Typography>
            )}
          </InfoCard>
        </Grid>
      </Grid>

      {/* Audit trail — card list style */}
      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            bgcolor: '#f8fafc',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.8rem', letterSpacing: 0.3 }}>
            AUDIT TRAIL
          </Typography>
          <Chip
            label={`${auditLogs.length} event${auditLogs.length !== 1 ? 's' : ''}`}
            size="small"
            sx={{ ml: 'auto', height: 20, fontSize: '0.68rem', bgcolor: '#e2e8f0', color: '#475569' }}
          />
        </Box>

        {auditLogs.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.disabled">
              No audit events recorded.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {auditLogs.map((log, idx) => {
              const cfg = AUDIT_ACTION_CONFIG[log.action] || AUDIT_ACTION_CONFIG.CREATED;
              return (
                <Box
                  key={log._id}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'flex-start',
                    position: 'relative',
                  }}
                >
                  {/* Step number bubble */}
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: cfg.bgColor,
                      border: '2px solid',
                      borderColor: cfg.borderColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      mt: 0.3,
                    }}
                  >
                    <Typography variant="caption" fontWeight={700} sx={{ color: cfg.color, fontSize: '0.68rem' }}>
                      {idx + 1}
                    </Typography>
                  </Box>

                  {/* Event card */}
                  <Box
                    sx={{
                      flex: 1,
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: cfg.bgColor,
                      border: '1px solid',
                      borderColor: cfg.borderColor,
                      borderLeft: `3px solid ${cfg.color}`,
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: cfg.color }}>
                          {cfg.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          by{' '}
                          <Box component="span" fontWeight={600} color="text.primary">
                            {log.performed_by?.email || 'Unknown'}
                          </Box>
                        </Typography>
                        {log.performed_by?.role && (
                          <Chip
                            label={log.performed_by.role}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              bgcolor: log.performed_by.role === 'FINANCE' ? '#dcfce7' : '#e0f2fe',
                              color: log.performed_by.role === 'FINANCE' ? '#15803d' : '#0369a1',
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Reject dialog */}
      <Dialog
        open={rejectOpen}
        onClose={() => { setRejectOpen(false); setRejectErrors({}); }}
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
              placeholder="Provide a clear reason for rejection..."
              error={!!rejectErrors.decision_reason}
            />
            <FieldError msg={rejectErrors.decision_reason} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => { setRejectOpen(false); setRejectErrors({}); }} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={actionLoading}
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
              handleAction('reject', { decision_reason: rejectReason });
            }}
            sx={{ borderRadius: 1.5 }}
          >
            {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
