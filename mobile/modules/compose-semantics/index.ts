// Registered natively by ComposeSemanticsModule (Android only). A control
// nested in a toggleable/selectable row keeps its pointer input but drops out
// of the semantics tree, so the row stays the single TalkBack stop.
export function clearAndSetSemantics(): { $type: "clearAndSetSemantics" } {
  return { $type: "clearAndSetSemantics" }
}
