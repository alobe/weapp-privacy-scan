import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  noExternal: [/./],
  format: 'cjs',
  minify: true,
  minifyWhitespace: true,
  minifyIdentifiers: true,
  minifySyntax: true,
})