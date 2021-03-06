//todo wrap in closure

d3.select("#submit").on("click", function() {
    d3.select(".main-content").classed("hidden", false);
    d3.select("#start-question").classed("hidden", true);
    window.deficit_top = $("#deficit").offset().top - 20;

    $('html,body').animate({
        scrollTop: $(".main-content").offset().top
    }, 1000);

    var pension_target_size = +d3.select('#input-pension').attr("value");
    var user_age = +d3.select('#input-age').attr("value");

    // d3.select("#user_age").text(user_age);
    // d3.select("#pension_target").text(pension_target_size);

    var years = [];
    for (var y = 2016; y <= 2050; y++) years.push(y);

    var history = window.__demographics__.history;

    // var future_years = years.slice(1);
    var future_years = [2020, 2025, 2030, 2035, 2040, 2045, 2050];

    var future_start_years = [2016].concat(future_years);

    var last_in_history = last(history);

    var future = future_years.map(function(y, i) {
       return {
           year: y,
           pension_age: last_in_history.pension_age,
           // pension_avg will be filled later
           salary_avg: last_in_history.salary_avg,
           esv_rate: last_in_history.esv_rate,
           payers_rate: last_in_history.payers_rate,
           dreg: last_in_history.dreg
       }
    });
    var future_start = [last(history)].concat(future);

    var current_year = new Date().getFullYear();
    var pension_year = calc_pension_year(current_year, user_age, future_start);

    var pension_size_scale = d3.scaleLinear()
        .domain([last_in_history.year, pension_year])
        .range([last_in_history.pension_avg, pension_target_size]);

    future.forEach(function(d) { d.pension_avg = pension_size_scale(d.year) });


    var pension_age = smallchart()
        .historical(history)
        .future(future)
        .varName('pension_age')
        .minY(55)
        .maxY(65)
        .maxStep(0.5*5)
        .yTickValues([55, 60, 65])
        .snapFunction(Math.round)
        .showTips(true)
        .drawMode(true)
        .pension_year(pension_year);

    var esv_rate = smallchart()
        .varName('esv_rate')
        .historical(history)
        .future(future)
        .minY(0.1)
        .maxY(0.5)
        .maxStep(0.1)
        .yFormat(d3.format('.0%'))
        .yTickValues([.1, .2, .3, .4])
        .showTips(true)
        .drawMode(true)
        .pension_year(pension_year);
    //
    // var payers_rate = smallchart()
    //     .varName('payers_rate')
    //     .historical(history)
    //     .future(future)
    //     .minY(0.3)
    //     .maxY(0.6)
    //     .yTickValues([.3, .4, .5, .6])
    //     .yFormat(d3.format('.0%'))
    //     .sticky(true)
    //     .showTips(true)
    //     .pension_year(pension_year);

    // var pension_avg = smallchart()
    //     .varName('pension_avg')
    //     .historical(history)
    //     .future(future)
    //     .minY(50)
    //     // .maxY(200)
    //     .maxStep(50)
    //     // .yTickValues([50, 100, 150, 200])
    //     .yFormat(d3.format(".0f"))
    //     .showTips(true)
    //     .drawMode(true)
    //     .pension_year(pension_year);

    var salary_avg = smallchart()
        .varName('salary_avg')
        .historical(history)
        .future(future)
        .minY(0)
        .maxY(1000)
        .maxStep(109)
        .yTickValues([100, 400, 700, 1000])
        .yFormat(d3.format(".0f"))
        .showTips(true)
        .drawMode(true)
        .pension_year(pension_year);

    var dreg = smallchart()
        .varName('dreg')
        .historical(history)
        .future(future)
        .minY(0)
        .maxY(5)
        .minValueY(1)
        .maxStep(1.25)
        .yTickValues([1, 2, 3, 4, 5])
        .yFormat(d3.format(".0f"))
        .showTips(true)
        .drawMode(true)
        .pension_year(pension_year);

    var ballance_chart = bigchart()
        .varName("ballance")
        .history(history)
        .minY(-35)
        .maxY(10)
        .yText("млрд. $")
        .showPrevious(true)
        .showTips(true)
        .yFormat(d3.format(".0f"))
        .pension_year(pension_year)
        .target(-3.5)
        .minYscales([-150, -70, -35, -15, -5, 0]);

    var payers_rate = bigchart()
        .varName("payers_rate")
        .history(history)
        .minY(.0)
        .maxY(.9)
        .yTickValues([0, .3, .6, .9])
        .showTips(true)
        .yFormat(d3.format('.0%'))
        .clip(true)
        .pension_year(pension_year);

    d3.select("#ballance").call(ballance_chart);

    d3.select('#payers_rate').call(payers_rate); //.on("change", update);
    ballance_chart.update(ballance_data());
    payers_rate.update(payers_rate_data());

    d3.select('#pension_age').call(pension_age).on("change", update_pension_age_changed).on("dragend", ballance_chart.dragend);
    d3.select('#esv_rate').call(esv_rate).on("change", update_payers_rate).on("dragend", ballance_payers_dragend);
    // d3.select('#pension_avg').call(pension_avg).on("change", update).on("dragend", ballance_chart.dragend);
    d3.select('#salary_avg').call(salary_avg).on("change", update).on("dragend", ballance_chart.dragend);
    d3.select('#dreg').call(dreg).on("change", update_payers_rate).on("dragend", ballance_payers_dragend);

    d3.select("#pension_age").call(addDragTip);

    setUpTangle(user_age, pension_target_size, function onUpdate(params) {
        user_age = params.user_age;
        pension_target_size = params.pension_target;

        pension_size_scale.range([last_in_history.pension_avg, pension_target_size]);
        update_pension_age_changed(true);
    });

    $("body").on("mouseup", function(){
       if ($(this).hasClass("TKCursorDragHorizontal")) ballance_chart.dragend();
    });

    function last(arr) {
        return arr[arr.length-1];
    }

    function ballance_payers_dragend() {
        ballance_chart.dragend();
        payers_rate.dragend();
    }

    function update_pension_age_changed(including_previous) {
        var pension_year = calc_pension_year(current_year, user_age, future_start);

        //recalc pension_avg
        recalc_pension_avg(pension_year);

        ballance_chart.pension_year(pension_year);
        payers_rate.pension_year(pension_year);

        pension_age.update_pension_year(pension_year);
        esv_rate.update_pension_year(pension_year);
        // payers_rate.update_pension_year(pension_year);
        // pension_avg.update_pension_year(pension_year);
        salary_avg.update_pension_year(pension_year);
        dreg.update_pension_year(pension_year);
        update(including_previous);
    }

    function update_payers_rate() {
        var p_data = payers_rate_data();
        payers_rate.update(p_data, d3.event.detail.index + 1);
        future_start.forEach(function(d, i) {d.payers_rate = p_data[i].payers_rate});

        update();
    }

    function update(including_previous) {
        ballance_chart.update(ballance_data(), d3.event ? d3.event.detail.index + 1 : false, including_previous);
    }

    function payers_rate_data() {
        return future_start_years.map(function(y, i) {
            return {
                year: y,
                payers_rate: model.calcPayersRate(future_start[i].esv_rate, future_start[i].dreg)
            }
        });
    }

    function ballance_data() {
        return future_start_years.map(function(y, i) {
            return {
                year: y,
                ballance: model.calcBalance(Math.round(future_start[i].pension_age), future_start[i].payers_rate, future_start[i].esv_rate, future_start[i].pension_avg, future_start[i].salary_avg,  y)
            }
        });
    }

    function calc_pension_year(current_year, user_age, future_start) {
        var f1, f2, age_y1, age_y2;

        for (var i = 0; i < future_start.length - 1; i++) {
            f1 = future_start[i];
            f2 = future_start[i+1];

            age_y1 = user_age + f1.year - current_year;
            age_y2 = user_age + f2.year - current_year;

            if (f1.pension_age >= age_y1 && f2.pension_age <= age_y2) break;
        }

        for (var y = f1.year; y <= f2.year; y++) {
            var age_y = user_age + y - current_year;
            var pension_age = f1.pension_age + (y - f1.year) / (f2.year - f1.year) * (f2.pension_age - f1.pension_age);

            if (age_y >= pension_age) return y;
        }
        return y;
    }

    function addDragTip(selection) {
        selection.each(function(d) {
            var swoopyTip = swoopyArrow()
                .angle(Math.PI/1.5)
                .x(function(d) { return d[0]; })
                .y(function(d) { return d[1]; });

            var tipG = d3.select(this)
                .append("g")
                .attr("class" ,"swoopy-tooltip")
                .translate([94, 4]);

            tipG
                .append("text")
                .attr('y', 4)
                .attr('x', -5)
                .attr('text-anchor', "end")
                .text('Тягни!');

            tipG
                .append("path")
                .attr('marker-end', 'url(#arrowhead)')
                .attr('class', 'swoopy-arrow-line')
                .datum([[0, 0], [30, 15]])
                .attr("d", swoopyTip);

            tipG
                .style("opacity", 1)
                .transition()
                .ease(d3.easeLinear)
                .duration(400)
                .on("start", function repeat() {
                    d3.active(this)
                        .style("opacity", 1)
                        .transition()
                        .duration(400)
                        .ease(d3.easeLinear)
                        .style("opacity", 0)
                        .transition()
                        .duration(400)
                        .ease(d3.easeLinear)
                        .on("start", repeat);
                });

            d3.selectAll(".smallchart")
                .on("dragend.tip", function(){
                    tipG
                        .interrupt()
                        .remove();
            });
        });
    }

    function recalc_pension_avg(pension_year) {
        pension_size_scale.domain([last_in_history.year, pension_year]);
        future.forEach(function(d) { d.pension_avg = pension_size_scale(d.year) });
    }

    function setUpTangle(user_age, pension_target, onUpdate) {
        var element = document.getElementById("input_data");

        var tangle = new Tangle(element, {
            initialize: function () {
                this.user_age = user_age;
                this.pension_target = pension_target;
            },
            update: function () {
                if (!onUpdate) return;
                onUpdate({user_age: this.user_age, pension_target: this.pension_target});
            }
        });
    }

});
