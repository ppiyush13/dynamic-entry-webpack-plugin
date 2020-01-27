import InjectPlugin from 'webpack-inject-plugin';
import generateEntryModule from './generateEntryModule'; 

export default class DynamicEntryPlugin {
    constructor(options) {
        this.exportable = options.exportable == null
            ? true
            : options.exportable;
    }

    async apply(compiler) {
        const originalEntry = compiler.options.entry;
        compiler.options.entry = [];
        new InjectPlugin(
            () => generateEntryModule(originalEntry, this.exportable),
        ).apply(compiler);
    }
};
