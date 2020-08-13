'use strict';

const internals = {};

module.exports = internals.State = class {
    constructor(ancestors = [], keys = []) {

        this.ancestors = ancestors;
        this.keys = keys;
    }

    dive(ancestor, key) {

        return new internals.State([ancestor, ...this.ancestors], [...this.keys, key]);
    }
};
