import libSlugify from "slugify"

export const slugify = (text: string) =>
  libSlugify(text, {
    remove: /[*+~.()'"!:@]/g,
    lower: true,
  }).replace(/[^a-z0-9-]/g, "")
