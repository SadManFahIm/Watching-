import { useId } from 'react';
import type { ReactNode } from 'react';
import { Box, useTheme } from '@mui/material';

/**
 * Hand-drawn line-art illustrations for error/empty states.
 *
 * Editorial duotone (primary line work + gold accents) that mirrors the
 * Playfair/midnight-navy brand language instead of stock clip-art. Every
 * illustration is decorative (`aria-hidden`) and inherits the active theme.
 */

interface IllustrationSizeProps {
  size?: number;
}

const useMotifColors = () => {
  const theme = useTheme();
  return {
    line: theme.palette.primary.main,
    accent: theme.palette.secondary.main,
    isDark: theme.palette.mode === 'dark',
  };
};

interface IllustrationFrameProps {
  size: number;
  children: ReactNode;
}

const IllustrationFrame = ({ size, children }: IllustrationFrameProps) => {
  const { accent, isDark } = useMotifColors();
  // useId() includes ":" which breaks url(#…) fragment references in some
  // browsers — strip it so the gradient id stays a valid URL fragment.
  const gradientId = useId().replace(/:/g, '');
  return (
    <Box
      component="svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden="true"
      sx={{ display: 'block' }}
    >
      <defs>
        <radialGradient id={gradientId} cx="42%" cy="38%" r="70%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill={`url(#${gradientId})`} />
      <circle
        cx="60"
        cy="60"
        r="56"
        fill="none"
        stroke={accent}
        strokeOpacity={isDark ? 0.35 : 0.5}
        strokeWidth="1"
      />
      {children}
    </Box>
  );
};

/** Empty shopping bag with a watch face on the front. */
export const CartEmptyIllustration = ({ size = 160 }: IllustrationSizeProps) => {
  const { line, accent } = useMotifColors();
  return (
    <IllustrationFrame size={size}>
      <g fill="none" stroke={line} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M52 40c0-7 16-7 16 0" />
        <path d="M46 44h28l4 48H42z" />
        <circle cx="60" cy="64" r="12" />
        <path d="M60 55v3M60 73v3M51 64h3M69 64h-3" />
      </g>
      <g fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 64v-6M60 64l5 2.5" />
        <path d="M48.5 55c-1.5 2-2 3.5-2 5" />
      </g>
    </IllustrationFrame>
  );
};

/** Locket heart with a watch dial and crown for the empty wishlist. */
export const WishlistEmptyIllustration = ({ size = 160 }: IllustrationSizeProps) => {
  const { line, accent } = useMotifColors();
  return (
    <IllustrationFrame size={size}>
      <g fill="none" stroke={line} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 88c-18-12.5-25-24-22-35 3-12 14-14.5 22-7 8-7.5 19-5 22 7 3 11-4 22.5-22 35z" />
        <circle cx="60" cy="58" r="12" />
        <path d="M60 49v3M60 67v-3M51 58h3M69 58h-3" />
        <path d="M60 42v-4" />
        <path d="M56.5 38h7a2.5 2.5 0 0 1 0 5h-7z" />
      </g>
      <g fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 58v-6M60 58l5 3" />
      </g>
    </IllustrationFrame>
  );
};

/** Magnifying glass over a watch dial with a gold sparkle. */
export const SearchEmptyIllustration = ({ size = 160 }: IllustrationSizeProps) => {
  const { line, accent } = useMotifColors();
  return (
    <IllustrationFrame size={size}>
      <g fill="none" stroke={line} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="55" cy="50" r="20" />
        <path d="M70 65l22 22" />
        <circle cx="55" cy="50" r="9.5" />
        <path d="M55 50v-6M55 50l4 3" />
      </g>
      <g fill={accent} stroke="none">
        <circle cx="92" cy="87" r="2.5" />
        <path d="M85 25l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z" />
        <circle cx="34" cy="80" r="2" />
      </g>
    </IllustrationFrame>
  );
};

/** Gift parcel with a watch seal and bow for the empty order list. */
export const OrdersEmptyIllustration = ({ size = 160 }: IllustrationSizeProps) => {
  const { line, accent } = useMotifColors();
  return (
    <IllustrationFrame size={size}>
      <g fill="none" stroke={line} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M52 56l8-10 8 10" />
        <path d="M40 60h40v32H40z" />
        <path d="M60 60v-1M60 60v32" />
        <circle cx="60" cy="70" r="9" />
        <path d="M60 63v2.5M60 77v-2.5M53.5 70h2.5M66.5 70h-2.5" />
      </g>
      <g fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 70v-5M60 70l4 2" />
      </g>
      <g fill={accent} stroke="none">
        <ellipse cx="53" cy="48" rx="5.5" ry="3" transform="rotate(-20 53 48)" />
        <ellipse cx="67" cy="48" rx="5.5" ry="3" transform="rotate(20 67 48)" />
        <circle cx="60" cy="50" r="2.5" />
      </g>
    </IllustrationFrame>
  );
};

/** Stopped pocket watch — face with a hairline crack and a loose screw. */
export const NotFoundIllustration = ({ size = 160 }: IllustrationSizeProps) => {
  const { line, accent } = useMotifColors();
  return (
    <IllustrationFrame size={size}>
      <g fill="none" stroke={line} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="60" cy="56" r="24" />
        <circle cx="60" cy="56" r="17" strokeDasharray="0.5 3.5" strokeOpacity="0.5" />
        <path d="M60 38v4M60 74v-4M42 56h4M78 56h-4" />
        <path d="M60 56l-7-4M60 56l7.5-2" />
        <path d="M42 36l10 10-4 4 3 4" />
        <circle cx="86" cy="84" r="4" strokeDasharray="2 2" />
      </g>
      <circle cx="86" cy="84" r="1.1" fill={accent} stroke="none" />
    </IllustrationFrame>
  );
};

/** Watch dial set in a crown gear — the 500/error-boundary motif. */
export const ServerErrorIllustration = ({ size = 160 }: IllustrationSizeProps) => {
  const { line, accent } = useMotifColors();
  return (
    <IllustrationFrame size={size}>
      <g fill="none" stroke={line} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="60" cy="58" r="26" strokeDasharray="4 5" />
        <circle cx="60" cy="58" r="13" />
        <path d="M60 58v-8M60 58l6 3.5" />
      </g>
      <g fill={accent} stroke="none">
        <circle cx="60" cy="58" r="2.6" />
        <path d="M91 27l2.5 2.5M86 24l1 2" />
        <circle cx="88.5" cy="28.5" r="2" />
      </g>
    </IllustrationFrame>
  );
};
