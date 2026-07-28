export type AppErrorCode =
  | "validation"
  | "not_found"
  | "conflict"
  | "unauthorized_workspace"
  | "ingestion_failure"
  | "mapping_conflict"
  | "database_failure";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: AppErrorCode; message: string } };

export function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof AppError) {
    return {
      ok: false,
      error: { code: error.code, message: error.message },
    };
  }

  console.error("Unexpected application error", error);
  return {
    ok: false,
    error: {
      code: "database_failure",
      message: "The operation could not be completed. Please try again.",
    },
  };
}
