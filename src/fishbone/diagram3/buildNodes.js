function _buildNodes(node) {
    this._nodes.push(node);

    var crossCount = 0; // cross index
    var between = [node, node.connector],
        nodeLinks = [{
            source: node,
            target: node.connector,
            depth: node.depth || 0
        }],
        childLinkCount;

    if (!node.parent) {
        var tail = {
            tail: true,
            horizontal: true,
            depth: 0,
            children: [],
        };
        this._nodes.push(tail);

        between = [tail, node];
        nodeLinks[0].source = tail;
        nodeLinks[0].target = node;
        node.horizontal = true;
        node.depth = 0;
        node.root = true;
        node.totalLinks = []
    } else {
        node.connector.crossCount = 0;
        node.connector.totalLinks = [];
    }

    node.linkCount = 1;

    if (node.depth < this._depth) {
        (node.children || []).forEach(function(child, idx) {
            child.parent = node;
            child.depth = (node.depth || 0) + 1;
            child.childIdx = idx;
            child.region = node.region ? node.region : (idx & 1 ? 1 : -1); // up:-1, down:1
            child.horizontal = !node.horizontal;

            if (child.horizontal || child.region == -1) {
                crossCount++;
            }

            child.connector = {
                between: between,
                crossIdx: (crossCount - 1)
            };
            this._nodes.push(child.connector);

            nodeLinks.push({
                source: child,
                target: child.connector,
                depth: child.depth
            });

            // recurse capturing number of links created
            childLinkCount = _buildNodes.call(this, child);
            node.linkCount += childLinkCount;
            between[1].totalLinks.push(childLinkCount);
        }.bind(this));
    }

    between[1].crossCount = crossCount;

    Array.prototype.unshift.apply(this._links, nodeLinks);

    // the number of links created byt this node and its children...
    // TODO: use `linkCount` and/instead of `childIdx` for spacing
    return node.linkCount;
}

export default _buildNodes;