const definition = require("./package.json");
const dependencies = Object.keys(definition.dependencies || {});

import nodeResolve from '@rollup/plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';

export default {
    input: "src/index.mjs",
    external: dependencies,
    output: {
        extend: true,
        file: `dist//${definition.name}.js`,
        format: "umd",
        name: `uia.fishbone`
    },
    plugins: [ 
        builtins(),
        nodeResolve()
    ]
};
