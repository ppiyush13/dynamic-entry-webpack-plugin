const DynamicEntryPlugin = require('../src/index');

const deriveLoaderPath = entry => '/webpack.loader.js?' +
    'id=dynamic-entry&' +
    'exportable=true&' +
    `entry=${encodeURIComponent(JSON.stringify(entry))}` +
    '!';

const MockHook = function () {
    const callbacks = new Map();
    this.returnMap = new Map();
    this.tap = jest.fn((pluginName, callback) => {
        callbacks.set(pluginName, callback);
    });

    this.call = jest.fn((...args) => {
        callbacks.forEach((cb, pluginName) =>
            this.returnMap.set(
                pluginName,
                cb(...args)
            )
        );
    });
}

describe('Testing apply function with non repeating updates', () => {
    let compiler, dynamicEntryPlugin;

    beforeEach(() => {
        compiler = {
            options: {},
            hooks: {
                entryOption: new MockHook(),
            },
        };

        dynamicEntryPlugin = new DynamicEntryPlugin();
        dynamicEntryPlugin.loaderPath = '/webpack.loader.js';
        dynamicEntryPlugin.apply(compiler);
    });

    describe('testing DynamicEntryPlugin, updating entry only once', () => {

        it.each(
            [
                [
                    'string',
                    './src/App',
                    deriveLoaderPath('./src/App'),
                ],
                [
                    'array',
                    [
                        './node_modules/dev-server.js',
                        './src/Main.jsx'
                    ],
                    deriveLoaderPath([
                        './node_modules/dev-server.js',
                        './src/Main.jsx'
                    ]),
                ],
                [
                    'object',
                    {
                        main: './src/App',
                        vendor: ['./src/vendor1', './src/vendor2'],
                    },
                    {
                        main: deriveLoaderPath('./src/App'),
                        vendor: deriveLoaderPath(['./src/vendor1', './src/vendor2']),
                    },
                ],
            ]
        )('Testing with basic types, without involving multiple calls for type: [%s]', (type, entry, expectedEntry) => {
            const { entryOption } = compiler.hooks;
            entryOption.call('context', entry);

            expect(entryOption.returnMap.get('DynamicEntryPlugin')).toEqual(true);

            expect(entryOption.call).toHaveBeenCalledTimes(2);
            expect(entryOption.call).toHaveBeenLastCalledWith(
                'context',
                expectedEntry,
            );
        });
    });

    describe('testing DynamicEntryPlugin, updating entry more than one', () => {

        it.each(
            [
                [
                    'string',
                    'string',
                    {
                        calledTimes: 4,
                        changes: [
                            [
                                './src/App',
                                deriveLoaderPath('./src/App'),
                            ],
                            [
                                './src/changeOfEntry',
                                deriveLoaderPath('./src/changeOfEntry'),
                            ],
                        ],
                    },
                ],
                [
                    'string',
                    'array',
                    {
                        calledTimes: 4,
                        changes: [
                            [
                                './src/App',
                                deriveLoaderPath('./src/App'),
                            ],
                            [
                                [
                                    './src/devServer',
                                    deriveLoaderPath('./src/App'),
                                ],
                                deriveLoaderPath([
                                    './src/devServer',
                                    './src/App',
                                ]),
                            ],
                        ],
                    },
                ],
                [
                    'string',
                    'object',
                    {
                        calledTimes: 4,
                        changes: [
                            [
                                './src/App',
                                deriveLoaderPath('./src/App'),
                            ],
                            [
                                {
                                    sample: deriveLoaderPath('./src/App'),
                                    main: [
                                        './src/devServer',
                                        deriveLoaderPath('./src/App'),
                                    ]
                                },
                                {
                                    "sample": deriveLoaderPath('./src/App'),
                                    "main": deriveLoaderPath(['./src/devServer', './src/App']),
                                }
                            ],
                        ],
                    },
                ],
                [
                    'array',
                    'string',
                    {
                        calledTimes: 4,
                        changes: [
                            [
                                [
                                    './src/devServer',
                                    './src/App',
                                ],
                                deriveLoaderPath([
                                    './src/devServer',
                                    './src/App',
                                ]),
                            ],
                            [
                                './src/nonPreservingEntry',
                                deriveLoaderPath('./src/nonPreservingEntry'),
                            ],
                        ],
                    },
                ],
                [
                    'array',
                    'array',
                    {
                        calledTimes: 4,
                        changes: [
                            [
                                [
                                    'react-dev-utils/webpackHotDevClient',
                                    './src/App',
                                ],
                                deriveLoaderPath([
                                    'react-dev-utils/webpackHotDevClient',
                                    './src/App',
                                ]),
                            ],
                            [
                                [
                                    './src/devServer/hot-client',
                                    deriveLoaderPath([
                                        'react-dev-utils/webpackHotDevClient',
                                        './src/App',
                                    ]),
                                ],
                                deriveLoaderPath([
                                    './src/devServer/hot-client',
                                    'react-dev-utils/webpackHotDevClient',
                                    './src/App',
                                ]),
                            ],
                        ],
                    },
                ],
                [
                    'array',
                    'array',
                    {
                        calledTimes: 4,
                        changes: [
                            [
                                [
                                    'react-dev-utils/webpackHotDevClient',
                                    './src/App',
                                ],
                                deriveLoaderPath([
                                    'react-dev-utils/webpackHotDevClient',
                                    './src/App',
                                ]),
                            ],
                            [
                                [
                                    './src/devServer/hot-client',
                                    deriveLoaderPath([
                                        './somethingNotPresentInMap',
                                        'react-dev-utils/webpackHotDevClient',
                                        './src/App',
                                    ]),
                                ],
                                deriveLoaderPath([
                                    './src/devServer/hot-client',
                                    './somethingNotPresentInMap',
                                    'react-dev-utils/webpackHotDevClient',
                                    './src/App',
                                ]),
                            ],
                        ],
                    },
                ],
                [
                    'array',
                    'object',
                    {
                        calledTimes: 4,
                        changes: [
                            [
                                [
                                    'react-dev-utils/webpackHotDevClient',
                                    './src/App',
                                ],
                                deriveLoaderPath([
                                    'react-dev-utils/webpackHotDevClient',
                                    './src/App',
                                ]),
                            ],
                            [
                                {
                                    sample: [
                                        deriveLoaderPath([
                                            'react-dev-utils/webpackHotDevClient',
                                            './src/App',
                                        ]),
                                        './src/sample.js',
                                    ],
                                    main: [
                                        deriveLoaderPath([
                                            'react-dev-utils/webpackHotDevClient',
                                            './src/App',
                                        ]),
                                        './src/main.js',
                                    ]
                                },
                                {
                                    "main": deriveLoaderPath([
                                        'react-dev-utils/webpackHotDevClient',
                                        './src/App',
                                        './src/main.js',
                                    ]),
                                    "sample": deriveLoaderPath([
                                        'react-dev-utils/webpackHotDevClient',
                                        './src/App',
                                        './src/sample.js',
                                    ]),
                                },
                            ],
                        ],
                    },
                ],
                [
                    'object',
                    'string',
                    {
                        calledTimes: 4,
                        changes: [
                            [
                                {
                                    main1: './src/main1.js',
                                    main2: './src/main2.js',
                                },
                                {
                                    main1: deriveLoaderPath('./src/main1.js'),
                                    main2: deriveLoaderPath('./src/main2.js'),
                                },
                            ],
                            [
                                './lossyEntryScenario',
                                deriveLoaderPath('./lossyEntryScenario'),
                            ],
                        ],
                    },
                ],
                [
                    'object',
                    'array',
                    {
                        calledTimes: 4,
                        changes: [
                            [
                                {
                                    main1: './src/main1.js',
                                    main2: './src/main2.js',
                                },
                                {
                                    main1: deriveLoaderPath('./src/main1.js'),
                                    main2: deriveLoaderPath('./src/main2.js'),
                                },
                            ],
                            [
                                [
                                    './someoneRemovedPreviousEntries.js',
                                    './hereAsWell.ThoughThisIsNotRealScenario.js'
                                ],
                                deriveLoaderPath([
                                    './someoneRemovedPreviousEntries.js',
                                    './hereAsWell.ThoughThisIsNotRealScenario.js'
                                ]),
                            ],
                        ],
                    },
                ],
                [

                    'object',
                    'object',
                    {
                        calledTimes: 4,
                        changes: [
                            [
                                {
                                    main1: './src/main1.js',
                                    main2: './src/main2.js',
                                },
                                {
                                    main1: deriveLoaderPath('./src/main1.js'),
                                    main2: deriveLoaderPath('./src/main2.js'),
                                },
                            ],
                            [
                                // This is the real scenario, for which version 2.0 was release
                                {
                                    main1: [
                                        'devServer',
                                        deriveLoaderPath('./src/main1.js')
                                    ],
                                    main2: [
                                        'devServer',
                                        deriveLoaderPath('./src/main2.js')
                                    ],
                                },
                                {
                                    main1: deriveLoaderPath(['devServer', './src/main1.js']),
                                    main2: deriveLoaderPath(['devServer', './src/main2.js']),
                                },
                            ],
                        ],
                    },
                ],
            ],
        )('Testing multiple calls with original entry type [%s] and modified type [%s]', (firstType, updateType, { calledTimes, changes }) => {
            const { entryOption } = compiler.hooks;

            changes.forEach(([entry, updatedEntry]) => {
                entryOption.call('context', entry);

                expect(entryOption.returnMap.get('DynamicEntryPlugin')).toEqual(true);

                expect(entryOption.call).toHaveBeenLastCalledWith(
                    'context',
                    updatedEntry,
                );
            });

            expect(entryOption.call).toHaveBeenCalledTimes(calledTimes);
        });
    });

});

