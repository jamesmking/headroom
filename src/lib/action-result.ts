import {z} from 'zod';

/**
 * The shape every Server Action returns, designed for `useActionState`.
 * Keeping one shape means every form can share the same error rendering.
 */
export type ActionResult = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  /** Keyed by form field name. */
  fieldErrors?: Record<string, string>;
  /** Bumped on every result so effects can react to repeated submissions. */
  timestamp?: number;
};

export const idleResult: ActionResult = {status: 'idle'};

export const successResult = (message?: string): ActionResult => ({
  status: 'success',
  message,
  timestamp: Date.now(),
});

export const errorResult = (
  message: string,
  fieldErrors?: Record<string, string>
): ActionResult => ({
  status: 'error',
  message,
  fieldErrors,
  timestamp: Date.now(),
});

/** Turn a Zod failure into the flat field-error map the forms expect. */
export const fromZodError = (error: z.ZodError): ActionResult => {
  const flattened = error.flatten();
  const fieldErrors = Object.fromEntries(
    Object.entries(flattened.fieldErrors)
      .map(([field, messages]) => [field, messages?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );

  return errorResult(
    flattened.formErrors[0] ?? 'Check the highlighted fields and try again.',
    fieldErrors
  );
};
