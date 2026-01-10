// scripts/run-analysis.js
require('ts-node').register({
  compilerOptions: {
    module: 'CommonJS'
  }
});
require('./analyze-mp-dna.ts');

