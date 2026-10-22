import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import wfReload from "@xatom/wf-app-hot-reload"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import fs from "fs"
import { transform } from "lightningcss"

function separateSourceMaps(): Plugin {
  return {
    name: "separate-source-maps",
    closeBundle() {
      const distDir = path.resolve(__dirname, "dist/assets")
      const mapsDir = path.resolve(__dirname, "maps/assets")

      if (fs.existsSync(distDir)) {
        if (!fs.existsSync(mapsDir)) {
          fs.mkdirSync(mapsDir, { recursive: true })
        }

        const allDistFiles = fs.readdirSync(distDir)
        allDistFiles.forEach((file) => {
          if (file.endsWith(".css")) {
            const cssPath = path.join(distDir, file)
            const cssCode = fs.readFileSync(cssPath)

            const res = transform({
              filename: file,
              code: cssCode,
              minify: true,
              sourceMap: true,
            })

            if (res.map) {
              const mapString = Buffer.from(res.map).toString("utf-8")
              const mapData = JSON.parse(mapString)
              mapData.version = 3
              mapData.file = file
              mapData.sources = [file.replace(/\.css$/, ".generated.css")]
              mapData.sourcesContent = [cssCode.toString("utf-8")]

              fs.writeFileSync(cssPath, res.code)
              fs.writeFileSync(
                path.join(mapsDir, `${file}.map`),
                JSON.stringify(mapData)
              )
            }
          }
        })

        const files = fs.readdirSync(distDir)
        files.forEach((file) => {
          if (file.endsWith(".map")) {
            fs.copyFileSync(
              path.join(distDir, file),
              path.join(mapsDir, file)
            )
            fs.unlinkSync(path.join(distDir, file))
          }
        })
      }
    },
  }
}

export default defineConfig({
  server: {
    port: 1337,
    watch: {
      usePolling: true,
    },
  },
  plugins: [tailwindcss(), react(), wfReload(), separateSourceMaps()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    cssMinify: false,
  },
})