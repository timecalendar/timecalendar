export const emailToName = (email: string) =>
  titleCase(
    email
      .split("@")[0]
      .split("+")[0]
      .replace(/\d/g, "")
      .replace(/\./g, " ")
      .replace(/_/g, " ")
      .replace(/\s\s+/g, " ")
      .trim(),
  )

const titleCase = (str: string) =>
  str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase(),
  )
