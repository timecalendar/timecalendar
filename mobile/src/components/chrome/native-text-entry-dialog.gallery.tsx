import { useTranslation } from "react-i18next"

import {
  NativeSettingsHost,
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

const ignore = () => undefined

function TextEntryFixture({
  initialValue,
  message,
  pending,
  submitDisabled,
}: Pick<
  NativeTextEntryDialogProps,
  "initialValue" | "message" | "pending" | "submitDisabled"
>) {
  const { t } = useTranslation()
  return (
    <>
      <NativeSettingsHost />
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
        onSubmit={ignore}
        onCancel={ignore}
      />
    </>
  )
}

function DefaultFixture() {
  const { t } = useTranslation()
  return (
    <TextEntryFixture
      initialValue={t("gallery.textEntryDialog.value")}
      message={null}
      pending={false}
      submitDisabled={false}
    />
  )
}

function SubmitDisabledFixture() {
  return (
    <TextEntryFixture
      initialValue=""
      message={null}
      pending={false}
      submitDisabled
    />
  )
}

function PendingFixture() {
  const { t } = useTranslation()
  return (
    <TextEntryFixture
      initialValue={t("gallery.textEntryDialog.value")}
      message={t("gallery.textEntryDialog.validation")}
      pending
      submitDisabled={false}
    />
  )
}

const meta: GalleryMeta<NativeTextEntryDialogProps> = {
  id: "native-text-entry-dialog",
  title: "gallery.textEntryDialog.title",
  component: NativeTextEntryDialog,
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
