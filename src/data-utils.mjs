function clone(data) {
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
        result.children.push(clone(c));
    });
    return result;
}

export {
    clone
}