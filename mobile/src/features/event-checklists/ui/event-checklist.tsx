import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  type TextInput as RNTextInput,
  TextInput,
  type TextStyle,
  View,
} from "react-native"

import { ThemedText } from "@/components/themed-text"
import { WriteErrorNotice } from "@/components/write-error-notice"
import {
  type ChecklistItem,
  useChecklist,
  useChecklistActions,
} from "@/features/event-checklists/data"
import { Radii, Spacing, useTheme } from "@/theme"

// The interactive checklist section (presentational, 70% floor) — the EDIT half
// of event details that Phase 04 deferred (ADR 024). Reads the reactive ordered
// list through the event-checklists data sub-barrel (B-1 — never @/db) and renders
// each item as a checkbox + an inline TextInput + accessible move-up/down + a
// remove control, plus an "Add note" button that auto-focuses the new item (D6),
// an accessible empty state, and the failed-write surface (D8). Reorder is
// move-up/down controls (zero new dependency — D5), disabled at the ends. Surface
// is native-default, themed from @/theme (R-3). Mounted on the unified
// event-details screen for BOTH event kinds, keyed on the event uid.

export function EventChecklist({ eventUid }: { eventUid: string }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const items = useChecklist(eventUid)
  const { add, setContent, setChecked, moveUp, moveDown, remove, failed } =
    useChecklistActions(eventUid, items)

  // The uuid of the just-added item to auto-focus when it appears in the live read.
  const [focusUuid, setFocusUuid] = useState<string | undefined>(undefined)

  const onAdd = useCallback(async () => {
    const uuid = await add()
    if (uuid !== undefined) setFocusUuid(uuid)
  }, [add])

  const inputStyle: StyleProp<TextStyle> = [
    styles.input,
    { color: theme.text, borderColor: theme.backgroundSelected },
  ]

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle">{t("eventChecklist.title")}</ThemedText>

      {failed && (
        <WriteErrorNotice
          type="small"
          message={t("eventChecklist.error.writeFailed")}
        />
      )}

      {items.length === 0 ? (
        <ThemedText
          themeColor="textSecondary"
          accessibilityLiveRegion="polite"
          accessibilityRole="text"
        >
          {t("eventChecklist.empty")}
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {items.map((item, index) => (
            <ChecklistRow
              key={item.uuid}
              item={item}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              autoFocus={item.uuid === focusUuid}
              inputStyle={inputStyle}
              onContentChange={(text) => setContent(item.uuid, text)}
              onToggle={() => setChecked(item.uuid, !item.isChecked)}
              onMoveUp={() => moveUp(item.uuid)}
              onMoveDown={() => moveDown(item.uuid)}
              onRemove={() => remove(item.uuid)}
            />
          ))}
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("eventChecklist.addLabel")}
        hitSlop={Spacing.two}
        onPress={onAdd}
        style={[styles.addButton, { borderColor: theme.primary }]}
        testID="checklist-add"
      >
        <ThemedText type="smallBold" themeColor="primary">
          {t("eventChecklist.add")}
        </ThemedText>
      </Pressable>
    </View>
  )
}

