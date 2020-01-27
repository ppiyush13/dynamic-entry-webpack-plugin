import isObject from 'isobject';
import { transformSync } from "@babel/core";
import jsesc from 'jsesc';

const generateModuleContent = (originalEntry) => {
    if (typeof originalEntry === 'string')
        return StringEntry(originalEntry);
    if (Array.isArray(originalEntry))
        return ArrayEntry(originalEntry);
    if (typeof originalEntry === 'function')
        return FunctionEntry(originalEntry);
    if (isObject(originalEntry))
        return ObjectEntry(originalEntry);
};

const generateEntryModule = async (originalEntry, exportable) => {
    const content = await generateModuleContent(originalEntry);

    return exportable
        ? `export default () => ${content};`
        : content;
};

const generateImport = (modulePath, chunkName) => {
    const importStatement = chunkName
        ? `import(/* webpackChunkName: "${chunkName}" */'${modulePath}')`
        : `import('${modulePath}')`;

    return jsesc(importStatement, {
        quotes: 'backtick'
    });
};

const StringEntry = (originalEntry) => {
    /**
     * If entry is string, it is a single file entry
     * dynamic import of that path will suffice
    */
    return generateImport(originalEntry);
};

const ArrayEntry = (originalEntry) => {
    /**
     * Entry is an array
     * Last element is only exported
     * Rest all are simply imported
    */
    const last = originalEntry.pop();

    const imports = originalEntry.map(path => {
        return `await ${generateImport(path)};`;
    });

    const code = `
        (async () => {
            ${imports.join('\n')}
            return ${generateImport(last)};
        })();
    `;

    const result = transformSync(code, {
        cwd: __dirname,
        babelrc: false,
        configFile: false,
        plugins: [
            [
                'transform-async-to-promises',
                {
                    inlineHelpers: true,
                },
            ],
        ],
    });

    return result.code;
};

const FunctionEntry = (originalEntry) => {
    /**
     * entry is a function
     * Lets resolve this function and then call generateFile again
    */
    return Promise.resolve(originalEntry())
        .then(newEntry => generateModuleContent(newEntry));
};

const ObjectEntry = (originalEntry) => {
    /**
     * Entry is object
     * Simply load all the entries as dynamic imports 
     * wrapped within Promise.all
    */
    const imports = Object.keys(originalEntry).reduce((acc, key) => {
        const entry = originalEntry[key];
        acc.push(generateModuleContent(entry));
        return acc;
    }, []);

    return `Promise.all([${imports.join(' , ')}]);`;
};

export {
    generateEntryModule as default,
    StringEntry,
    ArrayEntry,
    FunctionEntry,
    ObjectEntry
};
