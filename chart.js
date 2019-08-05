
const cardHeaders = {
    'CHE_US$': 'Current Health Expenditure (CHE) Data by country',
    'OOP_PPP': 'Out-of-pocket expenditure (OOP) per capita in PPP Int$ Data by country',
};

const cardTitleDefault = 'World';

let selected_expenditure_data = null;

async function updateExpenditure() {
    const csv = getSelectedExpenditure();
    await displayChart(csv);
}

function updateCountry() {
    selectedCountry = document.getElementById("country").value;
    const countries = d3.selectAll("path." + selectedCountry.replace(/\s/g, '_'));
    countries.classed('highlight', true);
}

async function displayChart(csv) {
    // clear svg
    document.querySelector('#chart').innerHTML = '';

    // add active class to selected item
    updateNavItemClass(csv);
    expenditureBy = document.getElementById("expenditureBy").value;

    // fetch data
    csv = csv + '_' + expenditureBy + ".csv";
    const health_expenditure_data = await d3.csv(csv);

    // display chart
    const width = 925;
    const height = 550;

    const margin = 50;
    const startYear = 2000;
    const endYear = 2016;
    const years = d3.range(startYear, endYear);

    let minExpenditure = 1;
    let maxExpenditure = 10000;

    let worldExpenditureStartYear = 0;
    let worldExpenditureEndYear = 0;

    const expenditure_data = [];
    // loop through data    
    health_expenditure_data.forEach((data, idx) => {

        const pathData = [];
        years.forEach(year => {
            const expenditure = (+data[year]);
            if (expenditure) {
                pathData.push({ x: year, y: expenditure });
            }
            if (year === 2000) {
                worldExpenditureStartYear += expenditure;
            }
            if (year === 2015) {
                worldExpenditureEndYear += expenditure;
            }

            if (maxExpenditure < expenditure) {
                maxExpenditure = expenditure;
            }

            if (minExpenditure > expenditure) {
                minExpenditure = expenditure;
            }
        });

        expenditure_data.push({
            pathData: pathData,
            country: data.Country
        });
    });

    if (minExpenditure < 1) {
        minExpenditure = 0.1;
    }

    const yScale = d3.scaleLog().base(10).domain([maxExpenditure, minExpenditure]).range([margin, height - margin]);
    const xScale = d3.scaleLinear().domain([startYear, endYear]).range([margin, width]);

    const onmouseover = function (d, i) {
        const currClass = d3.select(this).attr("class");
        d3.select(this).attr("class", currClass + " current");

        const country = d3.select(this).attr("country");
        // document.querySelector('.card-title').innerText = `${country}`;
        const average = ((d[15].y - d[0].y) / d[0].y) * 100;
        const avgText = `
        <p><strong>${country}</strong> has expenditure of <strong>$${d[0].y}</strong> 
        in year <strong>${d[0].x}</strong> and <strong>$${d[15].y}</strong> in <strong>${d[15].x}</strong>
        which implies ${average > 0 ? 'increase' : 'decrease'} of <strong>${average.toFixed(2)}</strong> percentage</p>`;
        // document.querySelector('.card-text').innerHTML = avgText;
        document.querySelector('#sub-details').innerHTML = avgText;

        const xVal = (d) => { return xScale(d.x); };
        const yVal = (d) => { return yScale(d.y); };

        let tooltipContent = `<ul>`
        d.forEach((data, i) => {
            tooltipContent += `<li>${data.x} - ${data.y}`;
        });
        tooltipContent += `</ul>`;

        const toolTipText = `
        <p><strong>${country}</strong> has expenditure ${average > 0 ? 'increase' : 'decrease'} of <strong>${average.toFixed(2)}</strong> percentage over years</p>`;

        d3.select(".tooltip").transition().duration(100).style("opacity", .9)
        d3.select(".tooltip")
            .html(toolTipText)
            .style("top", (d3.event.pageY + 20) + "px").style("left", (d3.event.pageX + 10) + "px")
            .style('display', 'block');

        const dots = chart.selectAll("circle.line")
            .data(d)
            .enter()
            .append("svg:circle")
            .attr("r", 2)
            .attr("cx", xVal)
            .attr("cy", yVal)
            .style("stroke", function (d) {
                return "aquamarine";
            }).style("fill", function (d) {
                return "white";
            });

        document.querySelector('#sub-chart').innerHTML = '';
        displaySubChart(d);
    };

    const onmouseout = function (d, i) {
        var currClass = d3.select(this).attr("class");
        var prevClass = currClass.substring(0, currClass.length - 8);
        d3.select(this).attr("class", prevClass);
        const average = ((worldExpenditureEndYear - worldExpenditureStartYear) / worldExpenditureStartYear) * 100;
        // document.querySelector('.card-title').innerText = `World`;
        // document.querySelector('.card-text').innerHTML = `
        // <p><strong>World</strong> has expenditure of <strong>${worldExpenditureStartYear.toFixed(2)}</strong> 
        // in year <strong>2000</strong> and <strong>$${worldExpenditureEndYear.toFixed(2)}</strong> in <strong>2015</strong>
        // which implies ${average > 0 ? 'increase' : 'decrease'} of <strong>${average.toFixed(2)}</strong> percentage</p>`;
        chart.selectAll("circle").remove();
        d3.select(".tooltip").style('display', 'none');
        document.querySelector('#sub-chart').innerHTML = '';
        document.querySelector('#sub-details').innerHTML = '';
    };

    const chart = d3.select("#chart")
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append("g");

    const line = d3.line()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y));

    health_expenditure_data.forEach((data, idx) => {
        chart.append("path")
            .data([expenditure_data[idx].pathData])
            .attr("country", expenditure_data[idx].country)
            .attr("class", expenditure_data[idx].country.replace(/\s/g, '_'))
            .attr("d", line)
            .on("mouseover", onmouseover)
            .on("mouseout", onmouseout);
    });

    chart.append("line")
        .attr("x1", xScale(startYear))
        .attr("y1", yScale(minExpenditure))
        .attr("x2", xScale(endYear))
        .attr("y2", yScale(minExpenditure))
        .attr("class", "axis");

    chart.append("line")
        .attr("x1", xScale(startYear))
        .attr("y1", yScale(minExpenditure))
        .attr("x2", xScale(startYear))
        .attr("y2", yScale(maxExpenditure))
        .attr("class", "axis");

    chart.selectAll(".xLabel")
        .data(xScale.ticks(5))
        .enter().append("text")
        .attr("class", "xLabel")
        .text(String)
        .attr("x", function (d) { return xScale(d) })
        .attr("y", height - 10)
        .attr("text-anchor", "middle");

    chart.selectAll(".yLabel")
        .data(yScale.ticks(4))
        .enter().append("text")
        .attr("class", "yLabel")
        .text(String)
        .attr("x", 0)
        .attr("y", function (d) { return yScale(d) })
        .attr("text-anchor", "right")
        .attr("dy", 3);

    chart.selectAll(".xTicks")
        .data(xScale.ticks(5))
        .enter().append("line")
        .attr("class", "xTicks")
        .attr("x1", function (d) { return xScale(d); })
        .attr("y1", yScale(minExpenditure))
        .attr("x2", function (d) { return xScale(d); })
        .attr("y2", yScale(minExpenditure) + 7);

    chart.selectAll(".yTicks")
        .data(yScale.ticks(4))
        .enter().append("line")
        .attr("class", "yTicks")
        .attr("y1", function (d) { return yScale(d); })
        .attr("x1", xScale(startYear - 0.2))
        .attr("y2", function (d) { return yScale(d); })
        .attr("x2", xScale(startYear));

    chart.append("text")
        .attr("class", "xlabel")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 30)
        .text("Year");

    chart.append("text")
        .attr("class", "ylabel")
        .attr("text-anchor", "start")
        .attr("x", -120)
        .attr("y", 20)
        .attr("transform", "rotate(-90)")
        .text("Dollers");

    const average = ((worldExpenditureEndYear - worldExpenditureStartYear) / worldExpenditureStartYear) * 100;
    document.querySelector('.card-text').innerHTML = `
        <p><strong>World</strong> has expenditure of <strong>${worldExpenditureStartYear.toFixed(2)}</strong> 
        in year <strong>2000</strong> and <strong>$${worldExpenditureEndYear.toFixed(2)}</strong> in <strong>2015</strong>
        which implies ${average > 0 ? 'increase' : 'decrease'} of <strong>${average.toFixed(2)}</strong> percentage</p>`;

    fillCountries(health_expenditure_data);
}

