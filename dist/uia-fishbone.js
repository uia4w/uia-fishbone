(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.uia = global.uia || {}, global.uia.fishbone = global.uia.fishbone || {})));
}(this, (function (exports) { 'use strict';

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

    function _linkDistance(d) {
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

    function _tick (e) {
        if(!this._svg || !this._svgNodes || !this._svgLinks) {
            return;
        }

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
            });
    }

    function values(values) {
        return new Values(values);
    }

    function Values(values) {
        this._values = values;
    }

    Values.prototype.values = function(values) {
        this._values = values;
        return this;
    };

    Values.prototype.select = function(index) {
        if(index < 0) {
            return this._values[0];
        }
        if(index >= this._values.length) {
            return this._values[this.values.length - 1];
        }
        return this._values[index];
    };

    /**
     * Creates a new diagram.
     * 
     * @param id The id.
     * @param w The width.
     * @param h The height.
     */
    function diagram3 (id, w, h) {
        return new Fishbone(id, w, h);
    }

    /**
     * @constructor
     * 
     * @param id The id.
     * @param w The width.
     * @param h The height.
     */
    function Fishbone(id, w = "100%", h = "600") {
        // container
        this._id = id;
        this._backbone = 1;
        // container: size
        d3.select("#" + this._id)
            .style("width", w)
            .style("height", h);
        // container: resize
        d3.select(window).on('resize', function() {
            this.refreshDiagram();
        }.bind(this)); 

        // svg
        this._svg = d3.select("#" + this._id)
            .append("svg")
            .style("width", "100%")
            .style("height", "100%");
        var defs = this._svg.selectAll("defs").data([1]);
        defs.enter().append("defs");
        // svg: arrows
        defs.selectAll("marker#arrow")
            .data([1])
            .enter()
            .append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 10)
            .attr("refY", 0)
            .attr("markerWidth", 10)
            .attr("markerHeight", 10)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5");

        this._svgRoot = undefined;
        this._svgNodes = undefined;
        this._svgLinks = undefined;

        this._margin = 50;
        this._nodes = [];
        this._links = [];
        this._force = undefined;
        this._dataset = {};
        this._depth = 2;
        this._maxBranches = 0;
        this._drillEnabled = true;

        this._event_drilled = undefined;
        this._event_node_clicked = undefined;
    }

    Fishbone.prototype.drilled = function(f) {
        this._event_drilled = f.bind(this);
        return this;
    };

    Fishbone.prototype.nodeClicked = function(f) {
        this._event_node_clicked = f.bind(this);
        return this;
    };
    /**
     * Dataset.
     * @param dataset {FishboneData} The dataset.
     */
    Fishbone.prototype.dataset = function (dataset) {
        this._backbone = 1;
        if (!dataset) {
            return this._dataset;
        } else {
            this._dataset = dataset;
            this.draw();
            return this;
        }
    };

    /**
     * Returns the ribs.
     * 
     * @returns The ribs.
     */
    Fishbone.prototype.ribs = function () {
        let result = [];
        let d = this._dataset[this._backbone];
        if (d) {
            d.children.forEach(function(c) {
                result.push({
                    "id": c.key,
                    "name": c.name,
                    "showed": c.showed
                });
            });
        }
        return result;
    };

    /**
     * Accessor of max branches.
     * 
     * @param drillEnabled {boolean} Drill down / up enabled.
     */
    Fishbone.prototype.drillEnabled = function (drillEnabled) {
        if (arguments.length === 0) {
            return this._drillEnabled;
        } else {
            this._drillEnabled = drillEnabled;
            return this;
        }
    };

    /**
     * Accessor of max branches.
     * 
     * @param maxBranches {number} The max branches.
     */
    Fishbone.prototype.maxBranches = function (maxBranches) {
        if (arguments.length === 0) {
            return this._maxBranches;
        } else {
            this._maxBranches = maxBranches;
            this.refreshDiagram();
            return this;
        }
    };


    /**
     * Accessor of width.
     * 
     * @param width {string} width
     */
    Fishbone.prototype.width = function (width) {
        let div = d3.select("#" + this._id);
        if (arguments.length === 0) {
            return div.style("width");
        } else {
            div.style("width", width);
            this.refreshDiagram();
            return this;
        }
    };

    /**
     * Accessor of the height.
     * @param height {string} The height.
     */
    Fishbone.prototype.height = function (height) {
        let div = d3.select("#" + this._id);
        if (arguments.length === 0) {
            return div.style("height");
        } else {
            div.style("height", height);
            this.refreshDiagram();
            return this;
        }
    };

    /**
     * 
     * @param depth {number}
     */
    Fishbone.prototype.depth = function (depth) {
        if (arguments.length === 0) {
            return this._depth;
        } else {
            this._depth = depth;
            this.refreshDiagram();
            return this;
        }
    };

    /**
     * 
     * @param margin 
     */
    Fishbone.prototype.margin = function (margin) {
        if (arguments.length === 0) {
            return this._margin;
        } else {
            this._margin = margin;
            this.refreshDiagram();
            return this;
        }
    };

    /**
     * Shows a branch or not.
     * @param id The branch id.
     * @param showed True if the branch is showed.
     * @param refresh 
     */
    Fishbone.prototype.showBranch = function (id, showed, redraw = true) {
        let d = this._dataset[id];
        if (d) {
            d.showed = showed;
            if(redraw) {
                this.draw(this._backbone);
            }
        }
        return this;
    };

    /**
     * Draw the diagram. 
     * 
     * @param backbone The backbone id.
     */
    Fishbone.prototype.draw = function (backbone = 1) {
        this._backbone = backbone;
        let data = this._dataset[backbone];
        if(!data) {
            return;
        }
        this._links = [];
        this._nodes = [];
        this._svg.datum(data.charting(this._maxBranches));

        buildNodes.call(this, this._svg.datum());

        let fontSizes = values([ "2em", "1.5em", "1em", ".9em" ]);
        let fills = values([ "#000", "#111", "#444", "#888" ]);
        let stokes = values([ "#000", "#333", "#666" ]);
        let stokeWidths = values([ 2.5, 1, 0.5 ]);

        // svg: link
        this._svg.selectAll(".link").remove();
        this._svgLinks = this._svg.selectAll(".link").data(this._links);
        this._svgLinks.enter()
            .append("line")
            .attr("class", function (d) {
                return "link link-" + d.depth;
            })
            .attr("marker-end", function (d) {
                return d.arrow ? "url(#arrow)" : null;
            })
            .style("stroke", function (d) {
                return stokes.select(d.depth)
            })
            .style("stroke-width", function (d) {
                let w = stokeWidths.select(d.depth);
                return d.source.children.length > 0 ? (w + 0.5) + "px" : w + "px";
            });
        this._svgLinks.exit().remove();

        // svg: node
        this._svg.selectAll(".node").remove();
        this._svgNodes = this._svg.selectAll(".node").data(this._nodes);
        this._svgNodes.enter()
            .append("g")
            .attr("class", function (d) {
                return "node" + (d.root ? " root" : "");
            })
            .append("text")
            .attr("class", function (d) {
                return "label-" + d.depth;
            })
            .attr("text-anchor", function (d) {
                    return !d.depth ? "start" : d.horizontal ? "end" : "middle";
            })
            .attr("dx", function (d) {
                return d.root ? ".2em" : d.horizontal ? "-.2em" : "0em";
            })
            .attr("dy", function (d) {
                return d.horizontal ? ".35em" : d.region === 1 ? "1em" : "-.2em";
            })
            .style("font-size", function (d) {
                return fontSizes.select(d.depth);
            })
            .style("fill", function (d) {
                return fills.select(d.depth);
            })
            .text(function (d) {
                return d.name
            });
        this._svgNodes.exit().remove();

        // svg: node: event
        this._svgNodes
            // .call(this._force.drag)
            .on("click", function (d) {
                if(d.key !== 1 && this._drillEnabled) {
                    this.draw(d.root ? d.owner : d.key); 
                    if (this._event_drilled) {
                        this._event_drilled();
                    }
                }
                if(this._event_node_clicked) {
                    this._event_node_clicked(d);
                }
                // d3.event.stopPropagation();
            }.bind(this));

        this._svgRoot = this._svg.select(".root").node();

        this.refreshDiagram();
    };

    /**
     * Refresh the diagram.
     * 
     */
    Fishbone.prototype.refreshDiagram = function() {
        if(!this._svg) {
            return;
        }

        let rect = d3.select("#" + this._id)
            .node()
            .getBoundingClientRect();

        // v3
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

    function data(name, showed = true) {
        return new FishboneData(name, showed);
    }

    function FishboneData(name, showed) {
        this.name = name;
        this.showed = showed;
        this.children = [];
    }

    FishboneData.prototype.add = function(name, showed = true) {
        let data = new FishboneData(name, showed);
        this.children.push(data);
        return data;
    };

    FishboneData.prototype.leaf = function(name, showed = true) {
        let data = new FishboneData(name, showed);
        this.children.push(data);
        return this;
    };

    FishboneData.prototype.build = function(chart) {
        function toMap(result, data, key, ownerKey) {
            let value = {
                "key": key,
                "owner": ownerKey,
                "name": data.name,
                "showed": data.showed,
                "children": [],
                "charting": function(maxShowed = 0) {
                    return _charting(this, maxShowed, 0);
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

    function _charting(data, maxShowed, depth) {
        let max = Array.isArray(maxShowed) ?
            maxShowed[Math.min(maxShowed.length - 1, depth)] :
            maxShowed;
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
            if(c.showed && (max <= 0 || result.children.length < max)) {
                result.children.push(_charting(c, maxShowed, depth + 1));
            }
        });
        return result;
    }

    exports.data = data;
    exports.diagram = diagram3;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
