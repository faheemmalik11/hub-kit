export class LexofficeApiError extends Error {
  status: number | null;
  path: string | null;

  constructor(message: string, status: number | null = null, path: string | null = null) {
    super(message);
    this.name = "LexofficeApiError";
    this.status = status;
    this.path = path;
  }
}

export function isLexofficeAuthFailure(message: string | null | undefined): boolean {
  return !!message && (message.includes("401") || message.includes("Unauthorized"));
}

export function readableLexofficeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as { message?: string; details?: string; hint?: string; code?: string };
    if (record.message || record.code) {
      return [record.message, record.details, record.hint, record.code && `[${record.code}]`]
        .filter(Boolean)
        .join(" | ");
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error ?? "unknown error");
}
