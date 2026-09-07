import { router, Stack, useLocalSearchParams } from "expo-router"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, StyleSheet, TextInput, View } from "react-native"

import { KeyboardSafeActionLayout } from "@/components/keyboard-safe-action-layout"
import { PrimaryAction } from "@/components/primary-action"
import { PageIntro, RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import {
  getRememberedEmail,
  setRememberedEmail,
  useSendFeedback,
} from "@/features/feedback/data"
import {
  type FeedbackFormErrors,
  validateFeedbackForm,
} from "@/features/feedback/form"
import { Radii, Spacing, useTheme } from "@/theme"

const MAX_CONTEXT_LENGTH = 2_048

export function normalizeFeedbackParam(
  value: string | string[] | undefined,
): string | undefined {
  const first = Array.isArray(value) ? value[0] : value
  const normalized = first?.trim().slice(0, MAX_CONTEXT_LENGTH)
  return normalized ? normalized : undefined
}

export default function FeedbackScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const params = useLocalSearchParams<{
    calendarUrl?: string | string[]
    schoolId?: string | string[]
    schoolName?: string | string[]
    calendarName?: string | string[]
  }>()
  const calendarUrl = normalizeFeedbackParam(params.calendarUrl)
  const schoolId = normalizeFeedbackParam(params.schoolId)
  const schoolName = normalizeFeedbackParam(params.schoolName)
  const calendarName = normalizeFeedbackParam(params.calendarName)
  const context = {
    ...(calendarUrl ? { calendarUrl } : {}),
    ...(schoolId ? { schoolId } : {}),
    ...(schoolName ? { schoolName } : {}),
    ...(calendarName ? { calendarName } : {}),
  }
  const {
    sendFeedback,
    isPending,
    failed: submitFailed,
    reset,
  } = useSendFeedback()
  const messageRef = useRef<TextInput>(null)
  const submitInFlightRef = useRef(false)
  const [email, setEmail] = useState(getRememberedEmail)
  const [message, setMessage] = useState("")
  const [errors, setErrors] = useState<FeedbackFormErrors>({})

  const submit = async () => {
    if (isPending || submitInFlightRef.current) return
    const validation = validateFeedbackForm({ email, message })
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setErrors({})
    reset()
    setRememberedEmail(validation.values.email)
    submitInFlightRef.current = true

    try {
      const sent = await sendFeedback({ ...validation.values, ...context })
      if (sent) {
        Alert.alert(
          t("feedback.success.title"),
          t("feedback.success.message"),
          [{ text: t("feedback.close"), onPress: () => router.back() }],
        )
      }
    } finally {
      submitInFlightRef.current = false
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: t("feedback.title") }} />
      <RootPage lane="readable" testID="feedback-layout-owner">
        {() => (
          <KeyboardSafeActionLayout
            testID="feedback-keyboard-layout"
            contentTestID="feedback-scroll-owner"
            actionsTestID="feedback-action-region"
            contentContainerStyle={styles.scrollContent}
            actionContainerStyle={styles.actions}
            actions={
              <>
                {submitFailed ? (
                  <ThemedText
                    testID="feedback-submit-error"
                    accessibilityLiveRegion="polite"
                    accessibilityRole="alert"
                    themeColor="textSecondary"
                  >
                    {t("feedback.failure")}
                  </ThemedText>
                ) : null}
                <PrimaryAction
                  testID="feedback-submit"
                  label={t("feedback.submit")}
                  busy={isPending}
                  onPress={() => void submit()}
                />
                {isPending ? (
                  <ThemedText
                    accessibilityLiveRegion="polite"
                    accessibilityRole="text"
                    themeColor="textSecondary"
                  >
                    {t("feedback.sending")}
                  </ThemedText>
                ) : null}
              </>
            }
          >
            <View testID="feedback-responsive-content" style={styles.content}>
              <PageIntro caption={t("feedback.intro")} />

              <View style={styles.field}>
                <ThemedText nativeID="feedback-email-label" type="smallBold">
                  {t("feedback.email.label")}
                </ThemedText>
                <TextInput
                  testID="feedback-email-input"
                  accessibilityLabel={t("feedback.email.label")}
                  accessibilityLabelledBy="feedback-email-label"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value)
                    if (errors.email)
                      setErrors(({ email: _email, ...current }) => current)
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  inputMode="email"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => messageRef.current?.focus()}
                  editable={!isPending}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                />
                {errors.email ? (
                  <ThemedText
                    accessibilityLiveRegion="polite"
                    accessibilityRole="alert"
                    themeColor="textSecondary"
                  >
                    {t(errors.email)}
                  </ThemedText>
                ) : null}
              </View>

              <View style={styles.field}>
                <ThemedText nativeID="feedback-message-label" type="smallBold">
                  {t("feedback.message.label")}
                </ThemedText>
                <TextInput
                  ref={messageRef}
                  testID="feedback-message-input"
                  accessibilityLabel={t("feedback.message.label")}
                  accessibilityLabelledBy="feedback-message-label"
                  value={message}
                  onChangeText={(value) => {
                    setMessage(value)
                    if (errors.message)
                      setErrors(({ message: _message, ...current }) => current)
                  }}
                  multiline
                  textAlignVertical="top"
                  returnKeyType="default"
                  blurOnSubmit={false}
                  editable={!isPending}
                  style={[
                    styles.input,
                    styles.messageInput,
                    {
                      color: theme.text,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                />
                {errors.message ? (
                  <ThemedText
                    accessibilityLiveRegion="polite"
                    accessibilityRole="alert"
                    themeColor="textSecondary"
                  >
                    {t(errors.message)}
                  </ThemedText>
                ) : null}
              </View>
            </View>
          </KeyboardSafeActionLayout>
        )}
      </RootPage>
    </>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.four,
  },
  content: { gap: Spacing.four },
  field: { gap: Spacing.two },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radii.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  messageInput: { minHeight: 144 },
  actions: { gap: Spacing.two, paddingBottom: Spacing.four },
})
