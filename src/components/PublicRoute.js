'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Already logged in — redirect away from login page
    if (!loading && user) {
      window.location.href = '/payouts';
    }
  }, [user, loading]);

  // Show spinner only during initial localStorage check
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // After login: keep showing the form while navigation happens
  return <>{children}</>;
}