function ChecklistRow({
  item,
  isFirst,
  isLast,
  autoFocus,
  inputStyle,
  onContentChange,
  onToggle,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  item: ChecklistItem
  isFirst: boolean
  isLast: boolean
  autoFocus: boolean
  inputStyle: StyleProp<TextStyle>
  onContentChange: (text: string) => void
  onToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const inputRef = useRef<RNTextInput>(null)
  const [text, onType] = useDraftContent(item.content, onContentChange)

  // Auto-focus the newly-added item (D6) — focus once the live read renders the
  // new row. lint can't know which input to focus; it is authorial intent
  // (like the heading-role contract), so it lives in the component.
  const setRef = useCallback(
    (node: RNTextInput | null) => {
      inputRef.current = node
      if (autoFocus && node !== null) node.focus()
    },
    [autoFocus],
  )

  return (
    <View style={styles.row} testID={`checklist-row-${item.uuid}`}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.isChecked }}
        accessibilityLabel={t("eventChecklist.item.checkLabel")}
        hitSlop={Spacing.two}
        onPress={onToggle}
        style={[
          styles.checkbox,
          {
            borderColor: theme.primary,
            backgroundColor: item.isChecked ? theme.primary : "transparent",
          },
        ]}
        testID={`checklist-check-${item.uuid}`}
      >
        {/* The filled primary box IS the checked indicator (no glyph — the app
            wires no icon font, R-3); accessibilityState.checked carries it to AT.
            An inner contrast dot reads against the fill. */}
        {item.isChecked && (
          <View
            style={[styles.checkDot, { backgroundColor: theme.background }]}
          />
        )}
      </Pressable>

      <TextInput
        ref={setRef}
        accessibilityLabel={t("eventChecklist.item.contentLabel")}
        value={text}
        onChangeText={onType}
        style={[inputStyle, styles.rowInput]}
        testID={`checklist-input-${item.uuid}`}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("eventChecklist.item.moveUpLabel")}
        accessibilityState={{ disabled: isFirst }}
        disabled={isFirst}
        hitSlop={Spacing.one}
        onPress={onMoveUp}
        style={styles.iconButton}
        testID={`checklist-up-${item.uuid}`}
      >
        <ThemedText themeColor={isFirst ? "textSecondary" : "primary"}>
          ↑
        </ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("eventChecklist.item.moveDownLabel")}
        accessibilityState={{ disabled: isLast }}
        disabled={isLast}
        hitSlop={Spacing.one}
        onPress={onMoveDown}
        style={styles.iconButton}
        testID={`checklist-down-${item.uuid}`}
      >
        <ThemedText themeColor={isLast ? "textSecondary" : "primary"}>
          ↓
        </ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("eventChecklist.item.removeLabel")}
        hitSlop={Spacing.one}
        onPress={onRemove}
        style={styles.iconButton}
        testID={`checklist-remove-${item.uuid}`}
      >
        <ThemedText themeColor="textSecondary">×</ThemedText>
      </Pressable>
    </View>
  )
}

// The row's inline input owns the text being typed; the live value only feeds it
// back when it is NOT this row's own echo.
//
// `content` here comes from the useLiveQuery read over `checklist_items`, so it
// trails every keystroke by a full round-trip (JS → async SQLite write → live-query
// re-emit → re-render). Binding the input straight to it made a keystroke that
// landed inside that window get clobbered when the stale value snapped back —
// characters vanished silently and the truncated note was persisted (TIM-268).
//
// So: the draft is the input's value, each keystroke writes through, and an
// incoming live value is adopted only when this row never wrote it (a genuine
// external change). Matching values are our own echoes — possibly several writes
// behind — and are dropped along with everything that preceded them. No focus
// tracking: a missed focus/blur event would silently bring the data loss back.
function useDraftContent(
  content: string,
  onContentChange: (text: string) => void,
): [string, (text: string) => void] {
  const [draft, setDraft] = useState(content)
  const written = useRef<string[]>([])

  useEffect(() => {
    const echo = written.current.indexOf(content)
    if (echo !== -1) {
      written.current = written.current.slice(echo + 1)
      return
    }
    written.current = []
    setDraft(content)
  }, [content])

  const onType = useCallback(
    (text: string) => {
      written.current = [...written.current, text]
      setDraft(text)
      onContentChange(text)
    },
    [onContentChange],
  )

  return [draft, onType]
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  checkbox: {
    // 28pt visual box; the Spacing.two hitSlop extends the touch target past 44pt.
    width: 28,
    height: 28,
    borderWidth: 2,
    borderRadius: Radii.small,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDot: {
    width: 12,
    height: 12,
    borderRadius: Radii.small,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radii.medium,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  rowInput: {
    flex: 1,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radii.medium,
  },
})
