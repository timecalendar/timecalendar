export function formatUniversityName(name: string) {
  if (name.startsWith("Université")) {
    return "l'" + name
  }
  return name
}
