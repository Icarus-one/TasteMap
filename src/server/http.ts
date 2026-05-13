export function jsonError(
  message: string | undefined,
  status: number | undefined,
  extra?: Record<string, unknown>,
) {
  return Response.json(
    { error: message ?? "Unexpected server error.", ...extra },
    { status: status ?? 500 },
  );
}

export function jsonOk(payload: Record<string, unknown>, status = 200) {
  return Response.json(payload, { status });
}
