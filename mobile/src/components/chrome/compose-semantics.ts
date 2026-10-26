import type { ModifierConfig } from "@expo/ui/jetpack-compose/modifiers"

// Registered by the local Android module in modules/compose-semantics; Expo UI's
// own modifiers cannot set a content description or the button role.
export const COMPOSE_SEMANTICS_MODIFIER = "timecalendarSemantics"

export type ComposeSemanticsRole = "button"

export function composeSemantics({
  contentDescription,
  role,
}: {
  contentDescription: string
  role?: ComposeSemanticsRole | undefined
}): ModifierConfig {
  return {
    $type: COMPOSE_SEMANTICS_MODIFIER,
    contentDescription,
    ...(role ? { role } : {}),
  }
}
