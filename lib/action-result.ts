import { z } from "zod";

// Shared return shape for every Server Action, ready for useActionState:
//   const [state, action, pending] = useActionState(someAction, null)
export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<T = null> =
  | { ok: true; data: T; message?: string }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

/** useActionState initial state: nothing submitted yet. */
export type ActionState<T = null> = ActionResult<T> | null;

export const ok = <T>(data: T, message?: string): ActionResult<T> => ({ ok: true, data, message });

export const fail = (message: string, fieldErrors?: FieldErrors): { ok: false; message: string; fieldErrors?: FieldErrors } => ({
  ok: false,
  message,
  fieldErrors,
});

export const invalid = (error: z.ZodError) =>
  fail("Please fix the highlighted fields.", z.flattenError(error).fieldErrors as FieldErrors);

export const NOT_AUTHORISED = "You are not allowed to do that.";
export const NOT_SIGNED_IN = "Please sign in first.";
