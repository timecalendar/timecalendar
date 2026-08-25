import { router, Stack, useLocalSearchParams } from "expo-router"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  getRememberedEmail,
  setRememberedEmail,
  useSendFeedback,
} from "@/features/feedback/data"
import {
  type FeedbackFormErrors,
  validateFeedbackForm,
} from "@/features/feedback/form"
import { recordUnknownError } from "@/firebase"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

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
  }>()
  const calendarUrl = normalizeFeedbackParam(params.calendarUrl)
  const schoolId = normalizeFeedbackParam(params.schoolId)
  const schoolName = normalizeFeedbackParam(params.schoolName)
  const context = {
    ...(calendarUrl ? { calendarUrl } : {}),
    ...(schoolId ? { schoolId } : {}),
    ...(schoolName ? { schoolName } : {}),
  }
  const { sendFeedback, isPending, reset } = useSendFeedback()
  const messageRef = useRef<TextInput>(null)
  const [email, setEmail] = useState(getRememberedEmail)
  const [message, setMessage] = useState("")
  const [errors, setErrors] = useState<FeedbackFormErrors>({})
  const [submitFailed, setSubmitFailed] = useState(false)

  const submit = async () => {
    if (isPending) return
    const validation = validateFeedbackForm({ email, message })
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setErrors({})
    setSubmitFailed(false)
    reset()
    setRememberedEmail(validation.values.email)

    try {
      await sendFeedback({ ...validation.values, ...context })
      Alert.alert(t("feedback.success.title"), t("feedback.success.message"), [
        { text: t("feedback.close"), onPress: () => router.back() },
      ])
    } catch (error: unknown) {
      recordUnknownError(error, "feedback/contact-submit")
      setSubmitFailed(true)
    }
  }

  const minimumTarget = Platform.OS === "ios" ? 44 : 48

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: t("feedback.title") }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SafeAreaView edges={["left", "right", "bottom"]} style={styles.flex}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.content}>
              <View style={styles.intro}>
                <ThemedText type="title">{t("feedback.title")}</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {t("feedback.intro")}
                </ThemedText>
              </View>

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

              <Pressable
                testID="feedback-submit"
                accessibilityRole="button"
                accessibilityLabel={t("feedback.submit")}
                accessibilityState={{ disabled: isPending, busy: isPending }}
                disabled={isPending}
                onPress={() => void submit()}
                style={[
                  styles.submit,
                  {
                    minHeight: minimumTarget,
                    backgroundColor: theme.primary,
                    opacity: isPending ? 0.6 : 1,
                  },
                ]}
              >
                <ThemedText
                  type="smallBold"
                  style={{ color: theme.background }}
                >
                  {t("feedback.submit")}
                </ThemedText>
              </Pressable>
              {isPending ? (
                <ThemedText
                  accessibilityLiveRegion="polite"
                  accessibilityRole="text"
                  themeColor="textSecondary"
                >
                  {t("feedback.sending")}
                </ThemedText>
              ) : null}
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  content: { width: "100%", maxWidth: MaxContentWidth, gap: Spacing.four },
  intro: { gap: Spacing.two },
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
  submit: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.medium,
    paddingHorizontal: Spacing.four,
  },
})
