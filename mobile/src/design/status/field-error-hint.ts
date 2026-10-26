/** React Native forwards no described-by relation, so a field speaks its error through its hint. */
export function fieldErrorHint(
  error: string | undefined,
  hint?: string,
): string | undefined {
  if (!error) return hint
  return hint ? `${error}. ${hint}` : error
}
