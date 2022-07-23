import fs from "fs"
import glob from "glob"

const models = glob.sync("../dart/lib/src/model/*.dart")
models.forEach((file) => {
  const content = fs.readFileSync(file, "utf8")
  const newContent = content.replace(
    /(JsonObject\?;\n.*\n.*)(.replace\(.*\))/g,
    "$1 = valueDes",
  )
  fs.writeFileSync(file, newContent)
})

const apis = glob.sync("../dart/lib/src/api/*.dart")
apis.forEach((file) => {
  const content = fs.readFileSync(file, "utf8")
  const newContent = content.replace(
    /[a-zA-Z]+Controller([A-Z])/g,
    (_, match) => match.toLowerCase(),
  )
  fs.writeFileSync(file, newContent)
})
