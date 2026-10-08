/**
 * Turns anything thrown into a message safe to show a user.
 *
 * `unknown` is the correct catch binding, but every call site then wants the
 * same three lines of narrowing, so it lives here instead.
 */
export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  if (err && typeof err === 'object' && 'error' in err) {
    const { error } = err as { error?: unknown };
    if (typeof error === 'string' && error) return error;
  }
  return fallback;
}