const [WIDTH, HEIGHT] = [1000, 500]
const MARGIN = {
    left: 30,
    right: 30,
    top: 30,
    bottom: 30,
}

const state = {}

async function main() {
    const data = await fetch('./data.json').then(r => r.json())
    const flatTypes = Object.keys(data).sort()
    state.flatType = flatTypes[0] // default to first entry

    setupSvg()
    makeButtons(flatTypes, data)
    updateViz(data)
}

function setupSvg() {
    const svg = d3.select("#svg-container").append('svg')
        .attr("width", WIDTH)
        .attr("height", HEIGHT)
        .attr("viewBox", [0, 0, WIDTH, HEIGHT])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
}

function makeButtons(flatTypes, data) {
    d3.select('body')
        .append('div')
        .select('button')
        .data(flatTypes)
        .enter()
            .append('button')
            .text(ft => ft)
            .on('click', (_, ft) => {
                state.flatType = ft
                updateViz(data)
            })
}

function updateViz(rawData) {
    const dataSel = rawData[state.flatType]
    const data = []
    for (const town in dataSel) {
        if (dataSel[town]) data.push({ town, value: (dataSel[town] - 1)*100 })
    }
    data.sort((a, b) => a.value - b.value)

    const xRange = [MARGIN.left, WIDTH - MARGIN.right]
    const yRange = [HEIGHT - MARGIN.bottom, MARGIN.top] // inverted so that 0 at bottom
    const xPadding = 0.1
    const yPadding = 5
    const color = 'skyblue'
    const title = 'Percentage more cost of high floor vs low floor flat, by town'

    // Construct scales, axes, and formats.
    const xDomain = new d3.InternSet(data.map(d => d.town))
    const yDomain = new d3.InternSet(data.map(d => d.value))

    const xScale = d3.scaleBand(xDomain, xRange).padding(xPadding);
    const yScale = d3.scaleLinear([Math.min(...yDomain)-yPadding, Math.max(...yDomain)+yPadding], yRange);
    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
    const yAxis = d3.axisLeft(yScale).ticks(HEIGHT / 40);

    document.xScale = xScale
    document.yScale = yScale

    const svg = d3.select('svg')

    svg.append("g")
        .classed('y-axis', true)
        .attr("transform", `translate(${MARGIN.left},0)`)
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", WIDTH - MARGIN.left - MARGIN.right)
            .attr("stroke-opacity", 0.1))
        // .call(g => g.append("text")
        //     .attr("x", -marginLeft)
        //     .attr("y", 10)
        //     .attr("fill", "currentColor")
        //     .attr("text-anchor", "start")
        //     .text(yLabel));

    const bar = svg.append("g")
        .classed('bars', true)
        .attr("fill", color)
        .selectAll("rect")
        .data(data, d => d.town)
        .join("rect")
            .attr("x", d => xScale(d.town))
            .attr("y", d => yScale(d.value))
            .attr("height", d => yScale.range()[0] - yScale(d.value))
            .attr("width", xScale.bandwidth());

    if (title) bar.append("title")
        .text(title);

    svg.append("g")
        .classed('x-axis', true)
        .attr("transform", `translate(0,${HEIGHT - MARGIN.bottom})`)
        .call(xAxis);



    // d3.select('#bars rect')
    //     .data(data)
    //     .enter()
    //     .append('rect')
    //     .attr('fill', 'blue')
    //     .attr('x', (_, i) => i * 10)
    //     .attr('y', HEIGHT - 30)
    //     .attr('width', 30)
    //     .attr('height', ({ value }) => value * 50)
}

main()
