// 1. chart
let diagram = uia.fishbone.diagram("fishbone1");

// 2. bones
var quality1 = uia.fishbone.data("Quality #1");
quality1.add("Machine 设备", 7)
    .leaf("BPVD", 3)
    .leaf("BSPN", 4);
quality1.add("Method 方法", 24)
    .leaf("start", true, 15)
    .leaf("stop", true, 9)
quality1.add("Material 物料", 5)
    .add("Box", 5)
    .leaf("A", 3)
    .leaf("B", 2);

var quality2 = uia.fishbone.data("Quality #2");
quality2.add("Machine 设备", 1)
    .leaf("BPVD", 1);
quality2.add("Method 方法", 24)
    .leaf("begin", true, 10)
    .leaf("processing", true, 5)
    .leaf("end", true, 9)
quality2.add("Material 物料", 5)
    .add("Box", 12)
    .leaf("X", 3)
    .leaf("Y", 9);

// 3. load
diagram.load(quality1);

function change1() {
    diagram.width("100%").height("400px").load(quality1);
}

function change2() {
    diagram.width("1100px").height("500px").load(quality2);
}