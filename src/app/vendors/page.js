'use client';

import { useAuth } from '@/context/AuthContext';
import PrivateRoute from '@/components/PrivateRoute';
import AppShell from '@/components/AppShell';
import { useEffect, useState, useCallback, useMemo } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import StoreIcon from '@mui/icons-material/Store';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const vendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  upi_id: z.string().optional(),
  bank_account: z.string().optional(),
  ifsc: z.string().refine(
    (v) => !v || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.toUpperCase()),
    { message: 'Invalid IFSC format (e.g. HDFC0001234)' }
  ),
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

export default function VendorsPage() {
  return (
    <PrivateRoute>
      <AppShell>
        <VendorsContent />
      </AppShell>
    </PrivateRoute>
  );
}

function VendorsContent() {
  const { user, token } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', upi_id: '', bank_account: '', ifsc: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchVendors = useCallback(async () => {
    if (user?.role !== 'OPS' || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/vendors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch vendors');
      setVendors(await res.json());
    } catch (err) {
      setError(err.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const filtered = useMemo(() => {
    if (!search.trim()) return vendors;
    const q = search.toLowerCase();
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.upi_id?.toLowerCase().includes(q) ||
        v.bank_account?.toLowerCase().includes(q) ||
        v.ifsc?.toLowerCase().includes(q)
    );
  }, [vendors, search]);

  const handleOpen = () => {
    setForm({ name: '', upi_id: '', bank_account: '', ifsc: '' });
    setFieldErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    if (!submitting) setOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const result = vendorSchema.safeParse(form);
    if (!result.success) {
      const errs = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (key && !errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create vendor');
      }
      setOpen(false);
      toast.success('Vendor added successfully');
      await fetchVendors();
    } catch (err) {
      setFieldErrors({ _form: err.message || 'Failed to create vendor' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (user.role !== 'OPS') {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        Access denied. Only OPS users can manage vendors.
      </Alert>
    );
  }

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Vendors
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your payout recipients
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{ borderRadius: 1.5 }}
        >
          Add Vendor
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Search bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by name, UPI ID, account or IFSC..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: '100%', sm: 380 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : vendors.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ p: 6, textAlign: 'center', borderRadius: 2.5 }}
        >
          <StoreIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No vendors yet
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            Add your first vendor to start creating payouts
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
            Add Vendor
          </Button>
        </Paper>
      ) : filtered.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2.5 }}>
          <Typography color="text.secondary">
            No vendors match &quot;{search}&quot;
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary' }}>
                  NAME
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary' }}>
                  UPI ID
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary' }}>
                  BANK ACCOUNT
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary' }}>
                  IFSC
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary' }}>
                  STATUS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 600 }}>{v.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {v.upi_id || <span style={{ color: '#94a3b8' }}>—</span>}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {v.bank_account || <span style={{ color: '#94a3b8' }}>—</span>}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {v.ifsc || <span style={{ color: '#94a3b8' }}>—</span>}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={v.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={v.is_active ? 'success' : 'default'}
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 22, fontWeight: 600 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Vendor Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogTitle sx={{ fontWeight: 700 }}>Add New Vendor</DialogTitle>
          <DialogContent>
            {fieldErrors._form && (
              <Alert severity="error" sx={{ mb: 1.5, borderRadius: 1.5 }}>
                {fieldErrors._form}
              </Alert>
            )}

            <Box sx={{ mt: 1 }}>
              <TextField
                label="Vendor Name"
                required
                fullWidth
                size="small"
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setFieldErrors((f) => ({ ...f, name: undefined })); }}
                error={!!fieldErrors.name}
                autoFocus
              />
              <FieldError msg={fieldErrors.name} />
            </Box>

            <Box sx={{ mt: 2 }}>
              <TextField
                label="UPI ID"
                fullWidth
                size="small"
                placeholder="vendor@upi"
                value={form.upi_id}
                onChange={(e) => { setForm((f) => ({ ...f, upi_id: e.target.value })); setFieldErrors((f) => ({ ...f, upi_id: undefined })); }}
                error={!!fieldErrors.upi_id}
              />
              <FieldError msg={fieldErrors.upi_id} />
            </Box>

            <Box sx={{ mt: 2 }}>
              <TextField
                label="Bank Account Number"
                fullWidth
                size="small"
                value={form.bank_account}
                onChange={(e) => { setForm((f) => ({ ...f, bank_account: e.target.value })); setFieldErrors((f) => ({ ...f, bank_account: undefined })); }}
                error={!!fieldErrors.bank_account}
              />
              <FieldError msg={fieldErrors.bank_account} />
            </Box>

            <Box sx={{ mt: 2 }}>
              <TextField
                label="IFSC Code"
                fullWidth
                size="small"
                placeholder="e.g. HDFC0001234"
                value={form.ifsc}
                onChange={(e) => { setForm((f) => ({ ...f, ifsc: e.target.value.toUpperCase() })); setFieldErrors((f) => ({ ...f, ifsc: undefined })); }}
                error={!!fieldErrors.ifsc}
              />
              <FieldError msg={fieldErrors.ifsc} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ minWidth: 120, borderRadius: 1.5 }}
            >
              {submitting ? <CircularProgress size={20} color="inherit" /> : 'Save Vendor'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
