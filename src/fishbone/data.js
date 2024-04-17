export default function(name, value = 0, obj = null, visible = true) {
    return new FishboneData(name, value, obj, visible);
}

function FishboneData(name, value = 0, obj = null, visible = true) {
    this.name = name;
    this.value = value;
    this.obj = obj;
    this.visible = visible;
    this.children = [];
    this.group = null;
}

FishboneData.prototype.add = function(name, value = 0, obj = null, visible = true) {
    let data = new FishboneData(name, value, obj, visible);
    this.children.push(data);
    return data;
}

FishboneData.prototype.leaf = function(name, value = 0, obj = null, visible = true) {
    let data = new FishboneData(name, value, obj, visible);
    this.children.push(data);
    return this;
}

FishboneData.prototype.group = function(sGroup) {
    if (arguments.length === 0) {
        return this.group;
    } else {
        this.group = sGroup;
        return this;
    }
}

FishboneData.prototype.value = function(nValue) {
    if (arguments.length === 0) {
        return this.value;
    } else {
        this.value = nValue;
        return this;
    }
}

FishboneData.prototype.obj = function(obj) {
    if (arguments.length === 0) {
        return this.obj;
    } else {
        this.obj = obj;
        return this;
    }
}

FishboneData.prototype.dataset = function() {
    function build(result, data, key, ownerKey) {
        let bone = {
            "key": key,
            "owner": ownerKey,
            "name": data.name,
            "value": data.value,
            "group": data.group,
            "obj": data.obj,
            "visible": data.visible,
            "children": [],
            "charting": function(maxShowed, sorter) {
                return _charting(this, maxShowed, 0, sorter);
            }
        }
        result[key] = bone;


        let f = 10 * (1 + Math.floor(data.children.length / 10));
        data.children.forEach(function(one, idx) {
            let child = build(
                result,
                one,
                key * f + (idx + 1),
                key);
            bone.children.push(child);
        });

        return bone;
    }

    let result = {};
    build(result, this, 1, 0);
    return result;
}

function _charting(data, maxShowed, depth, sortF) {
    if (!data) {
        return null;
    }

    var max = Array.isArray(maxShowed) ?
        maxShowed[Math.min(maxShowed.length - 1, depth)] :
        maxShowed;

    let result = {
        key: data.key,
        owner: data.owner,
        name: data.name,
        value: data.value,
        group: data.group,
        obj: data.obj,
        children: []
    };

    data.children.sort(sortF);
    data.children.forEach(function(c) {
        if (c.visible && (max <= 0 || result.children.length < max)) {
            result.children.push(_charting(c, maxShowed, depth + 1, sortF));
        }
    });
    return result;
}