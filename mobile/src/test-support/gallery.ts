import { render } from "@testing-library/react-native"
import type { ReactElement } from "react"

export function renderStory(story: {
  render?: (args: object) => ReactElement
}) {
  return render(story.render!({}))
}
