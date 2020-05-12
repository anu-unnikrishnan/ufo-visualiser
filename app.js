function ready(geo, userData, hexSize) {
  // Container SVG.
  const margin = { top: 20, right: 30, bottom: 30, left: 30 },
    width = 900 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  const svg = d3
    .select('#container')
    .append('svg')
    .attr('width', width + margin.left + margin.top)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left} ${margin.top})`);

  // Projection and path.
  const projection = d3.geoAlbers().fitSize([width, height], geo);
  const geoPath = d3.geoPath().projection(projection);

  // Prep user data.
  userData.forEach(site => {
    const coords = projection([+site.lng, +site.lat]);
    site.x = coords[0];
    site.y = coords[1];
  });

  // Hexgrid generator.
  const hexgrid = d3.hexgrid()
    .extent([width, height])
    .geography(geo)
    .pathGenerator(geoPath)
    .projection(projection)
    .hexRadius(hexSize);

  // Hexgrid instance.
  const hex = hexgrid(userData);

  // Create exponential colorScale.
  const scaleExponent = 15; //increase to make darker 
  const colourScale = d3.scaleSequential(t => {
      var tNew = Math.pow(t, scaleExponent);
      return d3.interpolateCool(tNew);
    })
    .domain([...hex.grid.extentPointDensity].reverse());

  // Draw the hexes.
  svg
    .append('g')
    .selectAll('.hex')
    .data(hex.grid.layout)
    .enter()
    .append('path')
    .attr('class', 'hex')
    .attr('d', hex.hexagon())
    .attr('transform', d => `translate(${d.x} ${d.y})`)
    .style('fill', d => (!d.pointDensity ? '#fff' : colourScale(d.pointDensity)))
    .style('stroke', '#F7E76E')
    .style('stroke-opacity', 0.5);

  // Tooltip.
  const formatNum = d3.format('.2');
  const tip = d3.select('.tooltip');
  d3.selectAll('.hex')
    .on('mouseover', mouseover)
    .on('mouseout', mouseout);

  // Handler.
  function mouseover(d) {
    tip
      .style('opacity', 1)
      .style('top', `${d3.event.pageY - 20}px`)
      .style('left', `${d3.event.pageX + 10}px`);

    tip.html(`${d.datapoints} UFOs spotted<br>`);
  }

  function mouseout() {
    tip.style('opacity', 0);
  }

  // Legend...

  // Values.
  const legendScale = 8 / hex.radius();

  // Get legend data.
  const equalRange = n => d3.range(n).map(d => d / (n - 1));

  const densityDist = hex.grid.layout
    .map(d => d.pointDensity)
    .sort(d3.ascending)
    .filter(d => d);

  const splitRange = equalRange(10);
  const indeces = splitRange.map(d => Math.floor(d * (densityDist.length - 1)));
  const densityPick = indeces.map(d => densityDist[d]);

  const legendData = densityPick.map(d => ({
    density: d,
    colour: colourScale(d)
  }));

  // Build legend.
  const gLegend = svg
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(0, ${height})`);

  gLegend
    .append('text')
    .text(`--- more UFOs -->`)
    .attr('fill', '#555')
    .attr('font-family', 'courier')
    .attr('font-size', '0.8rem')
    .attr('font-weight', 'bold')
    .attr('dy', 19)
    .attr('dx', -4);

  const legend = gLegend
    .selectAll('.legend__key')
    .data(legendData)
    .enter()
    .append('g')
    .attr('class', 'legend__key')
    .attr('transform', (d, i) => `translate(${i * Math.sqrt(3) * hexgrid.hexRadius() * legendScale}, 0)`);

  legend
    .append('g')
    .attr('transform', `scale(${legendScale})`)
    .append('path')
    .attr('d', hex.hexagon())
    .style('fill', d => d.colour)
    .style('stroke', '#F7E76E')
    .style('stroke-opacity', 0.5);
}

function prepareData(hexSize){ 

  //load map of USA
  const geoData = d3.json('https://raw.githubusercontent.com/larsvers/map-store/master/us_mainland_geo.json');

  //load map of UFO sightings 
  const points = d3.json('ufousadata.json');

  Promise.all([geoData, points]).then(res => {
    let [geoData, userData] = res;
    ready(geoData, userData, hexSize);
  });
}

//size of hexagons 
hexSize = 10;
prepareData(hexSize);