import type { TextInput } from "react-native"

import { focusCalendarUrl } from "./focus-calendar-url"

it("focuses the editable calendar URL input", () => {
  const focus = jest.fn()
  focusCalendarUrl({ focus } as unknown as TextInput)
  expect(focus).toHaveBeenCalledTimes(1)
  expect(() => focusCalendarUrl(null)).not.toThrow()
})
