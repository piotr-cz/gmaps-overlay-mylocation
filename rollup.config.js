import buble from 'rollup-plugin-buble'

export default {
  input: 'src/index.js',
  plugins: [
    buble({objectAssign: 'Object.assign'}),
  ],
  output: [
    // CommonJS
    {
      format: 'cjs',
      file: 'dist/index.cjs.js',
      exports: 'named',
    },
    // ESM modules
    {
      format: 'esm',
      file: 'dist/index.esm.js',
    },
    // CommonJS + AMD
    {
      format: 'umd',
      file: 'dist/index.umd.js',
      name: 'mylocationOverlayFactory',
      exports: 'named',
    },
    // Not supported by microbundle, but umd is created by default
    {
      format: 'iife',
      file: 'dist/index.iife.js',
      name: 'mylocationOverlayFactory',
      exports: 'named',
    },
  ],
}
