export default function(d) {
    if(d.depth == 0) {
        return 0;
    } else {
        if(!d.source.children || d.source.children.length === 0) {
            return 15;
        } else {
            return 30 * d.source.children.length;
        }
    }
}
