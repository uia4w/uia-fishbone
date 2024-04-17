// 1. chart
let diagram = uia.fishbone.diagram("fishbone1", "700px", "600px")
    .drilled(function(diagram, data) {
        updateRibs(diagram);
    })
    .nodeClicked(function(diagram, data) {
        alert(data.name);
    })

// 2. bones
var quality = uia.fishbone.data("Quality 品质");
var machine = quality
    .add("Machine 设备", 7)
    .leaf("BPVD", 3)
    .leaf("BSPN", 4);

var method = quality
    .add("Method 方法", 24)
    .leaf("start", true, 15)
    .leaf("stop", true, 9)

var material = quality
    .add("Material 物料", 5)
    .add("Box", 5)
    .leaf("A", 3)
    .leaf("B", 2);

// 3. load
diagram.load(quality);

function updateRibs(diagram) {
    let ribs = diagram.ribs();
    d3.select("#ribs")
        .selectAll("div")
        .data([])
        .exit()
        .remove();

    let checks = d3.select("#ribs")
        .selectAll("div")
        .data(ribs)
        .enter()
        .append("div")
    checks.append("input")
        .attr("type", "checkbox")
        .attr("name", function(d) {
            return d.name;
        })
        .attr("value", function(d) {
            return d.id;
        })
        .property("checked", function(d) {
            return d.visible;
        })
        .on("change", function(d) {
            diagram.branchVisible(this.value, this.checked);
        });
    checks.append("label")
        .text(function(d) {
            return d.name;
        });
};

updateRibs(diagram);