(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.uia = global.uia || {}, global.uia.fishbone = global.uia.fishbone || {})));
}(this, (function (exports) { 'use strict';

    function _linkDistance(d) {
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

    function _tick(e) {
        var k = 6 * e.alpha,
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
                d.y = b.y - (b.y - a.y) * (1 + d.childIdx)  / (b.maxChildIdx + 1);
            }
        }.bind(this));

        this._svgNodes
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        this._svgLinks
            .attr({
                x1: function (d) {
                    return d.source.x;
                },
                y1: function (d) {
                    return d.source.y;
                },
                x2: function (d) {
                    return d.target.x;
                },
                y2: function (d) {
                    return d.target.y;
                }
            });
    }

    function chart (id, w, h) {
        return new Fishbone(id, w, h);
    }

    function Fishbone(id, w = "100%", h = "600") {
        // container
        this._id = id;
        // container: size
        d3.select("#" + this._id)
            .style({
                "width": w,
                "height": h
            });
        // container: resize
        d3.select(window).on('resize', function() {
            this.refreshChart();
        }.bind(this)); 

        // svg
        this._svg = d3.select("#" + this._id)
        .append("svg")
        .style({
            "width": "100%", 
            "height": "100%"
        });
        var defs = this._svg.selectAll("defs").data([1]);
        defs.enter().append("defs");
        // svg: arrows
        defs.selectAll("marker#arrow")
            .data([1])
            .enter().append("marker")
            .attr({
                id: "arrow",
                viewBox: "0 -5 10 10",
                refX: 10,
                refY: 0,
                markerWidth: 10,
                markerHeight: 10,
                orient: "auto"
            })
            .append("path")
            .attr({
                d: "M0,-5L10,0L0,5"
            });

        this._svgRoot = undefined;
        this._svgNodes = undefined;
        this._svgLinks = undefined;

        this._margin = 50;
        this._nodes = [];
        this._links = [];
        this._force = undefined;
        this._dataset = {};
        this._depth = 2;
    }

    /**
     * 
     * @param dataset The dataset.
     */
    Fishbone.prototype.dataset = function (dataset) {
        if (!dataset) {
            return this._dataset;
        } else {
            this._dataset = dataset;
            this.draw(1);
            return this;
        }
    };

    /**
     * 
     * @param width 
     */
    Fishbone.prototype.width = function (width) {
        let div = d3.select("#" + this._id);
        if (arguments.length === 0) {
            return div.style("width");
        } else {
            div.style("width", width);
            this.refreshChart();
            return this;
        }
    };

    /**
     * 
     * @param height
     */
    Fishbone.prototype.height = function (height) {
        let div = d3.select("#" + this._id);
        if (arguments.length === 0) {
            return div.style("height");
        } else {
            div.style("height", height);
            this.refreshChart();
            return this;
        }
    };

    /**
     * 
     * @param depth
     */
    Fishbone.prototype.depth = function (depth) {
        if (!arguments.length) {
            return this._depth;
        } else {
            this._depth = depth;
            this.refreshChart();
            return this;
        }
    };

    /**
     * 
     * @param margin 
     */
    Fishbone.prototype.margin = function (margin) {
        if (!arguments.length) {
            return this._margin;
        } else {
            this._margin = margin;
            this.refreshChart();
            return this;
        }
    };

    Fishbone.prototype.draw = function (key = 1) {
        if(!this._svg) {
            this._svg = d3.select("#" + this._id)
                .append("svg")
                .style({
                    "width": "100%", 
                    "height": "100%"
                });

            var defs = this._svg.selectAll("defs").data([1]);
            defs.enter().append("defs");
            // create the arrows
            defs.selectAll("marker#arrow")
                .data([1])
                .enter().append("marker")
                .attr({
                    id: "arrow",
                    viewBox: "0 -5 10 10",
                    refX: 10,
                    refY: 0,
                    markerWidth: 10,
                    markerHeight: 10,
                    orient: "auto"
                })
                .append("path")
                .attr({
                    d: "M0,-5L10,0L0,5"
                });
        }

        let data = this._dataset[key];
        if(!data) {
            return;
        }
        this._links = [];
        this._nodes = [];
        this._svg.datum(data.charting());

        this.buildNodes(this._svg.datum());

        // svg: link
        this._svg.selectAll(".link").remove();
        this._svgLinks = this._svg.selectAll(".link").data(this._links);
        this._svgLinks.enter()
            .append("line")
            .attr({
                "class": function (d) {
                    return "link link-" + d.depth;
                },
                "marker-end": function (d) {
                    return d.arrow ? "url(#arrow)" : null;
                }
            });
        this._svgLinks.exit().remove();

        // svg: node
        this._svg.selectAll(".node").remove();
        this._svgNodes = this._svg.selectAll(".node").data(this._nodes);
        this._svgNodes.enter()
            .append("g")
            .attr({
                "class": function (d) {
                    return "node" + (d.root ? " root" : "");
                }
            })
            .append("text")
            .attr({
                "class": function (d) {
                    return "label-" + d.depth;
                },
                "text-anchor": function (d) {
                    return !d.depth ? "start" : d.horizontal ? "end" : "middle";
                },
                "dx": function (d) {
                    return d.root ? ".2em" : d.horizontal ? "-.2em" : "0em";
                },
                "dy": function (d) {
                    return d.horizontal ? ".35em" : d.region === 1 ? "1em" : "-.2em";
                }
            })
            .text(function (d) {
                return d.name
            });
        this._svgNodes.exit().remove();

        // svg: node: event
        this._svgNodes
            // .call(this._force.drag)
            .on("click", function (d) {
                this.draw(d.root ? d.owner : d.key); 
                // d3.event.stopPropagation();
            }.bind(this));

        this._svgRoot = this._svg.select(".root").node();

        this.refreshChart();
    };

    Fishbone.prototype.refreshChart = function() {
        if(!this._svg) {
            return;
        }

        let rect = d3.select("#" + this._id)
            .node()
            .getBoundingClientRect();

        this._force = d3.layout.force()
            .gravity(0)
            .size([rect.width, rect.height])
            .linkDistance(_linkDistance.bind(this))
            .chargeDistance([10])
            .on("tick", _tick.bind(this));

        this._force
            .nodes(this._nodes)
            .links(this._links);

        this._force.start();
    };

    Fishbone.prototype.buildNodes = function(node) {
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
                tail: true
            });
            between = [prev, node];
            nodeLinks[0].source = prev;
            nodeLinks[0].target = node;
            node.horizontal = true;
            node.vertical = false;
            node.depth = 0;
            node.root = true;
            node.totalLinks = [];
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
                childLinkCount = this.buildNodes(child);
                node.linkCount += childLinkCount;
                between[1].totalLinks.push(childLinkCount);
            }.bind(this));
        }

        between[1].maxChildIdx = cx;

        Array.prototype.unshift.apply(this._links, nodeLinks);

        // the number of links created byt this node and its children...
        // TODO: use `linkCount` and/instead of `childIdx` for spacing
        return node.linkCount;
    };

    function data(name) {
        return new FishboneData(name);
    }

    function FishboneData(name) {
        this.name = name;
        this.children = [];
    }

    FishboneData.prototype.add = function(name) {
        let data = new FishboneData(name);
        this.children.push(data);
        return data;
    };

    FishboneData.prototype.leaf = function(name) {
        let data = new FishboneData(name);
        this.children.push(data);
        return this;
    };

    FishboneData.prototype.build = function(chart) {
        function toMap(result, data, key, ownerKey) {
            let value = {
                "key": key,
                "owner": ownerKey,
                "name": data.name,
                "children": [],
                "charting": function() {
                    return _clone(this);
                }
            };
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
    };

    function _clone(data) {
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
            result.children.push(_clone(c));
        });
        return result;
    }

    exports.chart = chart;
    exports.data = data;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
