import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const sourceRoot = path.join(root, "docs", "brands")
const targetRoot = path.join(root, "public", "brands")
const registryPath = path.join(targetRoot, "registry.json")

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"))
const issues = []

for (const entry of registry) {
  const sourceDirectory = path.join(sourceRoot, entry.folder)
  const targetDirectory = path.join(targetRoot, entry.folder)

  if (!fs.existsSync(sourceDirectory) || !fs.existsSync(targetDirectory)) {
    issues.push(`${entry.id}: missing source or target directory`)
    continue
  }

  const sourceFiles = fs.readdirSync(sourceDirectory)
  const screenshots = sourceFiles.filter(
    (filename) =>
      filename.startsWith("screentshot_") && filename.endsWith(".webp")
  )
  const favicons = sourceFiles.filter((filename) =>
    /^favicon\.(ico|jpe?g|png|svg|webp)$/i.test(filename)
  )

  if (screenshots.length !== 1 || favicons.length !== 1) {
    issues.push(
      `${entry.id}: expected one screenshot and favicon, found ${screenshots.length} and ${favicons.length}`
    )
    continue
  }

  const coverFilename = screenshots[0].replace(/^screentshot_/, "cover_")
  const faviconFilename = favicons[0]

  const generatedLegacyCovers = new Set([
    "cover.webp",
    `${entry.folder}-cover.webp`,
  ])
  if (
    entry.cover &&
    entry.cover !== coverFilename &&
    generatedLegacyCovers.has(entry.cover)
  ) {
    const genericCoverPath = path.join(targetDirectory, entry.cover)
    if (fs.existsSync(genericCoverPath)) fs.rmSync(genericCoverPath)
  }

  fs.copyFileSync(
    path.join(sourceDirectory, screenshots[0]),
    path.join(targetDirectory, coverFilename)
  )
  fs.copyFileSync(
    path.join(sourceDirectory, faviconFilename),
    path.join(targetDirectory, faviconFilename)
  )

  entry.cover = coverFilename
  entry.favicon = faviconFilename
}

if (issues.length > 0) {
  throw new Error(`Brand media sync failed:\n${issues.join("\n")}`)
}

fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`)
console.log(`Synced cover and favicon assets for ${registry.length} brands.`)
