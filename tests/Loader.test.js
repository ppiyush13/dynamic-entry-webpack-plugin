const Loader = require('../src/dynamicEntryWebpack.loader');
require('./toBeSimilarWith');

const deriveLoaderQuery = (loader, exportable) => 
    '?id=some-id' +
    `&entry=${encodeURIComponent(JSON.stringify(loader))}` +
    `&exportable=${exportable}`;

describe('Testing Loader module', () => {

    it.each([
        [
            deriveLoaderQuery("./src/App.js", true),
            `export default () => import('./src/App.js');`,
        ],
        [
            deriveLoaderQuery("./src/App.js", false),
            `import('./src/App.js');`,
        ],
        [
            deriveLoaderQuery(["devServer", "./src/App.js"], true),
            `
                export default () => (function () {
                    try {
                        return Promise.resolve(import('devServer')).then(function () {
                            return import('./src/App.js');
                        });
                    } catch (e) {
                        Promise.reject(e);
                    }
                })();
            `,
        ],
        [
            deriveLoaderQuery(["devServer", "./src/App.js"], false),
            `
                (function () {
                    try {
                        return Promise.resolve(import('devServer')).then(function () {
                            return import('./src/App.js');
                        });
                    } catch (e) {
                        Promise.reject(e);
                    }
                })();
            `,
        ],
    ])('Assert generated code is as expected', (loaderQuery, expectedCode) => {
        const code = Loader.call({
            query: loaderQuery,
        });

        expect(expectedCode).toBeSimilarWith(code);
    });

});
