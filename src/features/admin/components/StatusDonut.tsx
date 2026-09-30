import { Box, Stack, Typography } from '@mui/material';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface StatusDonutProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
}

/** Dependency-free SVG donut for categorical breakdowns (e.g. orders by status). */
const StatusDonut = ({
  segments,
  size = 176,
  thickness = 20,
  centerLabel = 'Orders',
}: StatusDonutProps) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${centerLabel} breakdown`}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.08}
          strokeWidth={thickness}
        />
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => {
            const fraction = segment.value / Math.max(1, total);
            const dash = fraction * circumference;
            const element = (
              <circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={thickness}
                strokeDasharray={`${Math.max(dash - 1.5, 0)} ${circumference}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              >
                <title>{`${segment.label}: ${segment.value}`}</title>
              </circle>
            );
            offset += dash;
            return element;
          })}
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontWeight={800}
          fontSize={Math.round(size * 0.12)}
          fill="currentColor"
        >
          {total}
        </text>
        <text
          x="50%"
          y="61%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.round(size * 0.055)}
          fill="currentColor"
          opacity={0.6}
        >
          {centerLabel}
        </text>
      </svg>

      <Stack spacing={1}>
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <Stack
              key={segment.label}
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
              }}
            >
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: segment.color }} />
              <Typography variant="body2">
                {segment.label}{' '}
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  {segment.value}
                </Typography>
              </Typography>
            </Stack>
          ))}
        {total === 0 && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
            No orders yet.
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

export default StatusDonut;
