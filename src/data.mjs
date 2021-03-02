export default function(name) {
    return new FishboneData(name);
}

function FishboneData(name) {
    this.name = name;
    this.children = [];
}

FishboneData.prototype.add = function(name) {
    let data = new FishboneData(name);
    this.children.push(data);
    return data;
}

FishboneData.prototype.leaf = function(name) {
    let data = new FishboneData(name);
    this.children.push(data);
    return this;
}

FishboneData.prototype.build = function(chart) {
    function toMap(result, data, key, ownerKey) {
        let value = {
            "key": key,
            "owner": ownerKey,
            "name": data.name,
            "children": [],
            "charting": function() {
                return _clone(this);
            }
        }
        result[key] = value;

        let f = 10 * (1 + Math.floor(data.children.length / 10));
        data.children.forEach(function(c, idx) {
            let child = toMap(result, c, key * f + (idx + 1), key);
            value.children.push(child);
        });

        return value;
    }
    let result = {};
    toMap(result, this, 1, 0);

    if(chart) {
        chart.dataset(result);
    }
    return result;
}

function _clone(data) {
    if(!data) {
        return null;
    }

    let result = {
        key: data.key,
        owner: data.owner,
        name: data.name,
        children: []
    };
    (data.children || []).forEach(function(c) {
        result.children.push(_clone(c));
    });
    return result;
}
