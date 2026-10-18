/** A lazily loaded app file is gone or unreachable, usually because a deploy replaced it. */
export function isChunkLoadError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /dynamically imported module|Importing a module script failed|Unable to preload/i.test(
      error.message,
    )
  );
}
