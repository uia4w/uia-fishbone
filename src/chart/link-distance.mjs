export default function(d) {
    if(d.depth == 0) {
        return 200;
    } else {
        if(d.depth === (this._depth - 1) || !d.source.children || d.source.children.length === 0) {
            return 10;
        } else {
            return 30 * d.source.children.length;
        }
    }
}
