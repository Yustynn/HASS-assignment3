// a lot of this is (very) heavily modified from https://observablehq.com/@d3/bar-chart

const [WIDTH, HEIGHT] = [1000, 750]
const MARGIN = {
    left: 30,
    right: 30,
    top: 30,
    bottom: 150,
}

const state = {}

async function main() {
    const data = await fetch('./data.json').then(r => r.json())
    const flatTypes = Object.keys(data).sort()
    state.flatType = flatTypes[0] // default to first entry

    setupElementsAndPutInState()
    makeButtons(flatTypes, data)
    updateViz(data)
}

function setupElementsAndPutInState() {
    const svg = d3.select("#svg-container").append('svg')
        .attr("width", WIDTH)
        .attr("height", HEIGHT)
        .attr("viewBox", [0, 0, WIDTH, HEIGHT])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    const xAxis = svg.append("g")
        .classed('x-axis', true)
        .attr("transform", `translate(0,${HEIGHT - MARGIN.bottom})`)

    const yAxis = svg.append("g")
        .classed('y-axis', true)
        .attr("transform", `translate(${MARGIN.left},0)`)

    const bars = svg.append("g")
        .classed('bars', true)
        .attr('fill', 'skyblue')

    state['svg'] = svg
    state['bars'] = bars
    state['xAxis'] = xAxis
    state['yAxis'] = yAxis
}

function makeButtons(flatTypes, data) {
    d3.select('#buttons').selectAll('button')
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

    const t = d3.transition().duration(1200)

    state['yAxis'].selectAll('.tick').remove()

    state['yAxis']
        .attr("transform", `translate(${MARGIN.left},0)`)
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", WIDTH - MARGIN.left - MARGIN.right)
            .attr("stroke-opacity", 0.1))

    const bar = state['bars'].selectAll("rect")
        .data(data, d => d.town)
        .join(
            enter => {
                console.log('enter', enter.data())
                enter.append("rect")
                    .attr('fill', d => d.value < 0 ? 'red' : 'skyblue')
                    .attr("x", d => xScale(d.town))
                    .attr("y", d => yScale(d.value))
                    .attr("height", d => yScale.range()[0] - yScale(d.value))
                    .attr("width", xScale.bandwidth())
                    .attr('opacity', 0)
                    .transition(t)
                    .attr('opacity', 1)

            },
            update => {
                console.log('update', update.data())
                update
                    .transition(t)
                    .attr("x", d => xScale(d.town))
                    .attr("y", d => yScale(d.value))
                    .attr("height", d => yScale.range()[0] - yScale(d.value))
                    .attr("width", xScale.bandwidth())
                    .attr('fill', d => d.value < 0 ? 'red' : 'skyblue')
            },
            exit => {
                console.log('exit', exit.data())
                exit
                    .attr('opacity', 1)
                    .transition(t)
                    .attr('opacity', 0)
                    .attr('transform', 'translate(100, 0)')
                    .remove()
            },
        )

    // stolen and heavily modified from https://observablehq.com/@shapiromatron/rotated-axis-labels
    state['xAxis']
        .call(xAxis)
        .selectAll("text")
        .attr('y', -5)
        .attr("x", -15)
        .attr("transform", `rotate(-90)`)
        .style("text-anchor", 'end');
}

main()
