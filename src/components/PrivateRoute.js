'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Handle direct URL access when not logged in (no token in storage)
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [user, loading]);

  // Show spinner during initial auth check
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // Not logged in: blank while hard redirect fires
  if (!user) return null;

  return <>{children}</>;
}
