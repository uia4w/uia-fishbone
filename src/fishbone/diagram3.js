import { default as data } from "./data";
import { default as buildNodes } from "./diagram3/buildNodes";
import { default as layout } from "./diagram3/layout";
import { default as values } from "./values";

/**
 * Creates a new diagram.
 * 
 * @param id The id.
 * @param w The width.
 * @param h The height.
 */
export default function(id, w, h) {
    return new Fishbone(id, w, h);
}

/**
 * @constructor
 * 
 * @param id The id.
 * @param w The width.
 * @param h The height.
 */
function Fishbone(id, w = "100%", h = "400px") {
    // container
    this._id = id;
    this._displayValue = true;
    this._selectedIdx = 1;
    this._margin = 50;
    this._nodes = [];
    this._links = [];
    this._dataset = {};
    this._depth = 2;
    this._width = w;
    this._height = h;
    this._maxBranches = [8, 4, 4];
    this._drillEnabled = true;

    this._event_loaded = undefined;
    this._event_drilled = undefined;
    this._event_node_clicked = undefined;

    // container: size
    d3.select("#" + this._id)
        .style("width", this._width)
        .style("height", this._height);

    // svg
    this._svg = d3.select("#" + this._id)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%");
    this._svgNodes = this._svg.append("g")
        .attr("class", "nodes");
    this._svgLinks = this._svg.append("g")
        .attr("class", "links");
    this._svgNav = this._svg.append("g")
        .attr("class", "back")
        .append("polygon")
        .attr("points", "0,0  -16,10, -16,-10")
        .attr("fill", "black")
        .style("cursor", "hand");
    this._svgNav.on("click", () => {
        var data = this.backbone();
        if (data.owner > 0 && this._drillEnabled) {
            var selected = this._dataset[data.owner];
            this.draw(selected.key);
            if (this._event_drilled) {
                this._event_drilled(this, selected);
            }
            this._svgNav.attr("fill", selected.owner > 0 ? "black" : "#cccccc");
            if (this._event_node_clicked) {
                this._event_node_clicked(this, selected);
            }

        }
    });

    var defs = this._svg.selectAll("defs").data([1]);
    defs.enter().append("defs");
    // svg: arrows
    defs.selectAll("marker#arrow")
        .data([1])
        .enter()
        .append("marker")
        .attr("id", "arrow")
        .attr("orient", "auto")
        .attr("markerWidth", 10)
        .attr("markerHeight", 10)
        .attr("refX", 10)
        .attr("refY", 0)
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "black");

    this._sortF = function(a, b) {
        var c = b.value - a.value;
        return c == 0 ? a.name.localeCompare(b) : c;
    }

    addEventListener(
        "resize", (function() {
            this.refresh();
        }).bind(this));

}

Fishbone.prototype.loaded = function(f) {
    this._event_loaded = f;
    return this;
}

Fishbone.prototype.drilled = function(f) {
    this._event_drilled = f;
    return this;
}

Fishbone.prototype.nodeClicked = function(f) {
    this._event_node_clicked = f;
    return this;
}

/**
 * Loads the bone data and rerender the diagram.
 * 
 * @param backbone {FishboneData} The bone data.
 */
Fishbone.prototype.load = function(backbone) {
    this._selectedIdx = 1;
    this._dataset = backbone ? backbone.dataset() : data("No Data", 0).dataset();
    this.draw();
    if (this._event_loaded) {
        this._event_loaded(this, this._dataset[1]);
    }
}

Fishbone.prototype.backbone = function() {
    return this._dataset[this._selectedIdx];
}

/**
 * Returns the ribs.
 * 
 * @returns The ribs.
 */
Fishbone.prototype.ribs = function() {
    let result = [];
    let d = this._dataset[this._selectedIdx];
    if (d) {
        d.children.forEach(function(c) {
            result.push({
                "id": c.key,
                "name": c.name,
                "visible": c.visible,
                "group": c.group,
                "value": c.value,
                "obj": c.obj
            })
        });
    }
    return result;
}

/**
 * Accessor of max branches.
 * 
 * @param drillEnabled {boolean} Drill down / up enabled.
 */
Fishbone.prototype.drillEnabled = function(drillEnabled) {
    if (arguments.length === 0) {
        return this._drillEnabled;
    } else {
        this._drillEnabled = drillEnabled;
        return this;
    }
}

/**
 * Accessor of max branches.
 * 
 * @param maxBranches {number} The max branches.
 */
Fishbone.prototype.maxBranches = function(maxBranches) {
    if (arguments.length === 0) {
        return this._maxBranches;
    } else {
        this._maxBranches = maxBranches;
        this.draw(this._selectedIdx);
        return this;
    }
}

/**
 * Accessor of width.
 * 
 * @param width {string} width
 */
Fishbone.prototype.width = function(width) {
    let div = d3.select("#" + this._id);
    if (arguments.length === 0) {
        return div.style("width");
    } else {
        this._width = width;
        d3.select("#" + this._id).style("width", this._width);
        this.refresh();
        return this;
    }
}

/**
 * Accessor of the height.
 * @param height {string} The height.
 */
Fishbone.prototype.height = function(height) {
    if (arguments.length === 0) {
        return this._height;
    } else {
        this._height = height;
        d3.select("#" + this._id).style("height", this._height);
        this.refresh();
        return this;
    }
}

