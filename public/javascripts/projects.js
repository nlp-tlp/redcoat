$.cookie.json = true;		
		$(document).ready(function() {



			var categoryHierarchy = new CategoryHierarchy(); // To display for a particular project

			// Initialise the annotationsTable (the table of annotators and their annotations)
			var $projectListEles = $("#project-list, #sidenav-project-list, #header-project-list");
			var $projectDetailsEles = $("#project-details, #sidenav-project-details, #header-project-details");
			var $annotationsTable = $("#annotations-table");
			var $invitationsTable = $("#invitations-table");
			var $annotationsDataTable = $annotationsTable.dataTable({
				data: [],
				columns: [
					{data: "username", title: "Username"},
					{data: "docgroups_annotated_this_project_count", title: "# Annotations"},
					{data: "download_link", title: ""}
				],
				columnDefs: [
					{"targets": 0, "width": "30%"},
					{"targets": 1, "width": "60%"},
					{ "targets": 2,
					  "width": "10%",
					  "render": function(data) {

					  	if(!data.enough_annotations) {
					  		return ''; // href="#{base_url}projects/' + data['project_id'] + '/download_annotations?user=' + data['user_id'] + '
					  	}
					  	//return '<span class="right list-show"><a role=\"button\" onclick=\"return downloadAnnotations(\'' + data['project_id'] + '\', \'' + data['user_id'] + '\')\" href=\"javascript:void(0)\" class="button download-annotations-button"><i class="fa fa-lg fa-download"></i>&nbsp;&nbsp;Download</a></span>';
					  	return '<span class="right list-show"><a href=\"projects/' + data['project_id'] + '/download_annotations/' + data['user_id'] + '\" class="button download-annotations-button"><i class="fa fa-lg fa-download"></i>&nbsp;&nbsp;Download</a></span>';
					  	}
					}					
				],
				language: {
			        	"info": "Showing _START_ to _END_ of _TOTAL_ annotators",
			        	"paginate": {
			        		"previous": "<i class='fa fa-chevron-left'></i>",
			        		"next": "<i class='fa fa-chevron-right'></i>"
			        	}
			    },

			});


			var $invitationsDataTable = $invitationsTable.dataTable({
				data: [],
				columns: [
					{data: "email", title: "Email address"},
					{data: "_id", title: "", defaultContent: ""},
					{data: "status", visible: false, searchable: true},
				],
				columnDefs: [
					{"targets": 0, "render": function(data, type, row) {

						var username = row['username'];
						if(username) {
							//username = "(<a>" + username + "</a>)"; // TODO: Add link to user profile
							username = "(" + username + ")";
						} else {
							username = "<span class='data-unknown'>(not registered)</span>"
						}
						return data + " " + username;
					}},
					{"targets": 1, "render": function(data) { return ''; } }		

				],
				"orderFixed": [2, 'asc'],
				language: {
			        	"info": "Showing _START_ to _END_ of _TOTAL_ invitations",
			        	"paginate": {
			        		"previous": "<i class='fa fa-chevron-left'></i>",
			        		"next": "<i class='fa fa-chevron-right'></i>"
			        	}
			    },
			    "rowGroup": {
		        	dataSrc: "status",
		        	"startRender": function(rows, group) {
					  	return group;
					}
			    },
			});



			// Initialise the annotatorsTable (the table of *all* annotators of the project)


			// Clear the hash in the URL.
			function clearHash() {
				history.pushState("", document.title, window.location.pathname + window.location.search);
			}

			// Initialise the projects table.
			function initProjectsTable(next) {

			    // Keep track of the field to sort by, and the sortOrder ('asc' or 'desc')
				var sortedBy = "Date created";
				var sortedById = 4;
				var sortOrder = "desc";
				var filterBy = null;
				var display = null;

				// If the user has visited this page before, load the sort/filtering parameters from a cookie.
				(function loadParamsFromCookie() {
					var c = $.cookie('projectsTableParams')
					if(!c) return;
					display = c.display;
					sortedBy = c.sortedBy;
					sortedById = c.sortedById;
					sortOrder = c.sortOrder;
					filterBy = c.filterBy;
					// Modify the relevant elements to display the options stored in the cookie.
					$("#projects-sort option[value='" + sortedById + "']").attr('selected', 'selected');
					if(sortOrder == "asc") {
						$("#sort-order-button .fa").addClass("fa-sort-up");
						$("#sort-order-button .fa").removeClass("fa-sort-down");
					}
					$('#projects-filter option[value="' + filterBy + '"]').attr('selected', 'selected');
					$('#projects-display option[value="' + display + '"]').attr('selected', 'selected');
				})();

				// Save the sort/filtering parameters to a cookie.
				function saveParamsToCookie() {
					$.cookie('projectsTableParams', {
						display: display,
						sortedBy: sortedBy,
						sortedById: sortedById,
						sortOrder: sortOrder,
						filterBy: filterBy,
					}, { expires: 365 });
				}

				// Create the dataTable.


				var $loadingTable = $("#loading-table");
			    var dataTable = $('#projects-table').DataTable( {
			        "ajax": {
			        	"url": "projects/getprojects",
			        	"dataSrc": "projects"
			        },
			        "columnDefs": [
			        	{ "title": "Name", "targets": 0, "width": "35%",
			        	 "render": function(data, type, row) {
							if ( type === "sort" || type === 'type' || type === "search" ) { // Ensure it sorts in the correct order, irrespective of html tags.
								return data;
							}
							return data + '<span class="right detailed-show"><a href="' + BASE_URL + 'projects/' + row["_id"] + '/tagging" class="button goto-tagging-button"><i class="fa fa-lg fa-pencil"></i>Annotate project</a></span>';
			        	 }

			        	 },
			        	{ "title": "Date created", "targets": 1, "width": "15%" ,
			        	  "render": function(data, type, row) {
			        	    if ( type === "sort" || type === 'type' || type === "search" ) {
								return row["_created_at"]; // Sort by actual created_at date, not the nicely-formatted one.
							}
			        	  	return '<span class="list-show">' + data.match(/[^\s]+/)[0] + '</span>';

			        	  }

			        	},			        	 
			        	{ "title": "Annotators", "targets": 2, "width": "15%", "className": "dt-center", "type": "numeric",
			        	 "render": function (data, type, row) {
							if ( type === "sort" || type === 'type' || type === "search" ) { // Ensure it sorts in the correct order, irrespective of html tags.
								return data;
							}
			        	 	return '<span class="detailed-table">' +
			        	 		   '<span class="detailed-show">' +
			        	 		   '<em>\"' + row['project_description'] + '\"</em>' +
			        	 		   '</span>' +
			        	 		   '<span class="list-show">' + data + ' <i class="fa fa-xs fa-xxs fa-user"></i></span>' +
			        	 		   '<span class="detailed-show">' + data + ' annotator' + (data > 1 ? "s" : "") + '</span>' +
			        	 		   '</span>';
			        	 }
			        	},

			        	{ "title": "Progress", "targets": 4, "width": "50%", "type": "numeric",
						 "render": function ( data, type, row ) {
							if ( type === "sort" || type === 'type' || type === "search" ) { // Ensure it sorts in the correct order, irrespective of html tags.
								return data;
							}
						 	//var nd = row["file_metadata"]["Number of documents"] * 3;
							return '' +
								   '<span class="detailed-fullwidth">' +
								   '<span class="progress-bar thin coloured green"><span class="inner" style="width: ' + row["percent_complete_yours"] + '%">&nbsp;</span></span>' +
								   '<span class="progress-bar thin coloured"><span class="inner" style="width: ' + data + '%">&nbsp;</span></span></span>' +						   
								   '<span class="detailed-fullwidth detailed-show">' +								   
								   '<ul class="metadata">' +
								   '<li> Filename: ' + row["file_metadata"]["Filename"] + '</li>' +
								   '<li> Number of documents: ' + row["file_metadata"]["Number of documents"] + '</li>' +
								   '<li> Number of tokens: ' + row["file_metadata"]["Number of tokens"] + '</li>' +
								   '<li> Average tokens/document: ' + row["file_metadata"]["Average tokens/document"] + '</li>' +
								   '</ul></span>' +
								   '<span class="detailed-fullwidth detailed-show">' +
								   '<ul class="metadata" style="margin-bottom: 0px">' +
								   '<li>Created on ' + row["created_at"] + '</li></ul></span>'
								   '';
							}
						},
						{ "targets": 7,
						  "render": function(data) {
						  	return '<span class="right list-show"><a href="' + BASE_URL + 'projects/' + data + '/tagging"class="button goto-tagging-button"><i class="fa fa-lg fa-pencil"></i></a></span>';
						  }
						},
			        ],
			        "columns": [
			            { "data": "project_name" },
			            { "data": "created_at" },
			            { "data": "num_annotators" },	
			            { "data": "percent_complete_yours", "sortable": true, "searchable": false, visible: false},		           
			            { "data": "percent_complete" },
			            { "data": "owner", "visible": false, "searchable": true},
			            { "data": "project_description", "visible": false, "sortable": false, "searchable": true},
			            { "data": "_id", "sortable": false, "searchable": false},
			            
			        ],
			        "order": [[sortedById, sortOrder]],
			        "orderFixed": [5, 'desc'],
			        "rowGroup": {
			        	dataSrc: "owner",
			        	"startRender": function(rows, group) {
			        		var orderText = sortOrder == "asc" ? 'Ascending' : 'Descending';
			        		if(sortedById == 1) orderText = sortOrder == "asc" ? "Oldest first" : "Newest first";
						  	return "" + group + ' <span class="sort-info">Sorted by <span class="sorted-by">' + sortedBy + '</span> <span class="sort-order">(' +
						  		orderText + ')</span></span>';
						}
			        },
			        "language": {
			        	"info": "Showing _START_ to _END_ of _TOTAL_ projects",
			        	"infoFiltered": "(filtered from _MAX_ projects)",
			        	"paginate": {
			        		"previous": "<i class='fa fa-chevron-left'></i>",
			        		"next": "<i class='fa fa-chevron-right'></i>"
			        	}

			        },
			        "initComplete": function() {
			        	initComplete();	// Call a function that calls the callback function. This ensures the table is created before proceeding with the rest of the code.
			        },
			        "drawCallback": function() {
			        	// Prevent the tagging buttons from propagating to the table row click events when clicked.
			        	$(".goto-tagging-button").on('click', function(e) {
			        		e.stopPropagation();
			        	})
			        	saveParamsToCookie(); // Save params to the cookie whenever the table is redrawn.
			        }
			    } );


				// Sort the table based on the sort order of the button.
				function sortTable() {
					sortedBy   = $("#projects-sort :selected").text();
					sortedById = parseInt($("#projects-sort").val());
					dataTable.order([ [ sortedById, sortOrder ] ]).draw();
				}

				// Update the sort order ('asc' or 'desc').
				function swapSortOrder() {
					sortOrder = sortOrder == "asc" ? "desc" : "asc";
					if(sortOrder == "desc") {
						$("#sort-order-button .fa").removeClass("fa-sort-up");
						$("#sort-order-button .fa").addClass("fa-sort-down");
					} else {
						$("#sort-order-button .fa").removeClass("fa-sort-down");
						$("#sort-order-button .fa").addClass("fa-sort-up");				
					}					
				}

			    // Search box
				$("#projects-search").on("keyup search input paste cut", function() {
				   dataTable.search(this.value).draw();
				});    

				// Filter box
				$("#projects-filter").on("change", function() {
					filterBy = $(this).val();
					dataTable.column(4).search(filterBy).draw();
				});

				// Sort box
				$("#projects-sort").on("change", function() {
					var f = parseInt($(this).val());					
					sortTable();
				});

				// Sort button (next to sort box)
				$("#sort-order-button").click(function() {
					swapSortOrder();
					sortTable();
				});

				// Change the display to list or detailed view, and save the current view option to the cookie.
				function changeDisplay(d) {
					if(d == "list") $("#projects-table").removeClass("detailed-view");
					else $("#projects-table").addClass("detailed-view");
					display = d;
					saveParamsToCookie();
				}

				// Display box (list or detailed view)
				$("#projects-display").on("change", function() {
					changeDisplay($(this).val());
				});

				// Refresh table upon accepting invitation
				$("#invitations-menu button").click(function(e) {
					
					$("#projects-table_info").removeClass("loaded");
					$loadingTable.addClass("show");
					$("#projects-table").addClass("not-loaded");
					$("#project-details").addClass("not-loaded");
					if($(this).attr('formaction') == "/accept") {
						$('#projects-table').DataTable().clear()
						setTimeout(function() {

						$('#projects-table').DataTable().ajax.reload(initComplete).draw() //ajax.reload().draw();
						
						}, 500) // TODO: Make this only load when invitation has been processed
					}
					

				});

				// Modify table depending on whether filterBy and display exist (from the cookie)
				if(filterBy) dataTable.column(4).search(filterBy).draw();				
				if(display) changeDisplay(display);

				function initComplete() {
					$loadingTable.removeClass("show");
					$("#projects-table_info").addClass("loaded");
					$("#projects-table").removeClass("not-loaded");
					$("#project-details").removeClass("not-loaded");

					next(dataTable);
				}


			}

			// Initialise the page display (the ability to click on a project and view its details, hierarchy, etc).
			function initPageDisplay(dataTable) {

				var $detailEles = $('[id^="d-"]'); // All elements with ids starting with 'd-' should contain data relevant to the current project.
				var $apButton = $("#annotate-project-button");

				// Tabs that are admin-only, i.e. only the admin of a project may access.
				var $adminOnlyTabs = $(".admin-only-tab");

				// Displays the details page of a particular project.
				// Hides the projects list and projects lists sidenav.
				function displayProjectDetails(project) {


					function getProjectDetails(next) {
						$.ajax({
							url: 'projects/' + project._id,
							method: 'get',
							headers: { 'csrf-token': csrfToken },
							data: {							
							},	
							success: function(data) {
								console.log(data);
								$annotationsDataTable.DataTable().clear().columns.adjust().draw();
								$annotationsDataTable.DataTable().rows.add(data['annotations']).draw();

								$invitationsDataTable.DataTable().clear().columns.adjust().draw();
								$invitationsDataTable.DataTable().rows.add(data['invitations']).draw();

								//- $('#annotations-table').DataTable( {
								//- 	data: data,
								//- 	columns: [
								//- 		{title: "Username"},
								//- 		{title: "docgroups_annotated_count"}
								//- 	]
								//- });
								next();
							},
							error: function(err) {
								next(err);
							}
					    });
					}
					

					if(project.user_is_owner) {
						$adminOnlyTabs.removeClass("hide");

						getProjectDetails(function() {
							console.log("retrieved project details");
						});

					} else {
						$adminOnlyTabs.addClass("hide");
					}
					


					$projectListEles.removeClass("show");
					$projectDetailsEles.addClass("show");
					window.location.hash = project._id;
					categoryHierarchy.buildTree(project.category_hierarchy);
					$apButton.attr('href', BASE_URL + "projects/" + project._id + "/tagging");
					$detailEles.each(function(e) {
						var tid = $(this).attr('id').substr(2, $(this).attr('id').length);

						if($(this).attr('id') == "d-percent_complete_yours") {
							$(this).css('width', '' + project["percent_complete_yours"] + "%");
							$(this).html("You: " + project["percent_complete_yours"].toFixed(0) + "%");
							return;
						}

						// Handle the 'percent_complete' elements separately.
						if($(this).attr('id') == "d-percent_complete") {
							$(this).css('width', '' + project["percent_complete"] + "%");
							$(this).html("Global: " + project["percent_complete"].toFixed(0) + "%");
							return;
						}
						
						// Tables are generated differently to other tags.
						if($(this).prop('tagName') == "TABLE") {
							// Build table
							var tableHtml =  "<tbody>";
							for(var key in project[tid]) {
								tableHtml += "<tr>";
								tableHtml += "<td>" + key + "</td>";
								tableHtml += "<td>" + project[tid][key] + "</td>";
								tableHtml += "</tr>";
							}
							tableHtml += "</tbody>";
							$(this).html(tableHtml);
						} else {
							$(this).html((tid in project ? project[tid] : '<span class="data-unknown">(unknown)</span>'))			
						}
						
					});	
					window.scrollTo(0, 0);
				}

				// Displays the projects list.
				function displayProjectsList() {
					$("#d-percent_complete").css('width', '0%');	// Shrink the bar down to 0% so it grows when opening a new project.
					$projectListEles.addClass("show");
					$projectDetailsEles.removeClass("show");	
					clearHash();
				}

				// Event handler for the table rows to display their corresponding project details.
				$("#projects-table tbody").on("click", "tr", function(event){
					var d = dataTable.row(this).data();
					if(d) displayProjectDetails(d);			
				});

				// Go back to projects when the button is pressed.
				$("#back-to-projects").click(displayProjectsList);

				// If the page is loaded with a hash, load the corresponding project.
				function checkHash() {
					if(!window.location.hash) displayProjectsList();
					var data = dataTable.rows().data();
					var project = null;
					for(var i in data) {
						if(data[i]._id == window.location.hash.substr(1, window.location.hash.length)) {
							project = data[i];
						}
					}
					if(project) displayProjectDetails(project);
					else {
						displayProjectsList();
						clearHash();
					}
				};
				checkHash();
				// Also load the corresponding project if the hash is modified, such as when pressing Back in the browser.
				$(window).on('hashchange', function() {	
					checkHash();
				});
			}

			// Initialise the buttons on the side nav when looking at a particular project.
			(function initProjectDetailsButtons() {
				var $projectDetailsButtons  = $("#sidenav-project-details li:not(.disabled)");
				var $projectDetailsButtonsA = $("#sidenav-project-details li:not(.disabled) a");
				var $projectDetailsTabs     = $("#project-details .tab");

				function displayTab(index) {
					$projectDetailsTabs.removeClass('show');
					$projectDetailsButtons.removeClass('current');
					$($projectDetailsTabs[index]).addClass('show');
					$($projectDetailsButtons[index]).addClass('current');
				}

				$projectDetailsButtonsA.on('click', function(e) {
					displayTab($(this).closest('li').index());
					return false;
				});	

				// Event handlers for buttons on the details page.
				$("#jump-to-category-hierarchy").on('click', function() { displayTab(1); return false; });
			})();

			// Load the projectDetails page if the hash contains something on page load, otherwise show the list of projects.
			if(window.location.hash) $projectDetailsEles.addClass("show");
			else $projectListEles.addClass("show");

			// Initialise table first, then initialise page display
			initProjectsTable(
			initPageDisplay
			);



			// Decorate the header with random text
		    $("#background").lipsumBG(false, false);
		} );