const updateNavItemClass = (id) => {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.id === id) {
            link.classList.add('active')
        } else {
            link.classList.remove('active');
        }
    });
}

const getSelectedExpenditure = () => {
    const navLinks = document.querySelectorAll('.nav-link');
    let expenditure = 'CHE';
    navLinks.forEach(link => {
        if (link.classList.contains('active')) {
            expenditure = link.id;
        }
    });
    return expenditure;
}


const displaySubChart = (data) => {

    data = data.sort(function (a, b) {
        return a.y - b.y;
    })

    var margin = {
        top: 10,
        right: 15,
        bottom: 10,
        left: 40
    };

    var width = 200 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var svg = d3.select("#sub-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // set the ranges
    var y = d3.scaleBand()
        .range([height, 0])
        .padding(0.1);

    var x = d3.scaleLinear()
        .range([0, width]);

    x.domain([0, d3.max(data, function (d) { return d.y; })])
    y.domain(data.map(function (d) { return d.x; }));

    // append the rectangles for the bar chart
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("width", function (d) { return x(d.y); })
        .attr("y", function (d) { return y(d.x); })
        .attr("height", y.bandwidth());

    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));
}

const fillCountries = (data) => {
    let options = `<option value="select">Select</option>`;
    data.forEach((data) => {
        options += `<option value="${data.Country.replace(/\s/g, '_')}">${data.Country}</option>`;
    });
    document.querySelector('#country').innerHTML = options;
};