/**
 * 
 * @param margin 
 */
Fishbone.prototype.margin = function(margin) {
    if (arguments.length === 0) {
        return this._margin;
    } else {
        this._margin = margin;
        this.refresh();
        return this;
    }
}

/**
 * Shows a branch or not.
 * @param id {string} The branch id.
 * @param visible {boolean} True if the branch is visible or not.
 * @param redraw 
 */
Fishbone.prototype.branchVisible = function(id, visible, redraw = true) {
    let data = this._dataset[id];
    if (data) {
        data.visible = visible;
        if (redraw) {
            this.draw(this._selectedIdx);
        }
    }
    return this;
}

Fishbone.prototype.path = function(id, sortF) {
    let data = this._dataset[id];
    if (data == null) {
        return [];
    }
    if (!sortF) {
        sortF = (a, b) => a.name.localeCompare(b.name);
    }

    data.children.sort(sortF);
    var result = [data];
    while ((data = this._dataset[data.owner]) != null) {
        data.children.sort(sortF);
        result.unshift(data);
    }
    return result;
}

/**
 * Draw the diagram. 
 * 
 * @param selectedIdx {int} The bone id.
 */
Fishbone.prototype.draw = function(selectedIdx = 1) {
    let data = this._dataset[selectedIdx];
    if (!data || (data.key != 1 && data.children.length == 0)) {
        return false;
    }

    this._selectedIdx = selectedIdx;
    this._links = [];
    this._nodes = [];

    var model = data.charting(this._maxBranches, this._sortF);

    var div = d3.select("#" + this._id).node();
    if (!div) {
        return false;
    }
    let rect = div.getBoundingClientRect();

    // build this._nodes, this._links
    buildNodes.call(this, model);
    layout.call(this, rect.width, rect.height);

    let fontSizes = values(["1.0em", ".9em", ".8em", ".6em"]);
    let fills = values(["#00000", "#994d33", "#998033", "#809933"]);
    let stokes = values(["#000000", "#994d33", "#998033", "#809933"]);
    let stokeWidths = values([5.0, 1, 0.5]);

    var self = this;
    // svg: link
    this._svgLinks.selectAll("line").data([]).exit().remove();
    this._svgLinks.selectAll("line").data(this._links)
        .enter()
        .append("line")
        .attr("x1", link => link.source.x)
        .attr("y1", link => link.source.y)
        .attr("x2", link => link.target.x)
        .attr("y2", link => link.target.y)
        .attr("class", link => "link link-" + link.depth)
        .attr("marker-end", link => link.target.root ? null : "url(#arrow)")
        .style("stroke", link => stokes.select(link.depth))
        .style("stroke-width", function(link) {
            let w = stokeWidths.select(link.depth);
            return link.source.children.length > 0 ? (w + 0.5) + "px" : w + "px";
        });

    // svg: node
    var dv = this._displayValue;
    this._svgNodes.selectAll("text").data([]).exit().remove();
    this._svgNodes.selectAll("text").data(this._nodes)
        .enter()
        .append("text")
        .attr("class", d => "label label-" + d.depth)
        .attr("text-anchor", d => !d.depth ? "start" : d.horizontal ? "end" : "middle")
        .attr("transform", d => "translate(" + d.x + "," + d.y + ")")
        .attr("dx", d => d.root ? ".2em" : d.horizontal ? "-.2em" : "0em")
        .attr("dy", d => d.horizontal ? ".35em" : d.region === 1 ? "1em" : "-.2em")
        .style("font-family", "Lucida Console")
        .style("font-size", d => fontSizes.select(d.depth))
        .style("fill", d => fills.select(d.depth))
        .style("cursor", "hand")
        .text(d => d.name ? (dv ? d.name + "(" + d.value + ")" : d.name) : undefined)
        .on("click", function(e, data) {
            if (self._drillEnabled) {
                if (!data.root) {
                    self.draw(data.key);
                    if (self._event_drilled) {
                        self._event_drilled(self, data);
                    }
                    self._svgNav.attr("fill", self.backbone().owner > 0 ? "black" : "#cccccc");
                }
            }
            if (self._event_node_clicked) {
                self._event_node_clicked(self, data);
            }
        });

    // svg: navigator
    this._svgNav
        .attr("transform", "translate(" + (rect.width - this._margin) + "," + rect.height / 2 + ")")
        .attr("fill", data.owner > 0 ? "black" : "#cccccc");

    return true;
}

/**
 * Refresh the diagram.
 * 
 */
Fishbone.prototype.refresh = function() {
    if (!this._svg) {
        return;
    }

    var div = d3.select("#" + this._id).node();
    if (!div) {
        return;
    }
    let rect = div.getBoundingClientRect();
    layout.call(this, rect.width, rect.height);

    // svg: link
    this._svgLinks.selectAll("line")
        .data(this._links)
        .attr("x1", link => link.source.x)
        .attr("y1", link => link.source.y)
        .attr("x2", link => link.target.x)
        .attr("y2", link => link.target.y)

    // svg: node
    this._svgNodes.selectAll("text")
        .data(this._nodes)
        .attr("transform", node => "translate(" + node.x + "," + node.y + ")");

    // svg: navigator
    this._svgNav.attr("transform", "translate(" + (rect.width - this._margin) + "," + rect.height / 2 + ")");
}