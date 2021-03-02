Fishbone Chart
===
## Description

The chart refactor the [d3 fishbone](http://bl.ocks.org/bollwyvl/9239214) and adds some features.

* depth setting
* drill down and up
* resize automatically
* data model

## A Simple Example

JavaScript
```javascript
// 1. chart
let chart = uia.fishbone.chart("fishbone1", "80%", "50%")
    .depth(2);

// 2. data model
var quality = uia.fishbone.data("Quality");

var machine = quality
    .add("Machine")
        .leaf("Mill")
        .leaf("Mixer")
        .leaf("Metal Lathe")

var method = quality
    .add("Method");

var material = quality
    .add("Material");
material
    .leaf("Masonite")
    .add("Marscapone")
        .leaf("Malty")
        .add("Minty")
            .leaf("spearMint")
            .leaf("pepperMint");

var mainPower = quality
    .add("Main Power")
        .leaf("Manager")
        .leaf("Master's Student")
        .leaf("Magician")
        .leaf("Miner");
mainPower.add("Magister")
            .leaf("Malpractice");
mainPower.add("Massage Artist")
    .leaf("Masseuse")
    .leaf("Masseur");

var measurement = quality
    .add("Measurement")
        .leaf("Malleability");

var milieu = quality
    .add("Milieu")
    .leaf("Marine");

// 3. bind to chart
quality.build(chart);

```
HTML
```html
<div id="fishbone1"></div>
```

Quality Overview
* click the `Main Power` to show more information.

![Top Level](iamges/../images/example1.png)

Main Power detail

![Main Power Detail](iamges/../images/example2.png)


## References

d3 fishbone (http://bl.ocks.org/bollwyvl/9239214)