import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  Container,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 260;

const DashboardLayout = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: `1px solid ${theme.palette.divider}`,
          width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { lg: `${DRAWER_WIDTH}px` },
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          {!isDesktop && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
            }}
          >
            My Account
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Desktop sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
          },
        }}
        open
      >
        <Sidebar />
      </Drawer>

      {/* Mobile sidebar */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Container maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
