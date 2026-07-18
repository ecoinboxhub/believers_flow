const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const DIST = path.join(ROOT, 'dist')
const ANDROID_ASSETS = path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'public')
const ANDROID_MIPMAP = path.join(ROOT, 'android', 'app', 'src', 'main', 'res')

async function generate(svgPath, outPath, size, label) {
  try {
    const svg = fs.readFileSync(svgPath, 'utf-8')
    // Scale SVG to match output size (SVG viewBox is 100x100 for favicon, 512x512 for icon)
    const svgBuffer = Buffer.from(svg)
    await sharp(svgBuffer).resize(size, size).png().toFile(outPath)
    console.log(`  ✓ ${label} (${size}×${size}) → ${path.relative(ROOT, outPath)}`)
  } catch (err) {
    console.error(`  ✗ ${label}: ${err.message}`)
  }
}

async function generateAll() {
  const design = process.argv[2] || 'a'
  const designDir = path.join(PUBLIC, 'icons', `design-${design}`)

  console.log(`\n  Generating icons from Design ${design.toUpperCase()}\n`)

  // Ensure output dirs exist
  ;[DIST, ANDROID_ASSETS].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }) })

  // 1. favicon.svg (copy to dist and android)
  const faviconSvg = path.join(designDir, 'favicon.svg')
  if (fs.existsSync(faviconSvg)) {
    fs.copyFileSync(faviconSvg, path.join(DIST, 'favicon.svg'))
    fs.copyFileSync(faviconSvg, path.join(ANDROID_ASSETS, 'favicon.svg'))
    console.log(`  ✓ favicon.svg → dist/ & android/assets/public/`)
  }

  // 2. logo-icon.svg (copy to public for app use)
  const logoSvg = path.join(designDir, 'logo-icon.svg')
  if (fs.existsSync(logoSvg)) {
    fs.copyFileSync(logoSvg, path.join(PUBLIC, 'logo-icon.svg'))
    console.log(`  ✓ logo-icon.svg → public/`)
  }

  // 3. icon.svg (copy full version)
  const iconSvg = path.join(designDir, 'icon.svg')
  if (fs.existsSync(iconSvg)) {
    fs.copyFileSync(iconSvg, path.join(PUBLIC, 'icon.svg'))
    console.log(`  ✓ icon.svg → public/`)
  }

  // 4. Generate PWA PNGs from full icon SVG
  const iconSource = path.join(designDir, 'icon.svg')
  if (fs.existsSync(iconSource)) {
    await generate(iconSource, path.join(DIST, 'icon-192.png'), 192, 'PWA 192×192')
    await generate(iconSource, path.join(DIST, 'icon-512.png'), 512, 'PWA 512×512')
    await generate(iconSource, path.join(ANDROID_ASSETS, 'icon-192.png'), 192, 'Android 192×192')
    await generate(iconSource, path.join(ANDROID_ASSETS, 'icon-512.png'), 512, 'Android 512×512')
    await generate(iconSource, path.join(ANDROID_ASSETS, 'icon.png'), 512, 'Android icon.png')
  }

  // 5. Generate Android launcher mipmap PNGs from favicon (100×100 base)
  const faviconSource = path.join(designDir, 'favicon.svg')
  if (fs.existsSync(faviconSource)) {
    const mipmapSizes = [
      { dir: 'mipmap-hdpi', size: 48 },
      { dir: 'mipmap-mdpi', size: 32 },
      { dir: 'mipmap-xhdpi', size: 64 },
      { dir: 'mipmap-xxhdpi', size: 96 },
      { dir: 'mipmap-xxxhdpi', size: 128 },
    ]
    for (const m of mipmapSizes) {
      const outDir = path.join(ANDROID_MIPMAP, m.dir)
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
      await generate(faviconSource, path.join(outDir, 'ic_launcher.png'), m.size, `Android ${m.dir}`)
      await generate(faviconSource, path.join(outDir, 'ic_launcher_round.png'), m.size, `Android ${m.dir} round`)
      await generate(faviconSource, path.join(outDir, 'ic_launcher_foreground.png'), m.size, `Android ${m.dir} fg`)
    }
  }

  console.log(`\n  Done! All icons generated for Design ${design.toUpperCase()}\n`)
}

generateAll()
