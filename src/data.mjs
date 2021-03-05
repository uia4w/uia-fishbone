export default function(name, showed = true) {
    return new FishboneData(name, showed);
}

function FishboneData(name, showed) {
    this.name = name;
    this.showed = showed;
    this.children = [];
}

FishboneData.prototype.add = function(name, showed = true) {
    let data = new FishboneData(name, showed);
    this.children.push(data);
    return data;
}

FishboneData.prototype.leaf = function(name, showed = true) {
    let data = new FishboneData(name, showed);
    this.children.push(data);
    return this;
}

FishboneData.prototype.build = function(chart) {
    function toMap(result, data, key, ownerKey) {
        let value = {
            "key": key,
            "owner": ownerKey,
            "name": data.name,
            "showed": data.showed,
            "children": [],
            "charting": function(maxShowed = 0) {
                return _charting(this, maxShowed, 0);
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

function _charting(data, maxShowed, depth) {
    let max = Array.isArray(maxShowed) ?
        maxShowed[Math.min(maxShowed.length - 1, depth)] :
        maxShowed;
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
        if(c.showed && (max <= 0 || result.children.length < max)) {
            result.children.push(_charting(c, maxShowed, depth + 1));
        }
    });
    return result;
}
