import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform } from "react-native"

import {
  NativeList,
  NativeListNumericEditor,
  type NativeListNumericEditorProps,
  NativeListRow,
  NativeListSection,
} from "@/components/chrome"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"

type Story = GalleryStory<NativeListNumericEditorProps>

const ids = {
  container: "gallery-numeric-editor",
  field: "gallery-numeric-editor-field",
  cancel: "gallery-numeric-editor-cancel",
  submit: "gallery-numeric-editor-submit",
  message: "gallery-numeric-editor-message",
} as const

type Copy = Pick<
  NativeListNumericEditorProps,
  "title" | "label" | "cancelLabel" | "submitLabel" | "validationMessage"
>

function NumericEditorFixture({ copy }: { copy: Copy }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)
  const [value, setValue] = useState(() => t("gallery.numericEditor.value"))

  const editor = open ? (
    <NativeListNumericEditor
      {...copy}
      initialValue={value}
      ids={ids}
      onCancel={() => setOpen(false)}
      onSubmit={(next) => {
        setValue(next)
        setOpen(false)
      }}
    />
  ) : null

  if (Platform.OS === "ios" && open) return editor

  return (
    <>
      <NativeList>
        <NativeListSection>
          <NativeListRow
            kind="action"
            label={t("gallery.numericEditor.open")}
            value={value}
            onPress={() => setOpen(true)}
            testID="gallery-numeric-editor-open"
          />
        </NativeListSection>
      </NativeList>
      {editor}
    </>
  )
}

function StandardFixture({ validation = false }: { validation?: boolean }) {
  const { t } = useTranslation()
  return (
    <NumericEditorFixture
      copy={{
        title: t("gallery.numericEditor.editorTitle"),
        label: t("gallery.numericEditor.fieldLabel"),
        cancelLabel: t("gallery.numericEditor.cancel"),
        submitLabel: t("gallery.numericEditor.submit"),
        ...(validation
          ? { validationMessage: t("gallery.numericEditor.validation") }
          : {}),
      }}
    />
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  return (
    <NumericEditorFixture
      copy={{
        title: t("gallery.stress.title"),
        label: t("gallery.stress.action"),
        cancelLabel: t("gallery.stress.word"),
        submitLabel: t("gallery.stress.action"),
        validationMessage: t("gallery.stress.body"),
      }}
    />
  )
}

const meta: GalleryMeta<NativeListNumericEditorProps> = {
  id: "native-list-numeric-editor",
  title: "gallery.numericEditor.title",
  component: NativeListNumericEditor,
  stories: ["Default", "ValidationError", "LongStrings"],
}

export default meta

export const Default: Story = {
  name: "gallery.numericEditor.story.default",
  render: () => <StandardFixture />,
}

export const ValidationError: Story = {
  name: "gallery.numericEditor.story.validationError",
  render: () => <StandardFixture validation />,
}

export const LongStrings: Story = {
  name: "gallery.numericEditor.story.longStrings",
  render: () => <LongStringsFixture />,
}
