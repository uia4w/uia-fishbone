export default function (e) {
    var k = 3 * e.alpha,
        size = this._force.size(),
        width = size[0],
        height = size[1],
        a,
        b;

    this._nodes.forEach(function (d) {
        // handle the middle... could probably store the root width...
        if (d.root) {
            d.x = width - (this._margin + this._svgRoot.getBBox().width);
        }
        if (d.tail) {
            d.x = this._margin;
            d.y = height / 2;
        }

        // put the first-generation items at the top and bottom
        if (d.depth === 1) {
            d.y = d.region === -1 ? this._margin : (height - this._margin);
            d.x -= 10 * k;
        }

        // vertically-oriented tend towards the top and bottom of the page
        if (d.vertical) {
            d.y += k * d.region;
        }

        // everything tends to the left
        if (d.depth) {
            d.x -= k;
        }

        if (d.between) {
            a = d.between[0];
            b = d.between[1];
            d.x = b.x - (b.x - a.x) * (1 + d.childIdx) / (b.maxChildIdx + 1);
            d.y = b.y - (b.y - a.y) * (1 + d.childIdx) / (b.maxChildIdx + 1);
        }
    }.bind(this));

    this._svgNodes
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    this._svgLinks
        .attr("x1", function (d) {
            return d.source.x;
        })
        .attr("y1", function (d) {
            return d.source.y;
        })
        .attr("x2", function (d) {
            return d.target.x;
        })
        .attr("y2", function (d) {
            return d.target.y;
        })
}