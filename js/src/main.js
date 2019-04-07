(function (argument) {
	main = {};

	let globalVars = {};
	globalVars.dataMap = {};
	globalVars.colorAttrs = ["sentimentScore","wordCount","PERSON_count","LOC_count","DATE_count","TIME_count"];
	globalVars.sizeAttrs = ["wordCount","PERSON_count","LOC_count","DATE_count","TIME_count"];
	globalVars.entityTypes = ["PERSON","LOC","DATE","TIME"];

	globalVars.defaultGlyphDim = 15;
	globalVars.minGlyphDim = 8;
	globalVars.maxGlyphDim = 20;

	d3.json("converted-data/dataMap.json", function(error, dataMap) {
		globalVars.dataMap = dataMap;
		initVis(dataMap);
		initOptions();
	});

	function initOptions(){
		$('#colorAttrPicker').append($('<option>', {
		    value: "",
		    text: ""
		}));
		for(let colorAttr of globalVars.colorAttrs){
			$('#colorAttrPicker').append($('<option>', {
			    value: colorAttr.split("_")[0],
			    text: colorAttr
			}));
		}
		$('#sizeAttrPicker').append($('<option>', {
		    value: "",
		    text: ""
		}));
		for(let sizeAttr of globalVars.sizeAttrs){
			$('#sizeAttrPicker').append($('<option>', {
			    value: sizeAttr.split("_")[0],
			    text: sizeAttr
			}));
		}
	}

	$("#colorAttrPicker").on("change",function(evt){
		let colorAttr = $(this).val();
		updateChapterColors(colorAttr,globalVars.dataMap);
	});

	$("#sizeAttrPicker").on("change",function(evt){
		let sizeAttr = $(this).val();
		updateChapterSizes(sizeAttr,globalVars.dataMap);
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
			  .attr("class",'chapter-name col-md-3')
			  .html(function(){
			  	return '<i class="fa fa-arrows-v" style="color:gray;"></i>&nbsp;' + book;
			  })
			  .style('cursor','move');

			let chapterVisSvg = d3.select("#"+bookId)
			  .append("div")
			  .attr("id",bookId+'-chapterVis')
			  .attr("class",'col-md-9')
			  .append('svg')
			  .attr("width","100%")
			  .attr("height",50);

			let tool_tip = d3.tip()
		      .attr("class", "d3-tip")
		      .offset([-8, 0])
		      .html(function(d) {
		      	let HTMLStr = "";
		      	HTMLStr += "<span class='tooltipAttr'>Title</span> : " + d['title'] + "<br>";
		      	HTMLStr += "<span class='tooltipAttr'>sentimentScore</span> : " + d['sentimentScore'] + "<br>";
		      	HTMLStr += "<span class='tooltipAttr'>wordCount</span> : " + d['wordCount'] + "<br>";
		      	
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
			  .attr("width",globalVars.defaultGlyphDim)
			  .attr("height",globalVars.defaultGlyphDim)
			  .attr("x",function(d,i){
			  	return (i+1)*(globalVars.maxGlyphDim+2.5);
			  })
			  .attr("y",function(d,i){
			  	return 5;
			  })
			  .on('mouseover', tool_tip.show)
      		  .on('mouseout', tool_tip.hide);
		}
		updateChapterColors('',dataMap);
	    
	    $( "#vis-ul" ).sortable({
	      placeholder: "ui-state-highlight"
	    });
	    $( "#vis-ul" ).disableSelection();
	}

	function updateChapterColors(colorAttr,dataMap){
		let colorScale;
		if(['sentimentScore'].indexOf(colorAttr)!=-1){
			colorScale = d3.scaleLinear()
			.domain([-1, 0, 1])
			.range(["maroon", "white", "steelblue"]);
		}else{
			let maxVal = null;
			if(globalVars.entityTypes.indexOf(colorAttr)!=-1){
				for(let book in dataMap){
					for(let chapterObj of dataMap[book]['chapters']){
						let entityCount = 0;
						if(colorAttr in chapterObj['entityMap']){
							entityCount = +chapterObj['entityMap'][colorAttr]['count'];
						}
						if(maxVal==null || maxVal<entityCount){
							maxVal = entityCount;
						}
					}
				}
			}else if(['wordCount'].indexOf(colorAttr)!=-1){
				for(let book in dataMap){
					for(let chapterObj of dataMap[book]['chapters']){
						if(maxVal==null || maxVal<+chapterObj['wordCount']){
							maxVal = +chapterObj['wordCount'];
						}
					}
				}
			}
			colorScale = d3.scaleLinear()
			.domain([0, maxVal])
			.range(["white", "steelblue"]);
		}

		d3.selectAll('.chapterGlyph')
		.transition(1000)
		.style('fill',function(d){
			if(colorAttr==""){
				return "steelblue";
			}else{
				if(colorAttr in d){
					return colorScale(d[colorAttr]);
				}else{
					let entityCount = 0;
					if(colorAttr in d['entityMap']){
						entityCount = d['entityMap'][colorAttr]['count'];
					}
					return colorScale(entityCount);
				}
			}
		})
	}

	function updateChapterSizes(sizeAttr,dataMap){
		let sizeScale;
		let minVal = null, maxVal = null;
		if(globalVars.entityTypes.indexOf(sizeAttr)!=-1){
			for(let book in dataMap){
				for(let chapterObj of dataMap[book]['chapters']){
					let entityCount = 0;
					if(sizeAttr in chapterObj['entityMap']){
						entityCount = +chapterObj['entityMap'][sizeAttr]['count'];
					}
					if(maxVal==null || maxVal<entityCount){
						maxVal = entityCount;
					}
					if(minVal==null || minVal>entityCount){
						minVal = entityCount;
					}
				}
			}
		}else if(['wordCount'].indexOf(sizeAttr)!=-1){
			for(let book in dataMap){
				for(let chapterObj of dataMap[book]['chapters']){
					if(maxVal==null || maxVal<+chapterObj['wordCount']){
						maxVal = +chapterObj['wordCount'];
					}
					if(minVal==null || minVal>+chapterObj['wordCount']){
						minVal = +chapterObj['wordCount'];
					}
				}
			}
		}

		sizeScale = d3.scaleLinear()
		.domain([minVal, maxVal])
		.range([globalVars.minGlyphDim,globalVars.maxGlyphDim]);

		d3.selectAll('.chapterGlyph')
		.transition(1000)
		.attr("width",function(d){
			if(sizeAttr==""){
				return globalVars.defaultGlyphDim;
			}else{
				if(globalVars.entityTypes.indexOf(sizeAttr)!=-1){
					let entityCount = 0;
					if(sizeAttr in d['entityMap']){
						entityCount = +d['entityMap'][sizeAttr]['count'];
					}
					return sizeScale(entityCount);
				}else{
					return sizeScale(+d[sizeAttr]);
				}
			}
		})
		.attr("height",function(d){
			if(sizeAttr==""){
				return globalVars.defaultGlyphDim;
			}else{
				if(globalVars.entityTypes.indexOf(sizeAttr)!=-1){
					let entityCount = 0;
					if(sizeAttr in d['entityMap']){
						entityCount = +d['entityMap'][sizeAttr]['count'];
					}
					return sizeScale(entityCount);
				}else{
					return sizeScale(+d[sizeAttr]);
				}
			}
		});

	}

})();