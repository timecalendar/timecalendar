const endsSentence = /[.!?…]$/

export function joinSentences(
  ...parts: (string | null | undefined)[]
): string | undefined {
  const present = parts.filter((part): part is string => Boolean(part))
  if (present.length === 0) return undefined
  return present.reduce((joined, part) =>
    endsSentence.test(joined) ? `${joined} ${part}` : `${joined}. ${part}`,
  )
}

/** React Native forwards no described-by relation, so a field speaks its error through its hint. */
export function fieldErrorHint(
  error: string | null | undefined,
  hint?: string,
): string | undefined {
  return joinSentences(error, hint)
}
