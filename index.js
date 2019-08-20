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
const matches = function(key, find, isRegEx) {
    if(!key || !find )
        return false;
    if(!isRegEx && key === find)
        return true;
    if(isRegEx)
        return find.test(key);
    return false;
};

module.exports = function rewriteImports(optionsOrPath) {
    const isString = typeof optionsOrPath === "string";
    return {
        name: 'rewriteImports',
        resolveId(importee, importer) {
            const importeeId = normalizePath(importee);
            const importerId = normalizePath(importer);
            if(isString) {
                return normalizePath(optionsOrPath)+importeeId;
            } else if(optionsOrPath.entries) {
                const entry = optionsOrPath.entries
                    .find(function(entry) { return matches(importeeId, entry.find, entry.isRegEx);});
                if(entry) {
                    const replacementId =  importeeId.replace(entry.find, entry.replacement);
                    if(entry.isRelative) {
                        return { 
                            id:normalizePath(path.resolve(importerId, replacementId)),
                            external:true //we're pretending that we're external here
                        }
                    }
                    return {
                        id:normalizePath(replacementId),
                        external:true //we're pretending that we're external here
                    }
                }
            }
		}
    }
}