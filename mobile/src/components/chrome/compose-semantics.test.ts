import {
  COMPOSE_SEMANTICS_MODIFIER,
  composeSemantics,
} from "./compose-semantics"

describe("composeSemantics", () => {
  it("builds the registered modifier with a description and the button role", () => {
    expect(
      composeSemantics({ contentDescription: "Name, Value", role: "button" }),
    ).toEqual({
      $type: COMPOSE_SEMANTICS_MODIFIER,
      contentDescription: "Name, Value",
      role: "button",
    })
  })

  it("omits the role when none is given", () => {
    const config = composeSemantics({ contentDescription: "Name" })

    expect(config).toEqual({
      $type: "timecalendarSemantics",
      contentDescription: "Name",
    })
    expect(config).not.toHaveProperty("role")
  })
})
