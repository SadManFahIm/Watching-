/**
 * Optional runtime error tracking (Sentry).
 *
 * Wiring is a strict no-op unless `VITE_SENTRY_DSN` is configured — demo and
 * credential-less builds ship zero Sentry bytes on the critical path (the SDK
 * is dynamic-imported only when a DSN exists), mirroring the lazy-Firebase
 * pattern used across the app. Telemetry failures are swallowed: a reporting
 * outage must never take the storefront down with it.
 */
export const initTelemetry = async (): Promise<void> => {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  try {
    const Sentry = await import('@sentry/react');
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
    });
  } catch (error) {
    // Non-fatal: logging must never break the app boot.
    console.error('Sentry initialization failed:', error);
  }
};
