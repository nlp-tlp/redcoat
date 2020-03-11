function initTaggingInterface(canCreateNewCategories, canDeleteCategories, numDocuments, run_dictionary_tagging) {
	
	if(!canCreateNewCategories && !canDeleteCategories) {
		$("#right-click-opens-menu").hide();
	}

	var $wikipediaHideShow = $("#wikipedia-hide-show");
	var $wikipediaSummaryContainer = $("#wikipedia-summary-container");
	var $categoryHierarchyTree = $("#category-hierarchy-tree");
	$wikipediaHideShow.on('click', function() {
		var t = $(this);
		if(t.hasClass("up")) {
			t.removeClass("up");
			t.addClass("down");
			$categoryHierarchyTree.addClass("tall");
			$wikipediaSummaryContainer.hide();
		} else {
			t.removeClass("down");
			t.addClass("up");
			$categoryHierarchyTree.removeClass("tall");
			$wikipediaSummaryContainer.show();
		}

	});

	var hotkeyMap;   // A 'map' that stores the current hotkey bindings mapped to their corresponding nodes in the JSTree.
	var tagClassMap; // A 'map' of nodes mapped to each of their parents, in order of closeness.
	var hotkeysCurrentlyDisabled = 0; // Stored as integers because both the search and category tree disable hotkeys.
	var treeMap = {}; // A map of hierarchy node indexes mapped to their jstree ids.
	var nodeIds = new Set(); // A set of nodeids that are present in the jsTree.
	// Construct the JSTree from the category hierarchy data.
	function buildJsTree(hierarchy) {

		var $tree = $("#category-hierarchy-tree");
		var $ecSearch = $("#ec-search");
		var $ecSearchForm = $("#ec-search-form");
		var $noSearchResults = $("#search-results-none");
		var $searchResultsInfo = $("#search-results-info");
		var $searchResultsCount = $("#search-results-count");

		const hotkeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]; // TODO: Move into common js file along with slash2jstree, etc

		var searching = false;
		var currentSearchResultsCount = 0;

		const MAX_SEARCH_RESULTS = 2000;

		var jstreeData = slash2jstree(hierarchy);



		// Update the colours of any tags that the annotator has already annotated.
		function updateTagColours(node) {
			annotatedLabels = $('.tag[data-node-id="' + node.li_attr.id + '"]');
			if(annotatedLabels.length > 0) {						
				annotatedLabels.removeClass(function(index, className) {
					return className.match(/tag-\d/ || []).join(' ');
				});

				
				annotatedLabels.addClass("tag-" + node.li_attr["data-color"]);
				annotatedLabels.attr("tag-class", node.li_attr["data-index"])
			}

			if(node.children === undefined) return;
			for(var i in node.children) {
				updateTagColours(node.children[i])
			}
		}

		for(var i in jstreeData["data"]) {
			updateTagColours(jstreeData["data"][i])
		}

		tagClassMap = jstreeData["tagClassMap"];
		treeMap = jstreeData["treeMap"];
		nodeIds = jstreeData["nodeIds"];





		//- $tree.on('create_node.jstree', function (e, obj) {		
		//- 	alert("haaaaaaaaaaaaaaaaaaaaaaaaaaaaello")		    
		//-     //$tree.set_id(obj.node, 42);
		//- });


		$tree.jstree(
			{ 
			"plugins" : [ "search" ],//, "sort" ],
			"search": {
				show_only_matches: true,
				search_callback: function(str, node) {
					if(currentSearchResultsCount >= MAX_SEARCH_RESULTS) return false;
					var m = node.li_attr["data-full"].toLowerCase().includes(str.toLowerCase());	
					if(m) currentSearchResultsCount++;
					return m;
				},					
			},
			'core' : {
			    'data' : jstreeData["data"],
			    'dblclick_toggle' : false,
			    'animation': false,
			    'multiple': false,
			    'check_callback': true,

			},
			//- 'sort' : function(a, b) {
			//- 	a1 = this.get_node(a);
			//- 	b1 = this.get_node(b);
			//- 	return (a1.text > b1.text) ? 1 : -1;			        
			//- }
		});
		
		
		// Display the hotkeys for the top-level categories as soon as the tree has been drawn.
		$tree.on('ready.jstree', function() {
			$($(".jstree-children")[0]).addClass("jstree-current");
			//$("#remove-label_anchor").addClass('jstree-clicked');
			$tree.jstree("select_node", '#remove-label');
			$("#total-categories").html(Object.keys(tagClassMap).length);
			updateHotkeyMap();
		});

		// Open a node upon a single click (instead of a double click).
		$tree.on('click', '.jstree-anchor', function (e) {	
			$tree.jstree(true).toggle_node(e.target);
		});

		// Updates the hotkey map.
		function updateHotkeyMap() {
			// Get all nodes with hotkey icons and put them into the hotkeyMap.
			hotkeyMap = {};
			var eles = $(".jstree-current > li");				
			eles.each(function() {
				var h = $(this).children("a").first().children("span").html();
				var nid = $(this).attr('id');
				if(h.length > 0) hotkeyMap[h] = nid;
			});
			delete hotkeyMap["~"];

			var bksp = $(".backspace-hotkey").parent().first().attr('id');
			if(bksp) hotkeyMap["BACKSPACE"] = bksp;
			// console.log(hotkeyMap);
		}

		// Hide the hotkeys when a node is closed.
		$tree.on('close_node.jstree', function(e, data) {
			$(".jstree-children").removeClass("jstree-current");
			$($("#" + data.node.id).parents('.jstree-children')[0]).addClass("jstree-current");
			$(".jstree-anchor").removeClass('backspace-hotkey');
			var parentNode = $("#" + data.node.id).parent().parent().children(".jstree-anchor").first();
			parentNode.addClass('backspace-hotkey');		
			
			updateHotkeyMap();
		});

		// Close all nodes adjacent to a node.
		// Code found at https://stackoverflow.com/questions/38765843/keep-only-one-li-node-open-in-tree-view-display.
		function closeSiblingNodes(data) {
			var nodesToKeepOpen = [];

	        // get all parent nodes to keep open
	        $('#'+data.node.id).parents('.jstree-node').each(function() {
	           nodesToKeepOpen.push(this.id);
	        });

	        // add current node to keep open
	        nodesToKeepOpen.push( data.node.id );

	        // close all other nodes
	        $('.jstree-node').each( function() {
	            if( nodesToKeepOpen.indexOf(this.id) === -1 ) {
	            	if(this.classList.contains("jstree-open")) {
	                	$tree.jstree(true).toggle_node(this.id);
	                	$(".jstree-children").removeClass("jstree-current");
	                	$("#" + data.node.id).children('.jstree-children').addClass("jstree-current");
	            	}
	            }
	        });
		}

		// Ensure only one branch can be opened at a time so that the hotkey display works properly.
		$tree.on('open_node.jstree', function (e, data) {
			// console.log(data);
			$(".jstree-children").removeClass("jstree-current");
			$("#" + data.node.id).children('.jstree-children').addClass("jstree-current");
		    if(!searching) closeSiblingNodes(data);
		    // Add the backspace hotkey 
		    $(".jstree-anchor").removeClass('backspace-hotkey');
		    $("#" + data.node.id).children(".jstree-anchor").first().addClass('backspace-hotkey');				    
		    updateHotkeyMap();
		});

		$tree.on('activate_node.jstree', function (e, data) {
			if(data.node.children.length == 0) {
				if(!searching) closeSiblingNodes(data);
		       	$(".jstree-children").removeClass("jstree-current");
				$($("#" + data.node.id).parents('.jstree-children')[0]).addClass("jstree-current");	
				updateHotkeyMap();
			}
		});			

		$tree.on('search.jstree', function(e, data) {
			if(data.res.length == 0 && $ecSearch.val().length > 0) {
				$noSearchResults.show();
				$searchResultsInfo.hide();						
				$tree.hide();										
			} else {
				$searchResultsCount.html(data.res.length);
				$noSearchResults.hide();
				$searchResultsInfo.show();
				$tree.jstree("activate_node", "#remove-label");
				$tree.show();
				$(".jstree-container-ul").addClass("jstree-current");
			}
		});

		$ecSearchForm.unbind('submit');
		$ecSearchForm.on('submit', function (e) {
			var v = $ecSearch.val();
			searching = true;
			currentSearchResultsCount = 0;
			$tree.jstree(true).search(v, { "show_only_matches": true });
			var $searchResults = $(".jstree-node:not(.jstree-hidden)");

			//hotkeyMap = {};
			if(currentSearchResultsCount > 0) {
				$tree.addClass("searching");
				hotkeyMap = {};
				//- $searchResults.each(function(i) {
				//- 	var span = $($(this).children("a").children("span")[0]);

				//- 	//- if(hotkeys[i]) {
				//- 	//- 	span.html(hotkeys[i]);
				//- 	//- 	hotkeyMap[hotkeys[i]] = $(this).attr('id');
				//- 	//- 	span.removeClass("hide");
				//- 	//- }
				//- 	//- else {
				//- 	//- 	span.addClass('hide');
				//- 	//- }
				//- 	span.addClass('hide');
				//- });

				$tree.jstree('deselect_node', $tree.jstree('get_selected'));
				$tree.jstree('select_node', $searchResults.first().attr('id'));						
			}

			if($ecSearch.val().length == 0) {
				$ecSearchForm.removeClass("searching");
				$tree.removeClass("searching");
				$noSearchResults.hide();
				$searchResultsInfo.hide();
				$tree.show();			
				searching = false;	
				$tree.jstree("activate_node", "#remove-label");
				$($(".jstree-children")[0]).addClass("jstree-current");
			}

			$ecSearch.blur();
			e.preventDefault();
		});

		$ecSearch.unbind('focus');
		$ecSearch.on('focus', function() {
			// console.log('focs')
			$ecSearchForm.addClass("selected");
			$tree.addClass("searching");
			$tree.hide();
			$searchResultsInfo.hide();
			hotkeysCurrentlyDisabled += 1;
			$ecSearchForm.addClass("searching");
		})

		$ecSearch.unbind('blur');
		$ecSearch.on('blur', function() {
			// console.log('blur')
			//$ecSearchForm.removeClass("searching");
			
			
			hotkeysCurrentlyDisabled -= 1;
			//if($ecSearch.val().length == 0) {
				//$ecSearchForm.removeClass("selected");
				//$tree.removeClass("searching");
				//$ecSearchForm.removeClass("searching");
			//}
		});


		
		return $tree;
	}

	function initTagging() {



		// The category hierarchy to be placed on the window.
		var categoryHierarchy = new CategoryHierarchy(false, canCreateNewCategories, canDeleteCategories);

		

		
		// Set up jQuery handles.
		var $entityCategoriesWindow = $("#entity-categories-window");
		var $categoryTreeClose = $("#category-tree-close");
		var $categoryTreeSave = $("#category-tree-save");
		var $openCategoryTree = $("#open-category-tree");


		var $ecSearch = $("#ec-search");
		var $ecSearchForm = $("#ec-search-form");

		var $taggingMenuTokens = $("#tagging-menu .tokens");
		var $taggingMenuSummary = $("#tagging-menu .summary");
		var $taggingMenuMore = $("#tagging-menu .more");
		var $taggingMenuReadMore = $("#ec-read-more");
		var $ecSearch = $("#ec-search");
		var $windowMask = $("#window-mask");
		var st = $("#sentence-tagging");
		var $sentences;
		var $navbarPageTitle = $("#navbar-page-title");



		var $savedNotificationCategoryHierarchy = $("#saved-notification-category-hierarchy");
		var unsavedTreeModifications = false;
		// Close the entity categories tree window when the button is clicked, or the area outside the window is clicked.
		$categoryTreeClose.click(function() {
			$entityCategoriesWindow.removeClass("show");
			$("#saved-notification-category-hierarchy .unsaved").hide();
			$("#saved-notification-category-hierarchy .saved").hide();
			$("#saved-notification-category-hierarchy .saving").hide();
			$("#saved-notification-category-hierarchy .error").hide();
			if(unsavedTreeModifications) {
				categoryHierarchy.clearTree();
				categoryHierarchy.buildTree(entity_classes);
			}
			hotkeysCurrentlyDisabled -= 1;
		});
		$windowMask.click(function() {
			hotkeysCurrentlyDisabled -= 1;
			$entityCategoriesWindow.removeClass("show");
		});
		$openCategoryTree.click(function() {
			$entityCategoriesWindow.addClass("show");
			hotkeysCurrentlyDisabled += 1;
		})

		$categoryTreeSave.click(function() {
			$(this).addClass("disabled");
			$("#saved-notification-category-hierarchy .unsaved").hide();
			$("#saved-notification-category-hierarchy .error").hide();
			$("#saved-notification-category-hierarchy .saving").show();

			var slashData = json2slash(categoryHierarchy.root);

			$.ajax({
				method: 'post',
				url: 'tagging/modify_hierarchy',
				headers: { 'csrf-token': csrfToken },
				data: {new_hierarchy: slashData},	
				success: function(data) {
					reloadTree();
				},
				error: function(err) {
					showErrorMessage();
				}
	    	});		
	    	function showErrorMessage() {
				$("#saved-notification-category-hierarchy .saving").hide();
				$("#saved-notification-category-hierarchy .saved").hide();			    		
				$("#saved-notification-category-hierarchy .error").show();			    		
	    	}

	    	function reloadTree() {

	    		$("#saved-notification-category-hierarchy .saving").hide();
	    		$("#saved-notification-category-hierarchy .error").hide();
				$("#saved-notification-category-hierarchy .saved").show();
				unsavedTreeModifications = false;

	    		entity_classes = slashData;

				$categoryHierarchyTree.replaceWith("<div id='category-hierarchy-tree'></div>");
				$categoryHierarchyTree = $("#category-hierarchy-tree");


				// TODO: Look through tree for deleted categories and un-tag them in the tagging interface
				//untagDeletedCategories();
				//updateTagColors();

				$tree = initialiseCategoryTree();
				generateAbbreviatedEntityClassNames();

				$tree.on('ready.jstree', function() {

					// Remove any tags that are no longer within the category hierarchy.
					(function deleteOldTags() {
						$(".label").each(function() {
							var t = $(this);
							var tid = $(this).attr('data-node-id');
							// console.log("#" + tid, $("#" + tid))
							//console.log(tid, $(this), "#" + (tid), $("#" + (tid)).length)
							
							if(!nodeIds.has(tid)) {
								var p = $(this).parent();								

								annotatedTags[$(this).parent().parent().index()][$(this).parent().index()][1].delete(t.text());
								$(this).remove();

								if(p.children().length == 1) {										
									deleteTag(p, sentenceIndex)
								}
							}
						});
					})();
				});
			}

		});



		$(document).on("tree_modified", function() {
			unsavedTreeModifications = true;
			$("#saved-notification-category-hierarchy .saved").hide();		
			$("#saved-notification-category-hierarchy .unsaved").show();
			$("#saved-notification-category-hierarchy .error").hide();

			$categoryTreeSave.removeClass("disabled");
		});
		
		
		
		// Set up constants for span tags to wrap around words and punctuation.
		const
		WS = '<span class=\"word\" data-ind="$$$"><span class=\"word-inner\">', // Word start 
		WE = "</span></span>", 	// Word end
		PS = '<span class=\"punctuation\" data-ind="$$$"><span class=\"word-inner\">', // Punctuation start 
		PE = "</span></span>"; // Punctuation end

		
		var documentGroupId = null;			// The id of the current documentGroup being annotated.				
		var annotatedTags = [];				// An array to contain the annotated tags of each document.

		var numberOfSentences;				// The number of sentences in the document.
		var sentenceIndex;					// The index of the sentence currently selected.
		var wordIndex;						// The index of the word currently selected.
		var sentenceLength;					// The length of the sentence currently selected.
		var chaining = false;				// Whether 'chaining' is currently happening (multiple tokens selected at once).
		var chainStart;						// The index that the 'chain' (multiple tokens selected with shift) begins.
		var chainType;						// The type of the chain (can be "forwards" or "backwards").
		var currentlyScrolling = false;		// Whether the browser is currently scrolling up or down (prevents multiple scrolls from stacking up).

		var loading = true;					// Whether the tagging interface is loading (can't do anything if it is).
		var ended = false;					// Whether annotation is complete (i.e. the user has no more document groups to annotate).

		var queryWikipediaId = 0;			// A counter to keep track of the index of the current Wikipedia query (to prevent overlapping of results).

		var $currentSentence;				// The current sentence the user is looking at.
		var $currentWords;					// The words of the sentence the user is looking at.

		var $progressBarInner = $("#tagging-progress-bar .inner");
		var $progressTextNumAnnotated = $("#progress-text-num-annotated");

		//var numDocuments = #{numDocuments};

		// A function to call when scrolling has finished.
		function finishedScrolling() {
			currentlyScrolling = false;
		}


		var entity_classes = [];				
		var entity_classes = [];	
		var $tree = null;		

		
		// Initialise the category tree. It must be initialised upon the loading of every group in case the tree changes.
		function initialiseCategoryTree() {
			$tree = buildJsTree(entity_classes);
			// console.log($tree, entity_classes);
			function tagByNode(event, data) {

				var node = data.node;
				var ind = node.li_attr["data-index"];
				var color = node.li_attr["data-color"];
				// console.log(node, ind, color);
				// console.log("INIT TREE")
				tagSelected(ind, color, node.li_attr['id'], false);					
			}

			$tree.on('select_node.jstree', tagByNode);
			// Toggle tagging when clicking elements in the jsTree
			$tree.on('click', '.jstree-anchor', function() {
				$tree.jstree('select_node', "#" + $(this).parent().attr('id'))
			});
			return $tree;
		}

		// Build abbreviated entity class names to display on the annotation labels.
		// This is required because something like "body_part/arm/left_arm/left_hand/fingers" is too long to display on the annotation tags.
		function generateAbbreviatedEntityClassNames() {
			entity_classes_abbr = [];
			for(var i in entity_classes) {
				var ec = entity_classes[i];//.toLowerCase();
				ecs = ec.split('/');
				ec = ecs[ecs.length-1]; //(ecs.length > 1 ? '/' : '') + ecs[ecs.length-1];
				entity_classes_abbr.push(ec);
			}
		};


		// Retrieve a documentGroup via AJAX.
		function loadDocumentGroup(done) {
			$.ajax({
				url: 'tagging/getDocumentGroup',
				data: {},	
				success: function(data) {
					done(null, data);
				},
				error: function(err) {
					console.log(err);
				}
		    });			
			
		}

		// Automatically tag all tokens on the screen that appear in the hierarchy.
		function runDictionaryTagging(groupData) {
			console.log("Automatic tagging...");

			function automaticAnnotations() {

				// Build the automatic annotations based on the groupData.
				automaticAnnotations = [];
				var entityClassesAbbrSet = new Set(entity_classes_abbr);

				var entity_classes_joined = [];
				for(var ec in entity_classes_abbr) {
					// if(entity_classes_abbr[ec].indexOf("_") !== -1) {
						entity_classes_joined.push(entity_classes_abbr[ec].replace("_", "ɮ"));
					// }
				}
				
				entity_classes_joined.sort(function(a, b){
				  // ASC  -> a.length - b.length
				  // DESC -> b.length - a.length
				  return b.length - a.length;
				});
			
				for(var doc_id in groupData) {
					var anns = [];
					var doc = groupData[doc_id];
					var doc_joined = doc.join("ɮ").toLowerCase();
					var alreadyFound = new Set();
					//console.log(doc_id)
					//console.log("---")
					for(var ec = 0; ec < entity_classes_joined.length; ec++) {
						
						var regexp = new RegExp(entity_classes_joined[ec], "g")
						//var regexp = new RegExp('the', "g")
						
						var match, m= [];
						while (match= regexp.exec(doc_joined))
						    m.push([match.index, match.index+match[0].length]);						
					
						if(m.length > 0) {
							for(var mi = 0; mi < m.length; mi++) {							

								var numBefore = (doc_joined.slice(0, m[mi][0]).match(/ɮ/g) || []).length;
								var entitySize = (entity_classes_joined[ec].match(/ɮ/g) || []).length;
								var end = numBefore + entitySize + 1

								if(!alreadyFound.has(end)) {
									anns.push({ start: numBefore, end: end, label: entity_classes_abbr.indexOf(entity_classes_joined[ec].replace("ɮ", "_")) });	
									alreadyFound.add(end);
								}
							}								
						}
					}
					automaticAnnotations.push(anns);
				}
				return automaticAnnotations;
			}

			var automaticAnnotations = automaticAnnotations();

			for(var i = 0; i < automaticAnnotations.length; i++ ) {
				sentenceIndex = i;

				$currentSentence = st.children().eq(sentenceIndex);
				$currentWords = $currentSentence.children();				
				sentenceLength = calculateSentenceLength();
				for(var j in automaticAnnotations[i]) {
					//console.log("<<", j, automaticAnnotations[i][j])
					tagSelected(automaticAnnotations[i][j]['label'], null, null, false, [automaticAnnotations[i][j]['start'], automaticAnnotations[i][j]['end']]);
				}
			}
			console.log("Done.");
		}

		// Load a random document group from the project. Initialise the interface.
		function loadGroup() {

			console.log("Loading group...");
			$("#ending-message").remove();
			loading = true;

			

			

			loadDocumentGroup(function(err, documentGroupData) {
				if(err) { console.log(err); }
				if(documentGroupData === "tagging complete") {
					$progressTextNumAnnotated.html('');
					$("#progress-text-num-total").parent().html("Annotation complete!");
					$progressBarInner.css('width', '100%');						
					$("#annotation-complete").addClass("show");
					$("#tagging-menu .category-hierarchy").remove();
					st.remove(); 
					if($tree) $tree.empty();
					return;
				}

				var groupData = documentGroupData.documentGroup;
				entity_classes = documentGroupData.entityClasses;
				documentGroupId = documentGroupData.documentGroupId;
				$navbarPageTitle.html(documentGroupData.pageTitle);

				console.log("id (pre-tag):", documentGroupId);
				

				$progressTextNumAnnotated.html(documentGroupData.annotatedDocGroups);

				$progressBarInner.css('width', '' + (documentGroupData.annotatedDocGroups / numDocuments * 100) + "%");
				$("#tagging-container").children(0).fadeOut(300, continueLoading);

				// Build the category hierarchy from the entity classes.
				categoryHierarchy.buildTree(entity_classes);

				
				
				
				
				generateAbbreviatedEntityClassNames();

				// Initialise the tree again, just in case it has changed.
				$tree = initialiseCategoryTree();
					

				
				// Continue the loading process.
				// This function is called only after the sentence tagging ele has faded out.
				function continueLoading() {

					delete annotatedTags;
					annotatedTags = [];

					// Clear the sentence tagging div and create a new one.
					st.remove(); 
					$("<div id=\"sentence-tagging\"></div>").hide().appendTo("#tagging-container").fadeIn(300);
					st = $("#sentence-tagging");


					// Iterate over the sentences and create the annotatedTagNumbers and annotatedTags arrays.
					var indSent = 0;
					$.each(groupData, function(key, value) {
						var content = "";
						var ind = 0;
						for(var i in value) {
							// var allPunctuation = ((value[i].match(/[.,\/#!$%\^&\*;:{}=\-_`~()"']/g) || []).length == value[i].length)
							// // If all punctuation, use the punctuation class instead.
							// var ts = WS;
							// var te = WE;
							content += WS.replace(/\$\$\$/g, ind) + value[i] + WE;								
							ind++;						
						}
						var s = st.append("<div class=\"sentence\" data-ind=\"" + indSent + "\" data-ind1=\"" + (indSent+1) + "\">" + content + "</div>");
						
						annotatedTags.push(new Array(value.length).fill([null, new Set()]));
						indSent++;
					});
				

					numberOfSentences = groupData.length;

					if(run_dictionary_tagging) {					
						runDictionaryTagging(groupData);
					}



					sentenceIndex = 0;
					wordIndex = -1;
					gotoSentence();
					chainStart = -1;
					chainType = "forwards";
					moveForwards();
					if(currentlyScrolling) {
						$("html, body").scrollTop(st.children().eq(sentenceIndex).offset().top - 150);
					} else {
						currentlyScrolling = true
						$("html, body").animate({
							scrollTop: st.children().eq(sentenceIndex).offset().top - 150
						}, 200, finishedScrolling);										
					}

					


					loading = false;
					selectedWord = getSelectedWord();
					selectedWord.addClass("selected");
					$sentences = $("#sentence-tagging").children();

					


					initMouseEvents();
					initKeyboardEvents();
				}
			});

			// TODO: Replace this with some kind of thing saying "Congratulations, you've finished annotating every document!" or something along those lines.
			function showEndingMessage() {
				st.remove();
				$("<div id=\"sentence-tagging\"></div>").hide().appendTo("#tagging-container").fadeIn(300);
				st = $("#sentence-tagging");
				$("#tagging-container").append("<div id=\"ending-message\">Well done!</div>")
				//showEndingNotification()
				loading = false;
				ended = true;
			}
		}




		loadGroup();





		// A shortcut function to find the element corresponding to the selected word.
		function getSelectedWord() {
			return st.children().eq(sentenceIndex).children('span').eq(wordIndex);
		}		

		// Calculate the sentence length of the current sentence.
		function calculateSentenceLength() {
			sentenceLength = $currentSentence.children('span').length		
			return sentenceLength;
		}


		function deleteTag(t, si) {
			
			annotatedTags[si][t.index()] = [null, new Set()];//tagClass - 1;

			if(t.index() < annotatedTags[si].length-1 && annotatedTags[si][t.index() + 1][0] == "I-") {
				annotatedTags[si][t.index() + 1][0] = "B-";
			}

			
			t.removeClass(function (index, className) {
				return (className.match (/(^|\s)tag-\S+/g) || []).join(' ');
			});
			t.removeAttr("data-tag-class");
			t.removeAttr("data-node-id");
			t.removeAttr("data-content");
			t.removeClass("tag");
			t.removeClass("tag-begin");
			t.removeClass("tag-end");
			t.children(".label").remove();

		}

		function tagSelected(tagClass, colorIndex, nodeId, moveAfterwards=true, word_indexes=null) {			

			// console.log("TAGGING")

			if(!$currentWords) return;
			if(word_indexes === null) {
				var $selectedWords = $("span.word.selected");
				
			} else {
				var suggestion = true;
				var $selectedWords = $($currentSentence.children(".word").slice(word_indexes[0], word_indexes[1]));
			}
			

			$selectedWords.removeClass(function (index, className) {
				return (className.match (/(^|\s)tag-\S+/g) || []).join(' ');
			});
			
			$selectedWords.removeClass("tag-begin");
			$selectedWords.removeClass("tag-end");
			var b = $selectedWords.first()
			var e = $selectedWords.last()

			// Add tags to the selected elements.
			function addTags(prefix, sentenceIndex, wordIndex) {

				
				//tagList = [tagClass];
				// Determine all parents

				function getParents(tc, arr) {
					var p = tagClassMap[tc][0];
					if(p === undefined) {
						// console.log(arr)
						return arr;
					} else {
						arr.push(p)
						return getParents(p, arr );
					}
				}
				//tagList = getParents(tagClass, [tagClass]);
				tagList = tagClassMap[tagClass].concat([tagClass]);

				for(var i = 0; i < tagList.length; i++) {					
					var tc = tagList[i];
					//console.log(tagList[0], "<<>>")

					if(colorIndex === null) {
						colorIndex = $(".jstree-children li[data-index='" + tagList[0] + "']").attr('data-color');
					}
					
					//console.log(colorIndex, ">>___")

					b.addClass("tag-begin");
					e.addClass("tag-end");
					$selectedWords.addClass("tag");

					// Check if already there
					currentLabels = new Set();
					$selectedWords.children(".label").each(function(e) {
						currentLabels.add($(this).text());
					});
					if(!currentLabels.has(entity_classes[tc])) {
						var suggestion_str = suggestion ? " suggestion" : "";
						var tag = $("<span class=\"label tag-" + colorIndex + suggestion_str + "\">" + entity_classes[tc] + "</span>")
						//if(nodeId === null) {
						//console.log(tc, entity_classes[tc], treeMap[tc])
						nodeId = treeMap[tc];
						//}
						tag.attr("data-node-id", nodeId);

						// Recursively delete the next tag when an "X" button is clicked.
						function deleteNextTag(p, sentenceIndex, wordIndex, tag_name) {
							var pn = p.next();
							var at = annotatedTags[sentenceIndex][wordIndex];

							if(at && !pn.hasClass("tag-begin") && at[1].has(tag_name)) {

								if(pn.length > 0 && pn.hasClass('tag')) {
									
									console.log(pn);
									pn.children().each(function(e) {
										if($(this).text() === tag_name) {											
											$(this).remove();
											if(pn.children().length == 1) {										
												deleteTag(pn, sentenceIndex)
											}
										}										
									});
								}
								at[1].delete(tag_name)
								deleteNextTag(p.next(), sentenceIndex, wordIndex + 1, tag_name);
							}

							
						}

						(function() {
							var currentTag = entity_classes[tc];
							tag.on('click', function() {
								var p = $(this).parent();
								if(p.hasClass('tag-begin')) {
									annotatedTags[sentenceIndex][wordIndex][1].delete(currentTag);
									deleteNextTag(p, sentenceIndex, wordIndex + 1, currentTag);
									$(this).remove();
									if(p.children().length == 1) {										
										deleteTag(p, sentenceIndex)
									}
								}								
							});
						})();
						
						$selectedWords.append(tag);
					}

					annotatedTags[sentenceIndex][wordIndex][0] = prefix; //prefix + tc;//tagClass - 1;
					annotatedTags[sentenceIndex][wordIndex][1].add(entity_classes[tc]); 

				}
				
				
			}

			// Delete the tags of any selected elements.
			function deleteTags() {
				$selectedWords.each(function(e) {
					deleteTag($(this), sentenceIndex);

				});
			}	
		
			if(tagClass < 0) {
				deleteTags();				
			}

			// Ensure the tags display correctly when they are split between punctuation.
			// Iterate over all words in the sentence but only actually start on the word immediately before the start of the selection,
			// and end on the word immediately after the selection.
			var startIndex = b.index();
			var endIndex = e.index();

			currentTagSet = new Set();
			// Ensure the tags of each word are the same before proceeding. If they are not, remove all the tags and start over.
			$currentWords.each(function(e) {

				var i = $(this).index();
				if(i < startIndex) return;
				if(i > endIndex) return;

				thisWordsTags = annotatedTags[sentenceIndex][i][1]
				if(thisWordsTags.size == 0) {
					deleteTags();
					return;
				}

				if(currentTagSet.size == 0) {
					currentTagSet = thisWordsTags;					
				} else {
					for(var tag of thisWordsTags) {
						// console.log(tag)
						if(!currentTagSet.has(tag)) {
							deleteTags();
							return;
						}
					}
					for(var tag of currentTagSet) {
						if(!thisWordsTags.has(tag)) {
							deleteTags();
							return;
						}
					}
				}

			});

			$currentWords.each(function(e) {

				var i = $(this).index();
				var tags = [];

				if(i < startIndex - 1) return;
				if(i > endIndex + 1) return;

				//if($(this).hasClass("punctuation")) return;

				var t = $(this);

				if(i == startIndex - 1) { 
					// Change tag before start of selection to an ending tag if it does not have the same class as the selection.
					if(t.hasClass("tag")) {
						tags.push("tag-end");
					}
					
				} else if(i == endIndex + 1) {

					// Change tag after end of selection to a beginning tag if it does not have the same class as the selection.
					if(t.hasClass("tag")) {
						tags.push("tag-begin");
					}
					
					
				}
				if(t.is(b)) tags.push("tag-begin");
				if(!t.prev().hasClass("tag")) tags.push("tag-begin");
				if(!t.next().hasClass("tag")) tags.push("tag-end");
				//if(t.prev().hasClass("punctuation") && !t.is(b)) tags.push("tag-begin");						
				//if(t.next().hasClass("punctuation")) tags.push("tag-end");	
				
				// Add the beginning/end class to this tag if necessary.
				if($(this).hasClass("tag")) {
					for(var j in tags) {
						t.addClass(tags[j]);
					}
				}
				if(tags.includes("tag-begin")) var prefix = "B-";
				else var prefix = "I-";
				//var prefix = "";

				if(i < startIndex) return;
				if(i > endIndex) return;

					
				var tc =  entity_classes[$(this).attr("data-tag-class")] || [];
				if(tc == []) prefix = "";


				if(tagClass >= 0) {
					//prefix + tc;//tagClass - 1;
					addTags(prefix, sentenceIndex, i);
				} else {
					annotatedTags[sentenceIndex][i] = [null, new Set()];
				}
			
					
				
			
			});

			// console.log(annotatedTags);
			
			

			if(moveAfterwards) {
				$(".word").removeClass("selected");
				moveForwards();
			}
		}

		// Highlights the currently selected word(s). 
		// 'direction' can be either 'forwards' or 'backwards'. 
		function highlightSelected(direction) {
			var arr = $('span.word.selected');
			if(!chaining) {								
				$("#sentence-tagging span").removeClass("selected");
				chainStart = -1;
			} else {		
				var last = $(arr[arr.length-1]);
				var first = $(arr[0]);

				if(direction == "forwards") {
					if($('span.selected').length == 1) {
						chainStart = wordIndex;
						chainType = "forwards";
					}
					if(chainType == "forwards") {
						if(first.index() < chainStart - 1) {
							first.removeClass("selected");
						}
					} else {
						if(first.index() < chainStart) {
							first.removeClass("selected");
						}												
					}

				} else if (direction == "backwards") {
					if($('span.selected').length == 1) {
						chainStart = wordIndex + 1;
						chainType = "backwards";
					}
					if(last.index() >= chainStart && chainType == "forwards") {
						last.removeClass("selected");
					}
				}
			}
			
			var selectedWord = getSelectedWord();
			selectedWord.addClass("selected");
			var oft = selectedWord.offset().top;
			// If the currently selected word is not in view, scroll to it.
			/*if($(window).height() - (oft - $("body").scrollTop()) < 150 || $("body").scrollTop() - oft > -150) {
				if(currentlyScrolling) {
					$("html, body").scrollTop(oft - 150);
				} else {
					currentlyScrolling = true;
					$("html, body").animate({
						scrollTop: oft - 150
					}, 200, finishedScrolling);
				}
			}*/
			
			// Refresh the tagging menu 
			var arr = $('span.word.selected');
			var tokens = [];
			arr.each(function() {
				tokens.push($(this).text());
			})
			
				
				//tokens.push(arr[i]);
			
			refreshTokensInfo(tokens.join(" "));
			//refreshTree(arr.first().attr("data-node-id")); // Update the tree whenever a new selection is highlighted.
		}

		function scrollToSentence() {
			/*if(currentlyScrolling) {
				$("html, body").scrollTop($currentSentence.offset().top - 150)
			} else {
				currentlyScrolling = true
				$("html, body").animate({
					scrollTop: $currentSentence.offset().top - 150
				}, 200, finishedScrolling);
			}*/
		}

		// Jumps to the sentence with the index of sentenceIndex.
		function gotoSentence(preventScroll) {				
			// Update sentence, words, and sentence lengths
			$currentSentence = st.children().eq(sentenceIndex);
			$currentWords = $currentSentence.children();				
			sentenceLength = calculateSentenceLength();

			$(".sentence").removeClass("selected");
			$currentSentence.addClass("selected");
			if(!preventScroll) scrollToSentence();												
			
		}

		$("#submit-annotations").on('click', function() {
			submitAnnotations(function(err) {
				if(err) { alert(err) } // TODO: Handle this appropriately
				else {
					loadGroup();
				}
			});
			$(this).blur();
		});

		// Move to the next sentence.
		function nextSentence() {
			if(sentenceIndex < numberOfSentences - 1) {
				sentenceIndex++								
				gotoSentence();
				wordIndex = -1;
				moveForwards();
			} //else {
//
//				submitAnnotations(function(err) {
//					if(err) { alert(err) } // TODO: Handle this appropriately
//					else {
//						loadGroup();
//					}
//				});						
//			}
		}

		// Move to the previous sentence.
		function previousSentence() {
			if(sentenceIndex > 0) {
				sentenceIndex--;
				gotoSentence();			
				wordIndex = sentenceLength;
				moveBackwards();
			}
		}

		// Move forwards by one word. If there is punctuation, move forwards again. Highlight the word after moving.
		function moveForwards() {
			wordIndex++;
			if(wordIndex >= sentenceLength)	nextSentence();
			highlightSelected("forwards");
			if($($currentWords[wordIndex]).hasClass("punctuation")) {
				return moveForwards();
			}
		}

		// Move backwards by one word. If there is punctuation, move backwards again. Highlight the word after moving.
		function moveBackwards() {
			wordIndex--;
			if($($currentWords[wordIndex]).hasClass("punctuation")) {
				return moveBackwards();
			}
			if(wordIndex < 0 && sentenceIndex > 0) previousSentence();
			if(wordIndex == -1) wordIndex = 0;
			highlightSelected("backwards");
		}



		// Display the tagging window overlay (the information about the tokens that are currently selected).
		function refreshTokensInfo(tokens) {

			// Query Wikipedia for the currently selected tokens.
			function queryWikipedia(next) {

				// Processes the result of a Wikipedia query.
				function getResult(data, next) {
					function stripTags(str) {
						return str.replace(/<\/?[^>]+(>|$)/g, "");
					}
					try {
						var title = data.query.search[0].title;
						var snippet = stripTags(data.query.search[0].snippet);
						var wurl = "https://en.wikipedia.org/wiki/" + data.query.search[0].title.replace(/ /g, '_');
						return next(title, snippet, wurl);
					} catch(err) {
						// console.log("No article found.");
						next();
					}
				}
				$.ajax({
					url: 'http://en.wikipedia.org/w/api.php',
					data: { action: 'query', list: 'search', srsearch: tokens, format: 'json' },
					dataType: 'jsonp',
					success: function(data) {
						getResult(data, next);
					}
	            });
			}	
			$taggingMenuMore.removeClass("show");
			$taggingMenuTokens.html(tokens);
			$taggingMenuSummary.html('<i class="fa fa-spin fa-cog"></i>&nbsp;&nbsp;Loading...');
			queryWikipediaId++;
			var queryId = queryWikipediaId;
			queryWikipedia(function(title, snippet, wurl) {
				if(queryId != queryWikipediaId) return; // Don't do anything if another query has happened since this one started.
				if(snippet) {
					if(title.toLowerCase() == tokens.toLowerCase()) $taggingMenuSummary.html(snippet + "...");						
					else $taggingMenuSummary.html('<span class="different">[' + title + ']</span> ' + snippet + "...");
					
					$taggingMenuMore.addClass("show");
					$taggingMenuReadMore.attr("href", wurl);
				}
				else $taggingMenuSummary.html("(No Wikipedia entry)");					
			});
		}

		// Refresh the tree and click on the tagClass corresponding to the first highlighted element's class.
		function refreshTree(tagClassElementId) {	

			var nodeid = "#" + tagClassElementId;
			var currentNode = "#" + $tree.jstree('get_selected')[0];

			


			// Clear the search window
			if($ecSearchForm.hasClass("searching")) {
				$ecSearch.val('');
				$ecSearch.submit();
			}

			// If the current node is the same as the new one, there's no need to refresh the tree.
			if(currentNode == nodeid) return;

			// Close the tree.
			$tree.jstree("close_all");
			$tree.jstree('deselect_node', currentNode)
			if(tagClassElementId === undefined) {
				scrollToNode($("#remove-label"), -100);
				return $tree.jstree('select_node', '#remove-label')
			}
			// Open all parents of the node, based on the tagClassMap
			var nodeNumber = $(currentNode).attr("data-index")//tagClassElementId.substr(3, tagClassElementId.length);

			$tree.jstree('select_node', nodeid)				
			$tree.jstree('open_node', nodeid);
			//if(parents.length == 0) { scrollToNode($(nodeid), -100) }
			
			var parents = $(nodeid).parents(".jstree-children:not(.jstree-container-ul)")
			if(parents.length > 0) scrollToNode($(nodeid).parents(".jstree-children").first().parent());
			else { scrollToNode($(nodeid), -100); }
			//console.log(parents, $(nodeid).parents(".jstree-children").first().parent(), "<>")


		}


		// Clear the search window.
		function clearSearch() {
			hotkeysCurrentlyDisabled--;
			$ecSearch.val('');
			$ecSearchForm.submit();
			$entityCategoriesWindow.removeClass("show");
		}
		$("#clear-search").on('click', clearSearch);

		// Scroll to the position of a node in the tree.
		function scrollToNode(node, offset=0) {					
			// Scroll to appropriate spot in the tree
			var postop = 0;
			if(node.position()) postop = node.position().top;	
			$tree.scrollTop($tree.scrollTop() + postop + offset);
		}
		// Initialise the mouse events, i.e. selecting tokens to tag them.
		function initMouseEvents() {

			// Apply tags to the current selection.
			function tagSelection() {

				// Get the starting and ending index of the selection.
				var start = $(window.getSelection().getRangeAt(0).startContainer.parentNode.parentNode);
				var end =   $(window.getSelection().getRangeAt(0).endContainer.parentNode.parentNode);
				var startIndex = start.data('ind');
				var endIndex = end.data('ind');

				// console.log(start, end, startIndex, endIndex)

				// Get the starting and ending index of the sentences containing the start and end of the selection.
				var startSentenceIndex = start.parent().data('ind');	// The starting sentence 
				var endSentenceIndex = end.parent().data('ind');		// The ending sentence

				// Some code to ensure the correct part of the sentence is selected when selecting multiple sentences at the same time.
				// Only one sentence can be selected at a time (the one initially clicked).
				var csi = -1;
				if(startSentenceIndex != initialSentenceIndex) csi = startSentenceIndex;
				if(endSentenceIndex != initialSentenceIndex) csi = endSentenceIndex;
				if(csi >= 0) {
					if(initialSentenceIndex < csi) endIndex = calculateSentenceLength();
			   		else if(initialSentenceIndex > csi) startIndex = 0;
			    }

				// Add the 'selected' class to all selected words.
				var sws = 0;
				var aws = [];
				for(var i = startIndex; i <= endIndex; i++) {						
					var sw = $($sentences[initialSentenceIndex]).children().eq(i);
						
					aws.push(sw);					
				}
				// Count number of words in selection.
				for(var i in aws) {
					if(aws[i].hasClass("word")) {
						sws++;
					}	
				}
				
				// Only continue to add the selected class to each word if there are actually any words in the selection.
				// Don't do anything if the user only selected punctuation.
				if(sws > 0) {
					$(".word").removeClass("selected");
					wordIndex = endIndex;
					var qt = [];
					for(var i in aws) {
						$(aws[i]).addClass("selected");
						if(aws[i].hasClass("word"))
							qt.push($(aws[i].children(".word-inner")).text());
					}
					sentenceIndex = initialSentenceIndex;
					//refreshTree(aws[0].attr("data-node-id"));
					$tree.jstree("close_all");
					var currentNode = "#" + $tree.jstree('get_selected')[0];
					$tree.jstree('deselect_node', currentNode)
					scrollToNode($("#remove-label"), -100);
					//$tree.jstree('deselect_node', currentNode)
					
					gotoSentence();
					refreshTokensInfo(qt.join(" "));
				}
				document.getSelection().removeAllRanges();	// Deselect all text afterwards.
			}

			var initialSentenceIndex = -1;
			$(".sentence span").unbind("mousedown");
			$(".sentence span").mousedown(function() {
				// Whenever a span is clicked, take note of the index of the sentence the user clicked on.
				initialSentenceIndex = $(this).closest(".sentence").data("ind");
			});
			
			$("#tagging-container").unbind("mouseup");
			$("#tagging-container").mouseup(tagSelection);
		}	
		
		// Initialise all the keyboard events.
		function initKeyboardEvents() {

			// Close the selected node in the tree.
			function closeTreeNode() {
				var $currentNode = $("#" + $tree.jstree('get_selected')[0]);
				if($currentNode.hasClass("jstree-open")) {
					$tree.jstree('close_node', $currentNode.attr('id'));
					scrollToNode($currentNode, -100);
				} else {
					var $parentNode = $currentNode.parents('.jstree-node').first();
					if($parentNode.length) {
						$tree.jstree('close_node', $parentNode.attr('id'));
						$tree.jstree('deselect_node',   $tree.jstree('get_selected')[0]);
						$tree.jstree('select_node', $parentNode.attr('id'));							
						scrollToNode($parentNode, -100);
					}
				}
			}

			// Open the selected node in the tree and select its first child.
			function openTreeNode() {
				var currentNode = "#" + $tree.jstree('get_selected')[0];
				//var hasChildren = $(currentNode).hasClass("jstree-closed");
				$tree.jstree('open_node', currentNode)
				//- if(hasChildren) {
				//- 	var firstChild = $(currentNode).children(".jstree-children").children().first().attr('id');
				//- 	$tree.jstree('deselect_node', currentNode);
				//- 	$tree.jstree('select_node', firstChild);
				//- }
			}

			// Move through the jstree in the specified direction.
			function moveThroughTree(direction) {
				var currentNode = $("#" + $tree.jstree('get_selected')[0]);
			
				var currentNodeIndex = currentNode.index();
				var parent = currentNode.parents(".jstree-children").first();
				var hasChildren = $(currentNode).hasClass("jstree-open");
				var nextNode = parent.children().eq(currentNodeIndex + (direction == "up" ? -1 : 1));

				if(direction == "down")	{					
					if(hasChildren) {
						nextNode = currentNode.children('.jstree-children').children('.jstree-node').first();
					}
					if(currentNodeIndex == $("#category-hierarchy-tree > ul.jstree-children > .jstree-node").length - 1
					   && parent.hasClass('jstree-container-ul')) {
						nextNode = $("#category-hierarchy-tree > ul.jstree-children > .jstree-node").first();
					}
				}
				if(direction == "up") {
					if(currentNodeIndex == 0) {
						nextNode = parent.prev();
					}
					if(nextNode.hasClass('jstree-open')) {
						nodeChildren = nextNode;
						while(nodeChildren.length) {
							nextNode = nodeChildren;
							nodeChildren = nextNode.children('.jstree-children').children('.jstree-node').last();
						}
					}
				}
						
				if(!nextNode.attr('id')) {
					if(direction == "up") {
						nextNode = parent.parents('.jstree-node').first().prev();
						if(!nextNode.length) nextNode = parent.children().last();
					} else {
						var nextNode = [];
						parent = parent.parents('.jstree-node').first();

						while(!nextNode.length) {
							nextNode = parent.next();
							parent = parent.parents('.jstree-children').first().parents('.jstree-node').first();
						}							
						
					}
				}

					//if(direction == "up") nextNode = parent.last();
					//else nextNode = parent.children().eq(0);	
				if(nextNode.attr('id')) {
					$tree.jstree('deselect_node', "#" + currentNode.attr('id'));
					$tree.jstree('select_node', "#" + nextNode.attr('id'));
				}
				if(nextNode.hasClass("jstree-hidden")) return moveThroughTree(direction);
				scrollToNode($(nextNode), -100); // Do it 4 times (perhaps there's a better way?)
			}


			const
			LEFT_ARROW = 37,
			UP_ARROW = 38,
			RIGHT_ARROW = 39,
			DOWN_ARROW = 40,
			ONE = 49,
			NINE = 57,
			SHIFT = 16,
			DELETE = 46,
			BACKSPACE = 8,
			Q = 81,
			T = 84,
			W = 87,
			S = 83,
			D = 68,
			A = 65,
			TILDE = 192,
			ENTER = 13,
			ESCAPE = 27;
			
			var map = { 37: false, 39: false, 16: false, 38: false, 40: false };
			$(document).unbind("keydown");
			$(document).unbind("keyup");
			$(document).keydown(function(e) {
				if(!loading && !ended) {
					if (e.keyCode in map) {
						if(e.keyCode == SHIFT) {
							chaining = true;
						}
						map[e.keyCode] = true;
						if (map[LEFT_ARROW]) {
							chaining = map[SHIFT];			
							moveBackwards();
						} else if (map[RIGHT_ARROW]) {
							chaining = map[SHIFT];
							moveForwards();
						}
					}	

					if(e.keyCode == DELETE || e.keyCode == TILDE) {
					 	$("#remove-label a").click();
					}
					if(e.keyCode == Q) {
					 	$ecSearch[0].focus();
					 	e.preventDefault();
					}

					if(e.keyCode == DOWN_ARROW) {			
						chaining = false;					
						nextSentence()
						wordIndex = -1;
						moveForwards()
					}
					if(e.keyCode == UP_ARROW) {
						chaining = false;
						previousSentence();
						wordIndex = -1;
						moveForwards()
					}
					if(hotkeysCurrentlyDisabled == 0) {
						if(e.keyCode == D) {
							openTreeNode();
							event.preventDefault();

						}
						if(e.keyCode == W) {
							moveThroughTree("up")
							e.preventDefault();	// TODO: Navigate through the tagging menu.
						}
						if(e.keyCode == S) {
							moveThroughTree("down")
							e.preventDefault();
						}

						if((e.keyCode == BACKSPACE || e.keyCode == A)) {// && "BACKSPACE" in hotkeyMap) {

							closeTreeNode();
							//var node = $("#" + hotkeyMap["BACKSPACE"]).children("a").first();
							//node.click();
							//scrollToNode(node.parents(".jstree-children").first().parent());
						}

						if(!hotkeysCurrentlyDisabled && (e.keyCode-48) in hotkeyMap) {	// Tag an element based on the hotkey pressed.
							var node = $("#" + hotkeyMap[e.keyCode-48]).children("a").first();								
							node.click();
							if(node.parent().hasClass("jstree-open"))
								scrollToNode(node.parent());								
						}
					}
					if(e.keyCode == ESCAPE) {	// TODO: Hide the category hierarchy.
						clearSearch();
					}
				}					
			}).keyup(function(e) {
				if (e.keyCode in map) {
					map[e.keyCode] = false;
				}
			});
		};


		
		function submitAnnotations(next) {

			// Unbind all key/mouse events while annotations are being submitted
			$(".sentence span").unbind("mousedown");
			$("#tagging-container").unbind("mouseup");
			$(document).unbind("keydown");
			$(document).unbind("keyup");
			// console.log("id:", documentGroupId);
			// console.log(annotatedTags)
			// console.log(csrfToken);
			for(var i = 0; i < annotatedTags.length; i++) {
				for(var j = 0; j < annotatedTags[i].length; j++) {
					// if(annotatedTags[i][j][0] == null) {
					// 	annotatedTags[i][j] = "O";
					// } else {
						annotatedTags[i][j][1] = Array.from(annotatedTags[i][j][1])
					// }
				}
			}
			
			console.log(annotatedTags)
			$.ajax({
				url: 'tagging/submitAnnotations',
				method: 'post',
				dataType: "json",
				headers: { 'csrf-token': csrfToken },
				data: {
					documentGroupId: documentGroupId,
					labels: annotatedTags
				},	
				success: function(data) {
					console.log("done!");
					next();
				},
				error: function(err) {
					next(err);
				}
		    });			

		}			

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		// Save the annotatedTags to a file.
		// TODO: Replace with AJAX POST to submit the annotations and save them to the database.
		//- function saveDataToFileOutput(dataFilename) {
		//- 	outputData = "";
		//- 	for(var i = 0; i < groupData.length; i++) {
		//- 		for(var j = 0; j < groupData[i].length; j++) {
		//- 			outputData += groupData[i][j] + " " + annotatedTags[i][j] + "\n";
		//- 		}
		//- 		outputData += "\n";
		//- 	}
		//- 	console.log(groupData);
		//- 	console.log(annotatedTags);
		//- 	var dlfile = document.createElement('a');
		//- 	dlfile.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(outputData));
		//- 	dlfile.setAttribute('download', dataFilename);
		//- 	var event = document.createEvent('MouseEvents');
		//- 	event.initEvent('click', true, true);
		//- 	dlfile.dispatchEvent(event);
		//- }

		//- function saveDataToFile() {
		//- 	var dataFilename = "annotated_data_" + 1 + ".txt"
		//- 	saveDataToFileOutput(dataFilename)
		//- }

	}






	initTagging();
	

}
