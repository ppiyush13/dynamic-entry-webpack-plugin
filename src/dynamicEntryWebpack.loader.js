const {getOptions} = require('loader-utils');
const generateEntryModule = require('./generateEntryModule');

module.exports = function (source) {
    const options = getOptions(this);
    const {entry, exportable} = options;
    const parsedEntry = JSON.parse(entry);

    return generateEntryModule(parsedEntry, exportable);
};
