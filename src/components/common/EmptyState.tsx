import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { SearchOff } from '@mui/icons-material';

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
  illustration?: ReactNode;
}

/** Rich, brand-illustrated empty state. Pass `illustration` to use the
 *  hand-drawn line art from components/illustrations; the generic `icon`
 *  prop remains for compact, icon-only contexts. */
const EmptyState = ({
  title = 'Nothing here yet',
  message = 'We could not find what you are looking for. Try adjusting your search or filters.',
  action,
  icon,
  illustration,
}: EmptyStateProps) => {
  return (
    <Box
      sx={{
        py: 8,
        px: 2,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      {illustration ?? (
        <Box
          sx={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'radial-gradient(circle, rgba(36,68,124,0.08) 0%, rgba(36,68,124,0.02) 70%, transparent 100%)',
            color: 'text.disabled',
          }}
        >
          {icon ?? <SearchOff fontSize="large" />}
        </Box>
      )}
      {/* Panel/region title — h2 keeps every embedding context (directly under
          a page h1, or nested under a section h2) in a valid outline. */}
      <Typography variant="h6" component="h2" fontWeight={600}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
        {message}
      </Typography>
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
};

export default EmptyState;
