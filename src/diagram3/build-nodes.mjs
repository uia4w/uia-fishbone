function buildNodes(node) {
    this._nodes.push(node);
    var cx = 0;
    var between = [node, node.connector],
        nodeLinks = [{
            source: node,
            target: node.connector,
            arrow: node.key !== 1,
            depth: node.depth || 0
        }],
        prev,
        childLinkCount;

    if (!node.parent) {
        this._nodes.push(prev = {
            tail: true,
            children: []
        });
        between = [prev, node];
        nodeLinks[0].source = prev;
        nodeLinks[0].target = node;
        node.horizontal = true;
        node.vertical = false;
        node.depth = 0;
        node.root = true;
        node.totalLinks = []
    } else {
        node.connector.maxChildIdx = 0;
        node.connector.totalLinks = [];
    }

    node.linkCount = 1;

    if(node.depth < this._depth) {
        (node.children || []).forEach(function (child, idx) {
            child.parent = node;
            child.depth = (node.depth || 0) + 1;
            child.childIdx = idx;
            child.region = node.region ? node.region : (idx & 1 ? 1 : -1);      // up:1, down:-1
            child.horizontal = !node.horizontal;
            child.vertical = !node.vertical;

            if (node.root && prev && !prev.tail) {
                this._nodes.push(child.connector = {
                    between: between,
                    childIdx: prev.childIdx
                });
                prev = null;
            } else {
                this._nodes.push(prev = child.connector = {
                    between: between,
                    childIdx: cx++
                });
            }

            nodeLinks.push({
                source: child,
                target: child.connector,
                depth: child.depth
            });

            // recurse capturing number of links created
            childLinkCount = buildNodes.call(this, child);
            node.linkCount += childLinkCount;
            between[1].totalLinks.push(childLinkCount);
        }.bind(this));
    }

    between[1].maxChildIdx = cx;

    Array.prototype.unshift.apply(this._links, nodeLinks);

    // the number of links created byt this node and its children...
    // TODO: use `linkCount` and/instead of `childIdx` for spacing
    return node.linkCount; 
}

export default buildNodes;