const { transformSync } = require("@babel/core");
const jsesc = require('jsesc');

const generateEntryModule = (originalEntry, exportable) => {
    const content = Array.isArray(originalEntry)
        ? ArrayEntry(originalEntry)
        : StringEntry(originalEntry);

    return exportable
        ? `export default () => ${content}`
        : content;
};

const generateImport = (modulePath) => {
    const importStatement = `import('${modulePath}');`;

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

module.exports = generateEntryModule;
