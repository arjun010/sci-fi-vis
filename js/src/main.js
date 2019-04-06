(function (argument) {
	main = {};

	let globalVars = {};
	globalVars.dataMap = {};
	globalVars.colorAttrs = ["sentimentScore","PERSON_count","LOC_count"];
	globalVars.entityTypes = ["PERSON","LOC"];

	d3.json("../../converted-data/dataMap.json", function(error, dataMap) {
		globalVars.dataMap = dataMap;
		initVis(dataMap);
		initOptions();
	});

	function initOptions(){
		for(let colorAttr of globalVars.colorAttrs){
			$('#colorAttrPicker').append($('<option>', {
			    value: colorAttr.split("_")[0],
			    text: colorAttr
			}));
		}
	}

	$("#colorAttrPicker").on("change",function(evt){
		let colorAttr = $(this).val();
		updateChapterColors(colorAttr,globalVars.dataMap);
	});

	function initVis(dataMap){
		for(let book in dataMap){
			let bookId = dataMap[book]['id'];
			let bookChapters = dataMap[book]['chapters'];
			d3.select("#vis-ul")
				.append("li")
				.attr("id",function(){
					return bookId;
				});

			d3.select("#"+bookId)
			  .append("div")
			  .attr("class",'chapter-name col-md-4')
			  .html(function(){
			  	return '<i class="fa fa-arrows-v" style="color:gray;"></i>&nbsp;' + book;
			  })
			  .style('cursor','move');

			let chapterVisSvg = d3.select("#"+bookId)
			  .append("div")
			  .attr("id",bookId+'-chapterVis')
			  .attr("class",'col-md-8')
			  .append('svg')
			  .attr("width",500)
			  .attr("height",50);

			let tool_tip = d3.tip()
		      .attr("class", "d3-tip")
		      .offset([-8, 0])
		      .html(function(d) {
		      	let HTMLStr = "";
		      	HTMLStr += "<span class='tooltipAttr'>Title</span> : " + d['title'] + "<br>";
		      	HTMLStr += "<span class='tooltipAttr'>sentimentScore</span> : " + d['sentimentScore'] + "<br>";
		      	
		      	for(let entityType of globalVars.entityTypes){
		      		let entityCount = 0;
		      		if(entityType in d['entityMap']){
		      			entityCount = d['entityMap'][entityType]['count'];
		      		}
		      		HTMLStr += "<span class='tooltipAttr'>#"+entityType+"</span> : " + entityCount + "<br>";
		      	}

		      	return HTMLStr;
		      });

		    chapterVisSvg.call(tool_tip);

			chapterVisSvg.selectAll("rect")
	          .data(bookChapters)
			  .enter()
			  .append('rect')
			  .attr("class","chapterGlyph")
			  .attr("width",15)
			  .attr("height",15)
			  .attr("x",function(d,i){
			  	return (i+1)*20;
			  })
			  .attr("y",function(d,i){
			  	return 7.5;
			  })
			  .on('mouseover', tool_tip.show)
      		  .on('mouseout', tool_tip.hide);
		}
		updateChapterColors('sentimentScore',dataMap);
	    
	    $( "#vis-ul" ).sortable({
	      placeholder: "ui-state-highlight"
	    });
	    $( "#vis-ul" ).disableSelection();
	}

	function updateChapterColors(colorAttr,dataMap){
		let colorScale;
		if(colorAttr=='sentimentScore'){
			colorScale = d3.scaleLinear()
			.domain([-1, 0, 1])
			.range(["maroon", "white", "steelblue"]);
		}else{
			let maxEntityCount = null;
			for(let book in dataMap){
				for(let chapterObj of dataMap[book]['chapters']){
					let entityCount = 0;
					if(colorAttr in chapterObj['entityMap']){
						entityCount = chapterObj['entityMap'][colorAttr]['count'];
					}
					if(maxEntityCount==null || maxEntityCount<entityCount){
						maxEntityCount = entityCount;
					}
				}
			}
			colorScale = d3.scaleLinear()
			.domain([0, maxEntityCount])
			.range(["white", "steelblue"]);
		}

		d3.selectAll('.chapterGlyph')
		.transition(1000)
		.style('fill',function(d){
			if(colorAttr in d){
				return colorScale(d[colorAttr]);
			}else{
				let entityCount = 0;
				if(colorAttr in d['entityMap']){
					entityCount = d['entityMap'][colorAttr]['count'];
				}
				return colorScale(entityCount);
			}
		})
	}
})();