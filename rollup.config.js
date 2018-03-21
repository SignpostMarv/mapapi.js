export default {
    input:[
        './examples-src/index.js',
        './examples-src/renderer.transitionend.js',
    ],
    output: {
        format: 'es',
        dir: './examples/'
    },
    experimentalCodeSplitting: true,
    experimentalDynamicImport: true
}
