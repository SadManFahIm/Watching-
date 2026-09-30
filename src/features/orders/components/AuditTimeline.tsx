import { Box, Stack, Typography } from '@mui/material';
import { HistoryOutlined } from '@mui/icons-material';
import { formatDate } from '@/utils/helpers';
import type { AuditEvent } from '@/types';

interface AuditTimelineProps {
  /** Chronological events (oldest first); rendered newest-first. */
  events: AuditEvent[];
  title?: string;
}

const AuditTimeline = ({ events, title = 'Activity' }: AuditTimelineProps) => {
  if (!events || events.length === 0) return null;

  // API payloads clone audit events, so `at` can arrive as an ISO string or a
  // Date — normalize before comparing or keying on it.
  const newestFirst = [...events].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          mb: 1.5,
        }}
      >
        <HistoryOutlined fontSize="small" color="action" />
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
          }}
        >
          {title}
        </Typography>
      </Stack>
      <Stack spacing={1.5}>
        {newestFirst.map((event, index) => (
          <Stack key={`${new Date(event.at).toISOString()}-${index}`} direction="row" spacing={1.5}>
            <Box
              sx={{
                width: 9,
                height: 9,
                mt: 0.7,
                borderRadius: '50%',
                bgcolor: index === 0 ? 'primary.main' : 'action.disabled',
                flexShrink: 0,
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                }}
              >
                {event.action}
              </Typography>
              {event.detail && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: 'block',
                  }}
                >
                  {event.detail}
                </Typography>
              )}
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                }}
              >
                {formatDate(event.at, 'long')} · {event.actor}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default AuditTimeline;
