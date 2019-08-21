/* eslint-disable strict, no-useless-escape, no-cond-assign */
'use strict';

const fs = require('fs');
const platform = require('os').platform;
const path = require('path');
const slash = require('slash');

const VOLUME = /^([A-Z]:)/;
const IS_WINDOWS = platform() === 'win32';
const normalizePath = function(id) {
    if ((IS_WINDOWS && typeof id === 'string') || VOLUME.test(id)) {
        return slash(id.replace(VOLUME, ''));
    }
    return id;
};
const matches = function(key, find) {
    if(!key || !find )
        return false;
    if(key === find)
        return true;
    if(find instanceof RegExp)
        return find.test(key);
    return false;
};


/**
 * Rewrite imports that shouldn't be chunked by Rollup but need an updated path for example.
 * All these imports are flagged as "external" so that no further import-magic is applied.
 * @param {*} optionsOrPath either a string (path that gets prepended on all imports) 
 * or an distinct config-object to only apply our logic to specific imports (for example: 
 * { 
 *      entries: [ 
 *          {find:"simpleImport", replacement:"simpleReplacement.js"},
 *          {find:/test(.*)/, replacement:"$1.js", isRelative: true}
 *      ] 
 * }).
 */
module.exports = function rewriteImports(optionsOrPath) {
    const isString = typeof optionsOrPath === "string";
    return {
        name: 'rewriteImports',
        resolveId(importee, importer) {
            const importeeId = normalizePath(importee);
            const importerId = normalizePath(importer);
            if(isString) {
                return {
                    id:normalizePath(optionsOrPath)+importeeId,
                    external:true
                };
            } else if(optionsOrPath.entries) {
                const entry = optionsOrPath.entries
                    .find(function(entry) { return matches(importeeId, entry.find);});
                if(entry) {
                    var replacementId = importeeId.replace(entry.find, entry.replacement);
                        replacementId = normalizePath(replacementId);
                    if(entry.isRelative) {
                        const currentPath = importerId.substr(0, importerId.lastIndexOf("/"));
                        const absolutePath = path.resolve(currentPath, replacementId);
                        const relativePath = normalizePath(path.relative(currentPath, absolutePath));
                        replacementId = relativePath;
                        if(replacementId.substr(0,1) !== "/" && replacementId.substr(0,1) !== '.') {
                            replacementId = './'+replacementId;
                        }
                    }
                    if(entry.prepend) {
                        replacementId = entry.prepend+replacementId;
                    }
                    if(entry.append) {
                        replacementId = replacementId+entry.append;
                    }
                    return { 
                        id:replacementId,
                        external:true //we're pretending that we're external here
                    };
                }
            }
		}
    }
}