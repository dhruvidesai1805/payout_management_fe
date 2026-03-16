'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PublicRoute from '@/components/PublicRoute';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { toast } from 'sonner';

export default function LoginPage() {
  return (
    <PublicRoute>
      <LoginForm />
    </PublicRoute>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Prefetch the payouts page so navigation is instant after login
  useEffect(() => {
    router.prefetch('/payouts');
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fillCredentials = (role) => {
    if (role === 'OPS') {
      setEmail('ops@demo.com');
      setPassword('ops123');
    } else {
      setEmail('finance@demo.com');
      setPassword('fin123');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: '#f1f5f9',
      }}
    >
      {/* Left panel — branding */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '45%',
          bgcolor: '#0f172a',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 6,
          gap: 3,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            bgcolor: '#0d9488',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AccountBalanceWalletIcon sx={{ color: 'white', fontSize: 36 }} />
        </Box>
        <Typography variant="h4" fontWeight={700} sx={{ color: 'white', textAlign: 'center' }}>
          PayFlow
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: 'rgba(255,255,255,0.55)', textAlign: 'center', maxWidth: 320, lineHeight: 1.7 }}
        >
          Streamlined payout management for your operations and finance teams.
        </Typography>

      </Box>

      {/* Right panel — form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            width: '100%',
            maxWidth: 400,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          }}
        >
          {/* Mobile brand */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 1.5,
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                bgcolor: '#0d9488',
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AccountBalanceWalletIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              PayFlow
            </Typography>
          </Box>

          <Typography variant="h5" fontWeight={700} gutterBottom>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your credentials to access your dashboard
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Email address"
              type="email"
              required
              fullWidth
              margin="normal"
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <TextField
              label="Password"
              type="password"
              required
              fullWidth
              margin="normal"
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              sx={{ mt: 2.5, py: 1.2, borderRadius: 1.5, fontWeight: 600 }}
            >
              {submitting ? <CircularProgress size={20} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          {/* Mobile credentials hint */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 3 }}>
            <Divider sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.disabled">
                demo accounts
              </Typography>
            </Divider>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => fillCredentials('OPS')}
                sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}
              >
                Use OPS account
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="success"
                onClick={() => fillCredentials('FINANCE')}
                sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}
              >
                Use FINANCE account
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
