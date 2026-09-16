import { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AdminPanelSettingsOutlined,
  HistoryOutlined,
  PersonOutline,
  Search,
  ShieldOutlined,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useUsers, useUpdateUser } from '@/api/users.api';
import { useAuthStore } from '@/store/auth.store';
import AuditTimeline from '@/features/orders/components/AuditTimeline';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import EmptyState from '@/components/common/EmptyState';
import Seo from '@/components/seo/Seo';
import { formatDate } from '@/utils/helpers';
import type { User } from '@/types';

const ManageUsersPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [query, setQuery] = useState('');
  const [historyUser, setHistoryUser] = useState<User | null>(null);

  const { data: users, isLoading, isError, refetch } = useUsers();
  const updateUser = useUpdateUser();

  const filteredUsers = (users ?? []).filter((user) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return [user.displayName, user.email, user.role].join(' ').toLowerCase().includes(term);
  });

  const isSelf = (user: User): boolean => user.id === currentUser?.id;

  const toggleAdmin = (user: User) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';

    if (user.role === 'admin' && isSelf(user)) {
      toast.error('You cannot remove your own admin role.');
      return;
    }

    if (user.role === 'admin') {
      const admins = users?.filter((item) => item.role === 'admin') ?? [];
      if (admins.length <= 1) {
        toast.error('At least one admin account is required.');
        return;
      }
    }

    updateUser.mutate(
      { id: user.id, role: nextRole },
      {
        onSuccess: () =>
          toast.success(
            `${user.displayName || user.email} is now ${nextRole === 'admin' ? 'an admin' : 'a member'}`
          ),
      }
    );
  };

  return (
    <Box>
      <Seo
        title="Manage Users"
        description="Manage registered users and admin access for Classic Watch Pro."
        noindex
        nofollow
      />
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 0.5 }}>
        Users
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {users?.length ?? 0} registered accounts · grant or revoke admin access.
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Search by name, email or role…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        sx={{ maxWidth: 420, mb: 2.5 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        >
          We could not load users.
        </Alert>
      ) : isLoading ? (
        <SkeletonLoader variant="list" count={5} />
      ) : filteredUsers.length === 0 ? (
        <Paper variant="outlined">
          <EmptyState
            title={query ? `No users match “${query}”` : 'No users yet'}
            message={query ? 'Try a different search term.' : 'New registrations will appear here.'}
          />
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary' } }}>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Member since</TableCell>
                <TableCell>Last updated</TableCell>
                <TableCell align="right">Admin access</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => {
                const self = isSelf(user);
                const pending = updateUser.isPending && updateUser.variables?.id === user.id;
                return (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar
                          src={user.photoURL}
                          sx={{
                            width: 38,
                            height: 38,
                            fontSize: '0.9rem',
                            bgcolor: user.role === 'admin' ? 'secondary.main' : 'primary.main',
                          }}
                        >
                          {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            component="div"
                            fontWeight={700}
                            noWrap
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                          >
                            {user.displayName || '—'}
                            {self && (
                              <Chip
                                label="You"
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.68rem' }}
                              />
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {user.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Chip
                          icon={user.role === 'admin' ? <ShieldOutlined /> : <PersonOutline />}
                          label={user.role === 'admin' ? 'Admin' : 'Member'}
                          color={user.role === 'admin' ? 'secondary' : 'default'}
                          size="small"
                          variant={user.role === 'admin' ? 'filled' : 'outlined'}
                        />
                        {user.mfaEnabled === true && (
                          <Chip
                            label="2FA"
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt, 'short')}</TableCell>
                    <TableCell>{formatDate(user.updatedAt, 'short')}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="View account activity">
                          <IconButton
                            size="small"
                            aria-label={`View activity for ${user.displayName || user.email}`}
                            onClick={() => setHistoryUser(user)}
                          >
                            <HistoryOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Button
                          variant={user.role === 'admin' ? 'outlined' : 'contained'}
                          size="small"
                          color={user.role === 'admin' ? 'error' : 'primary'}
                          disabled={pending}
                          startIcon={<AdminPanelSettingsOutlined fontSize="small" />}
                          onClick={() => toggleAdmin(user)}
                        >
                          {pending
                            ? 'Updating…'
                            : user.role === 'admin'
                              ? 'Revoke admin'
                              : 'Make admin'}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Account activity dialog */}
      <Dialog
        open={Boolean(historyUser)}
        onClose={() => setHistoryUser(null)}
        maxWidth="sm"
        fullWidth
        aria-label="Account activity"
      >
        {historyUser && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  src={historyUser.photoURL}
                  sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.9rem' }}
                >
                  {(historyUser.displayName || historyUser.email || 'U').charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography fontWeight={700}>{historyUser.displayName || 'User'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {historyUser.email} ·{' '}
                    <Chip
                      label={historyUser.role}
                      size="small"
                      variant="outlined"
                      sx={{ height: 16, fontSize: '0.62rem' }}
                    />
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              {historyUser.history && historyUser.history.length > 0 ? (
                <AuditTimeline events={historyUser.history} title="Account activity" />
              ) : (
                <Stack alignItems="center" spacing={1} sx={{ py: 4, textAlign: 'center' }}>
                  <HistoryOutlined color="disabled" sx={{ fontSize: 40 }} />
                  <Typography variant="body2" color="text.secondary">
                    No recorded activity yet for this account.
                  </Typography>
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setHistoryUser(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ManageUsersPage;
