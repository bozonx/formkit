// Run this file - ./node_modules/.bin/ts-node ./test/test-import.ts

//import * as Formkit from '../dist/index';

//declare const global: {window: any};

(global as any).window = {};

const Formkit = require('../dist/index');

console.log(Object.keys(Formkit));
