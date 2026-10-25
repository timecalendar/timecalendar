import { render, screen } from "@testing-library/react-native"
import { Text } from "react-native"

import { GalleryStoryContent } from "./story-content"
import type { GalleryEntry } from "./types"

function Label({ text }: { text?: unknown }) {
  return <Text testID="label">{String(text ?? "none")}</Text>
}

const entry = (story: GalleryEntry["story"]): GalleryEntry => ({
  id: "label--story",
  metaId: "label",
  title: "gallery.title",
  name: "gallery.title",
  story,
  component: Label,
})

it("renders the meta component with the story args", async () => {
  await render(
    <GalleryStoryContent
      entry={entry({ name: "gallery.title", args: { text: "args" } })}
    />,
  )
  expect(screen.getByTestId("label")).toHaveTextContent("args")
})

it("passes empty args to render when the story declares none", async () => {
  await render(
    <GalleryStoryContent
      entry={entry({
        name: "gallery.title",
        render: (args) => <Label text={Object.keys(args).length} />,
      })}
    />,
  )
  expect(screen.getByTestId("label")).toHaveTextContent("0")
})