describe('Testing with same repeated entry', () => {
    let compiler, dynamicEntryPlugin;

    beforeAll(() => {
        compiler = {
            options: {},
            hooks: {
                entryOption: new MockHook(),
            },
        };

        dynamicEntryPlugin = new DynamicEntryPlugin();
        dynamicEntryPlugin.loaderPath = '/webpack.loader.js';
        dynamicEntryPlugin.apply(compiler);
    });

    it.each(
        [
            [
                true,
                2,
                './src/App',
                deriveLoaderPath('./src/App'),
            ],
            [
                undefined,
                1,
                deriveLoaderPath('./src/App'),
                deriveLoaderPath('./src/App'),
            ],
            [
                true,
                2,
                ['devServer', deriveLoaderPath('./src/App')],
                deriveLoaderPath(['devServer', './src/App'])
            ],
            [
                undefined,
                1,
                deriveLoaderPath(['devServer', './src/App']),
                deriveLoaderPath(['devServer', './src/App'])
            ],
        ],
    )('should return [%s] and call function [%d] times',
        (exepectedReturn, calledTimes, entry, expectedUpdatedReturn) => {
            const { entryOption } = compiler.hooks;
            entryOption.call('context', entry);

            expect(entryOption.returnMap.get('DynamicEntryPlugin')).toEqual(exepectedReturn);
            expect(entryOption.call).toHaveBeenCalledTimes(calledTimes);

            expect(entryOption.call).toHaveBeenLastCalledWith(
                'context',
                expectedUpdatedReturn,
            );
            expect(compiler.options.entry).toEqual(expectedUpdatedReturn);

            entryOption.call.mockClear();
        });

});

