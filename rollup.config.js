import buble from 'rollup-plugin-buble'

export default {
  input: 'src/index.js',
  plugins: [
    buble({objectAssign: 'Object.assign'}),
  ],
  output: [
    {
      format: 'cjs',
      file: 'dist/index.cjs.js',
      exports: 'named',
    },
    {
      format: 'esm',
      file: 'dist/index.esm.js',
    }
  ]
}
