'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Popover,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import StoreIcon from '@mui/icons-material/Store';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DashboardIcon from '@mui/icons-material/Dashboard';

const DRAWER_WIDTH = 256;

const navItems = [
  { label: 'Payouts', path: '/payouts', icon: <AccountBalanceWalletIcon fontSize="small" /> },
  { label: 'Vendors', path: '/vendors', icon: <StoreIcon fontSize="small" />, roles: ['OPS'] },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  if (!user) return null;

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  const initials = user.email.split('@')[0].slice(0, 2).toUpperCase();

  const handleNav = (path) => {
    router.push(path);
    if (isMobile) setMobileOpen(false);
  };

  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0f172a',
        color: 'white',
      }}
    >
      {/* Brand */}
      <Box sx={{ px: 3, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DashboardIcon sx={{ color: 'white', fontSize: 18 }} />
        </Box>
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ color: 'white', letterSpacing: 0.3, fontSize: '1.1rem' }}
        >
          PayFlow
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2 }} />

      {/* Nav */}
      <List sx={{ px: 1.5, pt: 2, flex: 1 }}>
        {visibleItems.map((item) => {
          const active = pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.path}
              onClick={() => handleNav(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                py: 1.1,
                px: 2,
                color: active ? 'white' : 'rgba(255,255,255,0.55)',
                bgcolor: active ? 'primary.main' : 'transparent',
                '&:hover': {
                  bgcolor: active ? 'primary.dark' : 'rgba(255,255,255,0.07)',
                  color: 'white',
                },
                transition: 'all 0.15s ease',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: active ? 'white' : 'rgba(255,255,255,0.45)',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: active ? 600 : 400,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ px: 2.5, py: 2 }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
          © 2026 PayFlow
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              border: 'none',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              border: 'none',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Main */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar sx={{ minHeight: '56px !important' }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flexGrow: 1 }} />

            {/* Role badge */}
            <Chip
              label={user.role}
              size="small"
              color={user.role === 'FINANCE' ? 'success' : 'primary'}
              variant="outlined"
              sx={{ mr: 1.5, fontWeight: 600, fontSize: '0.7rem' }}
            />

            {/* Avatar */}
            <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: '#0d9488',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {initials}
              </Avatar>
            </IconButton>

            {/* Profile popover */}
            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{
                paper: {
                  sx: { mt: 1, width: 260, borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' },
                },
              }}
            >
              <Box sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: '#0d9488', fontWeight: 700 }}>
                    {initials}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      noWrap
                      sx={{ display: 'block' }}
                    >
                      {user.email}
                    </Typography>
                    <Chip
                      label={user.role}
                      size="small"
                      color={user.role === 'FINANCE' ? 'success' : 'primary'}
                      sx={{ mt: 0.3, height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                    />
                  </Box>
                </Box>
                <Divider sx={{ mb: 1.5 }} />
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<LogoutIcon />}
                  onClick={() => {
                    setAnchorEl(null);
                    logout();
                  }}
                  sx={{ borderRadius: 1.5 }}
                >
                  Sign out
                </Button>
              </Box>
            </Popover>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box
          component="main"
          sx={{ flexGrow: 1, bgcolor: 'background.default', p: { xs: 2, md: 3 } }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
