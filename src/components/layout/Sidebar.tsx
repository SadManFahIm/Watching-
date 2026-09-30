import type { ComponentType } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Avatar,
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Typography,
  Button,
} from '@mui/material';
import {
  DashboardOutlined,
  ReceiptLongOutlined,
  FavoriteBorder,
  PersonOutlined,
  AdminPanelSettingsOutlined,
  Inventory2Outlined,
  ListAltOutlined,
  PeopleAltOutlined,
  RateReviewOutlined,
  Logout,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/auth.store';

interface SidebarLink {
  label: string;
  to: string;
  icon: ComponentType;
}

interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuthStore();

  const sections: SidebarSection[] = [
    {
      title: 'Account',
      links: [
        { label: 'Dashboard', to: '/dashboard', icon: DashboardOutlined },
        { label: 'My Orders', to: '/dashboard/orders', icon: ReceiptLongOutlined },
        { label: 'Wishlist', to: '/wishlist', icon: FavoriteBorder },
        { label: 'Profile', to: '/profile', icon: PersonOutlined },
      ],
    },
  ];

  if (isAdmin) {
    sections.push({
      title: 'Administration',
      links: [
        { label: 'Overview', to: '/admin', icon: AdminPanelSettingsOutlined },
        { label: 'Products', to: '/admin/products', icon: Inventory2Outlined },
        { label: 'Orders', to: '/admin/orders', icon: ListAltOutlined },
        { label: 'Users', to: '/admin/users', icon: PeopleAltOutlined },
        { label: 'Reviews', to: '/admin/reviews', icon: RateReviewOutlined },
      ],
    });
  }

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`);

  const handleSignOut = async () => {
    if (onNavigate) {
      onNavigate();
    }
    await signOut();
  };

  return (
    <Box
      component="nav"
      aria-label="Account navigation"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
      }}
    >
      {/* Brand */}
      <Box sx={{ p: 2.5 }}>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ fontWeight: 800, color: 'primary.main', textDecoration: 'none' }}
        >
          Classic Watch Pro
        </Typography>
      </Box>
      <Divider />

      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {sections.map((section) => (
          <List
            key={section.title}
            dense
            disablePadding
            sx={{ mb: 1 }}
            subheader={
              <ListSubheader
                disableSticky
                sx={{
                  bgcolor: 'transparent',
                  fontWeight: 700,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  fontSize: '0.72rem',
                  lineHeight: '32px',
                }}
              >
                {section.title}
              </ListSubheader>
            }
          >
            {/* ListItem wrappers keep the anchors valid <li> children of the
                <ul> (axe 'list' rule — bare anchors inside <ul> are invalid). */}
            {section.links.map((link) => (
              <ListItem key={link.to} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  component={RouterLink}
                  to={link.to}
                  selected={isActive(link.to)}
                  onClick={() => onNavigate?.()}
                  sx={{
                    mx: 1,
                    borderRadius: 1.5,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                    <link.icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={link.label}
                    slotProps={{ primary: { sx: { fontSize: '0.9rem', fontWeight: 500 } } }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ))}
      </Box>

      <Divider />
      {user && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={user.photoURL}
            sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.95rem' }}
          >
            {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              noWrap
              sx={{
                fontWeight: 700,
              }}
            >
              {user.displayName || 'User'}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: 'text.secondary',
              }}
            >
              {user.email}
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={handleSignOut}
            aria-label="Sign out"
            sx={{ minWidth: 0, p: 0.75, color: 'text.secondary' }}
          >
            <Logout fontSize="small" />
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Sidebar;
