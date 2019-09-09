# rollup-plugin-rewrite-imports


## Temporary notice from thiscantbeserious about this fork:

The code has been rewritten to use the resolveId hook which will actually get all imports without using any regex magic ourselves to the code. It will also currently return all IDs flagging them as "EXTERNAL" automatically - means you spare yourself an additional plugin like autoExternals as well.

**Since the imports are flagged "external" they won't be processed by rollup itself any further!** 

**If you seek for that functionality have a look at [rollup-plugin-alias](https://github.com/rollup/rollup-plugin-alias)** 

...which does the same (and uses almost the same syntax\*) just for imports that are ment to handled by rollup (aka all regular imports).

\**Before you hurry off to use it - my [PR was already reviewed and approved there](https://github.com/rollup/rollup-plugin-alias/pull/53), but it's still pending the Merge and the version isn't published on NPM yet. If you want to use it right now then you'll have to grab [my fork in the meantime](https://github.com/thiscantbeserious/rollup-plugin-alias).*

The previous hook of renderChunk only grabbed imports that were sitting in chunks (meaning no entry-points in itself). This also supports a distinct configuration as follows:

```
rewriteImports({
	entries: [
		{ find:/^i18n\(.*)/, replacement:"$1.js", prepend:"i18n!", isRelative:true },
		{ find:/^text\(.*)/, replacement:"$1", prepend:"text!", isRelative:true },
		{ find:/^(knockout-jqueryui|jquery-ui|slick)\/(.*)/, replacement:"$1/$2.js" }
	]
})

```

If you specify `isRelative: true` then the plugin will try to compare the resulting path (consisting with the initial path and the one you supplied) with the importer and update it to be "more" simple and flexible. Use that option with care!

As you can see Regular Expressions are also supported now ... more on that later (see for an usage-example below).

You can still use the old way and simply use a string so that your path will get appended in front of all (!) imports:

```
rewriteImports("../")
```

**It's currently not covered by any tests (well the old tests are failing since they're outdated) - this still needs to be done.**

--------

## Why

This is useful when you have fragmented or disconnected build routines. This can happen 
when part of 1 application is modularly mixed with another at run time. [HAXcms](https://haxtheweb.org) 
leverages this plugin to allow theme developers to use the expeced approaches and methods
they typically find in web component development, yet not break the site given that 
the build routine is shipped with that system.

This puts theme developers and platform owners on the same tooling / workflows yet 
work independently of one another.

## Install

```
$ npm install rollup-plugin-rewrite-imports --save-dev
```
or
```
$ yarn add rollup-plugin-rewrite-imports --dev
```

## How to use

This is an example usage with autoExternal. In this example, we are assuming that
everything in package.json should be treated as external (so roll up won't build it).

Next, `rewriteImports` is called in order to forcibly point to the location that we are
actually building these assets into.
```javascript
const path = require('path');
const autoExternal = require('rollup-plugin-auto-external');
const rewriteImports = require('rollup-plugin-rewrite-imports');
const production = true;
module.exports = function() {
  return {
    input: 'src/custom.js',
    treeshake: !!production,
    output: {
      file: `build/custom.amd.js`,
      format: 'esm',
      sourcemap: false,
    },
    plugins: [
      autoExternal({
        builtins: false,
        dependencies: true,
        packagePath: path.resolve('package.json'),
        peerDependencies: false,
      }),
      rewriteImports(`../../build/es6/node_modules/`),
    ],
  };
};
```
