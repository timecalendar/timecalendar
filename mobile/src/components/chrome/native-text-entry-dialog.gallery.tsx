import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  NativeSettingsHost,
  NativeSettingsRow,
  NativeSettingsSection,
  NativeTextEntryDialog,
  type NativeTextEntryDialogProps,
} from "@/components/chrome"
import type { GalleryMeta, GalleryStory } from "@/design"

type Story = GalleryStory<NativeTextEntryDialogProps>

const ids = {
  dialog: "gallery-text-entry-dialog",
  input: "gallery-text-entry-input",
  message: "gallery-text-entry-message",
  cancel: "gallery-text-entry-cancel",
  submit: "gallery-text-entry-submit",
} as const

// Pending locks Cancel and the iOS swipe-dismiss, so the story releases it on
// its own to leave a way out.
const PENDING_MS = 3000

const ignore = () => undefined

function TextEntryFixture({
  initialValue,
  message,
  pendingOnOpen = false,
  submitDisabled,
}: Pick<
  NativeTextEntryDialogProps,
  "initialValue" | "message" | "submitDisabled"
> & { pendingOnOpen?: boolean }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)
  const [pending, setPending] = useState(pendingOnOpen)

  useEffect(() => {
    if (!open || !pending) return
    const timer = setTimeout(() => setPending(false), PENDING_MS)
    return () => clearTimeout(timer)
  }, [open, pending])

  const close = () => setOpen(false)
  const reopen = () => {
    setPending(pendingOnOpen)
    setOpen(true)
  }

  return (
    <>
      <NativeSettingsHost>
        <NativeSettingsSection>
          <NativeSettingsRow
            kind="action"
            label={t("gallery.textEntryDialog.open")}
            onPress={reopen}
            testID="gallery-text-entry-open"
          />
        </NativeSettingsSection>
      </NativeSettingsHost>
      {open ? (
        <NativeTextEntryDialog
          title={t("gallery.textEntryDialog.dialogTitle")}
          initialValue={initialValue}
          label={t("gallery.textEntryDialog.fieldLabel")}
          placeholder={t("gallery.textEntryDialog.placeholder")}
          message={message}
          inputKind="text"
          cancelLabel={t("gallery.textEntryDialog.cancel")}
          submitLabel={t("gallery.textEntryDialog.submit")}
          pending={pending}
          submitDisabled={submitDisabled}
          ids={ids}
          onChange={ignore}
          onSubmit={close}
          onCancel={close}
        />
      ) : null}
    </>
  )
}

function DefaultFixture() {
  const { t } = useTranslation()
  return (
    <TextEntryFixture
      initialValue={t("gallery.textEntryDialog.value")}
      message={null}
      submitDisabled={false}
    />
  )
}

function SubmitDisabledFixture() {
  return <TextEntryFixture initialValue="" message={null} submitDisabled />
}

function PendingFixture() {
  const { t } = useTranslation()
  return (
    <TextEntryFixture
      initialValue={t("gallery.textEntryDialog.value")}
      message={t("gallery.textEntryDialog.validation")}
      pendingOnOpen
      submitDisabled={false}
    />
  )
}

const meta: GalleryMeta<NativeTextEntryDialogProps> = {
  id: "native-text-entry-dialog",
  title: "gallery.textEntryDialog.title",
  component: NativeTextEntryDialog,
  stories: ["Default", "SubmitDisabled", "Pending"],
}

export default meta

export const Default: Story = {
  name: "gallery.textEntryDialog.story.default",
  render: () => <DefaultFixture />,
}

export const SubmitDisabled: Story = {
  name: "gallery.textEntryDialog.story.submitDisabled",
  render: () => <SubmitDisabledFixture />,
}

export const Pending: Story = {
  name: "gallery.textEntryDialog.story.pending",
  render: () => <PendingFixture />,
}
