export default function(values) {
    return new Values(values);
}

function Values(values) {
    this._values = values;
}

Values.prototype.values = function(values) {
    this._values = values;
    return this;
}

Values.prototype.select = function(index) {
    if(index < 0) {
        return this._values[0];
    }
    if(index >= this._values.length) {
        return this._values[this.values.length - 1];
    }
    return this._values[index];
}