describe('misc tests', () => {
    it('should assert that plugin instace has name property set to DynamicEntryPlugin', () => {
        expect(DynamicEntryPlugin.name).toEqual('DynamicEntryPlugin');
    });

    it.each([
        [
            undefined,
            true,
        ],
        [
            {},
            true,
        ],
        [
            {
                exportable: true,
            },
            true,
        ],
        [
            {
                exportable: false,
            },
            false,
        ],
    ])('Testing constructor params', (params, expectedExportable) => {
        const dynamicEntryPlugin = new DynamicEntryPlugin(params);

        expect(dynamicEntryPlugin.exportable).toEqual(expectedExportable);
    });

});

describe('testing DynamicEntryPlugin.getEntryFromLoader', () => {

    const dynamicEntryPlugin = new DynamicEntryPlugin();

    it.each([
        [
            undefined,
            '',
        ],
        [
            './src/App.js',
            './src/App.js',
        ],
        [
            './webpack.loader.js?id=some-id&entry="./src/App.js"!',
            './src/App.js',
        ],
        [
            './webpack.loader.js?entry="./src/App.js"!&id=some-id',
            './src/App.js',
        ],
        [
            deriveLoaderPath(['./app', 'devServer']),
            ['./app', 'devServer'],
        ],
        [
            './webpack.loader.js?someMore=nothing-more&entry=["./src/App.js", "devServer"]!&id=some-id',
            ["./src/App.js", "devServer"],
        ],
        [
            './webpack.loader.js?entry={"main": ["./src/App.js", "devServer"], "vendor" : "react" }!&id=some-id',
            {
                main: ["./src/App.js", "devServer"],
                vendor: "react"
            },
        ],
        [
            deriveLoaderPath({ a: 1, b: '2' }),
            {
                a: 1,
                b: '2',
            },
        ],
    ])('For input: [%s], must return: [%s]', (loaderParam, returnOutput) => {
        expect(
            dynamicEntryPlugin.getEntryFromLoader(loaderParam)
        ).toEqual(returnOutput);
    });

});
