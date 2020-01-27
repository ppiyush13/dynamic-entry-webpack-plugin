# dynamic-entry-webpack-plugin
webpack plugin to make entry point as dynamic import

## Motivation

    - Whenever creating front-end applications, multiple chunks might get created. In order to load our application certain chunks needs to be present before loading our main bundle.
        Example, vendor chunk must be present before main bundle is loaded.  

    - Loading of entry chunks before main bundle is taken by **html-webpack-plugin**. For example  

    We might see some like this injected in HTML

    ```html
  
        <script src="/static/js/bundle.js"></script>
        <script src="/static/js/3.chunk.js"></script>
        <script src="/static/js/main.chunk.js"></script>
        <script src="/main.1016aebc24e44815f6ad.hot-update.js"></script>
  
    ```  
    This works fine for SPA, where bundle is intended to be loaded in browser.
  
    - Consider the scenario where you need to load application bundle conditionally. 
        For example, loading several micro-frontends bundles at run-time or loading a exportable library
  
        For this cases, bundles are hosted on different servers. They are included on runtime.
    
    - For scenarios described above, it will be best if we could load entry bundle, which in turn load the main bundle and entry chunks needed before main.
  
    - This is where **dynamic-entry-webpack-plugin** comes handy. It will turn all webpack entry points into dynamic import because webpack already knows which all dependent chunks are needed for particular dynamic import. Webpack ensures that all the dependend modules for dynamic import are loaded then the actual module is loaded.
  
    - This behavior os webpack is leveraged to provide only single entry bundle, which will load all entry chunks and main bundle.

## Usage
    Create a object of plugin and pass it to the webpack plugins config.

    ```js

        const DynamicEntry = require('dynamic-entry-webpack-plugin');

        module.exports = {
            ...,
            plugins: [
                new DynamicEntry({
                    exportable: true,
                }),
            ]
        };
  
    ```

    **Options**  
    **exportable** - boolean, optional - To make entry module exportable. **Default: true**  

## Entry points

    webpack supports entry point config in various formats. So accordingly, **dynamic-entry-webpack-plugin** behaves in following ways:

    - **string**  
  
        When entry point is string, plugin creates new entry module with following code:  
        ```js

            export default () => import('<actual webpack entry point>');

            // OR

            import('<actual webpack entry point>'); // if exportable is false

        ```  
  
    - **array**  
  
        According to webpack when multiple configs are provided in array, all the entries are included in bundle with last entry exported. Providing similar behavior, plugin also imports all the entry points and last entry point is returned.

        ```js

            export default () => (async () => {
                await import('<entry one>');
                await import('<entry two>');
                .
                .
                return import('last entry');
            })();

            // when exportable is false, following is returned
            (async () => {
                await import('<entry one>');
                await import('<entry two>');
                .
                .
                return import('last entry');
            })();
  
        ```  

        * Above code is auto transpiled to convert async-await syntax to promises using [babel-plugin-transform-async-to-promises][async-to-promises]
  
    - **object**
  
        According to webpack, for object entry point, webpack creates multiple bundles with its own runtime. All the generated bundles may not be intended to be loaded simultaneously. So use of this plugin is discouraged in such scenarios.  
  
    - **function**

        When given function to entry point it is awaited and result is then processed to form entry module. Function must return string or array. Again use of this plugin is discouraged if function returns object as entry points.


[async-to-promises] - https://github.com/rpetrich/babel-plugin-transform-async-to-promises