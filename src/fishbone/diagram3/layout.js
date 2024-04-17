export default function(width, height) {
    var offset = width * 0.05,
        a,
        b;

    this._nodes.forEach(function(node) {
        if (node.root) {
            node.x = width - this._margin - (node.name.length + 7) * 12;
            node.y = height / 2;
            return;
        }
        if (node.tail) {
            node.x = this._margin;
            node.y = height / 2;
            return;
        }

        if (node.connector) {
            a = node.connector.between[0];
            b = node.connector.between[1];
            if (node.horizontal) {
                node.connector.x = b.x - (b.x - a.x) * (1 + node.connector.crossIdx) / (b.crossCount + 1);
                node.connector.y = b.y - (b.y - a.y) * (1 + node.connector.crossIdx) / (b.crossCount + 1);
                node.x = node.connector.x - 30 - Math.min(90, node.children.length * 30);
                node.y = node.connector.y;
            } else {
                node.connector.x = b.x - offset - (b.x - a.x - offset) * node.connector.crossIdx / b.crossCount - 50;
                node.connector.y = b.y;
                node.x = node.connector.x - 60;
                node.y = node.region === -1 ? this._margin : (height - this._margin)
            }
        }

    }.bind(this));
}