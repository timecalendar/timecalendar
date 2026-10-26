import { router, Stack, useLocalSearchParams } from "expo-router"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, StyleSheet, View } from "react-native"

import {
  Button,
  ErrorNotice,
  KeyboardSafeActionLayout,
  PageIntro,
  RootPage,
  TextField,
  type TextFieldRef,
  ThemedText,
} from "@/design"
import {
  getRememberedEmail,
  setRememberedEmail,
  useSendFeedback,
} from "@/features/feedback/data"
import {
  type FeedbackFormErrors,
  validateFeedbackForm,
} from "@/features/feedback/form"
import { Spacing } from "@/theme"

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
  const messageRef = useRef<TextFieldRef>(null)
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
      <RootPage
        scrollsUnderHeader
        lane="readable"
        testID="feedback-layout-owner"
      >
        {() => (
          <KeyboardSafeActionLayout
            testID="feedback-keyboard-layout"
            contentTestID="feedback-scroll-owner"
            actionsTestID="feedback-action-region"
            contentContainerStyle={styles.scrollContent}
            actions={
              <>
                {submitFailed ? (
                  <ErrorNotice
                    testID="feedback-submit-error"
                    message={t("feedback.failure")}
                  />
                ) : null}
                <Button
                  variant="filled"
                  testID="feedback-submit"
                  label={t("feedback.submit")}
                  busy={isPending}
                  onPress={() => void submit()}
                />
                {isPending ? (
                  <ThemedText
                    accessibilityLiveRegion="polite"
                    accessibilityRole="text"
                    tone="secondary"
                  >
                    {t("feedback.sending")}
                  </ThemedText>
                ) : null}
              </>
            }
          >
            <View testID="feedback-responsive-content" style={styles.content}>
              <PageIntro caption={t("feedback.intro")} />

              <TextField
                testID="feedback-email-input"
                label={t("feedback.email.label")}
                error={errors.email && t(errors.email)}
                value={email}
                onChangeText={(value) => {
                  setEmail(value)
                  if (errors.email)
                    setErrors(({ email: _email, ...current }) => current)
                }}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
                inputMode="email"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => messageRef.current?.focus()}
                disabled={isPending}
              />

              <TextField
                ref={messageRef}
                testID="feedback-message-input"
                label={t("feedback.message.label")}
                error={errors.message && t(errors.message)}
                value={message}
                onChangeText={(value) => {
                  setMessage(value)
                  if (errors.message)
                    setErrors(({ message: _message, ...current }) => current)
                }}
                multiline
                disabled={isPending}
              />
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
})
