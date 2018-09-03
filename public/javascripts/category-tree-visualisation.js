  // Code for tree found here:
  // https://bl.ocks.org/mbostock/4339083
var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = 1520 - margin.right - margin.left,
    height = 800 - margin.top - margin.bottom;

var i = 0,
    duration = 750,
    root;

var circleRadius = 16;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

// Update the category hierarchy text field if it is present.
// Should only be called by createNewNode, rename, delete... not when the tree is updated via the category hierarchy itself.
function updateCategoryHierarchy(root) {
  if($("#entity-categories-textarea")) {
    $("#entity-categories-textarea").val(json2text(root).replace(/ /g, "\t"));
  }
}

function buildTree(txt) {

  function zoomed() {
      container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }

  var zoom = d3.behavior.zoom()
    .scaleExtent([0.25, 4])
    .on("zoom", zoomed);

  d3.select("#svg-entity-categories").html('');
  var svg = d3.select("#svg-entity-categories")
      .attr("width", "100%")
      .attr("height", "100%")
      .call(zoom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  var container = svg.append("g");

  var root = txt2json(txt);

  var currentColorIndex = 0;

  var colors = ["#99FFCC", "#FFCCCC", "#CCCCFF", "#CCFF99", "#CCFFCC", "#CCFFFF", "#FFCC99", "#FFCCFF", "#FFFF99", "#FFFFCC", "#CCCC99", "#fbafff"];


  //var colors = ["#688024", "#9a35c9", "#5be34b", "#c75ff1", "#95d73f", "#5759e4", "#cbd429", "#8050c7", "#4db22c", "#d92eb3", "#6be279", "#e362db", "#b9d447", "#4957bc", "#eeca19", "#8878e8", "#99ad24", "#be79e4", "#3ab862", "#d84dac", "#3e8d29", "#a13ea2", "#84ba55", "#e64690", "#5ce0b2", "#e12e27", "#51d7df", "#e95314", "#5882e7", "#dac03e", "#80509f", "#e4a130", "#5e93df", "#e57e20", "#68cef1", "#ea5d3f", "#41b07e", "#e7386a", "#48b3a6", "#c62b3b", "#4aa1bc", "#ae4419", "#64a9de", "#a47e1c", "#ee83dd", "#35773e", "#ab367d", "#bacd6e", "#c66db8", "#aaa037", "#a089d5", "#e1be6a", "#4e61a1", "#e17e4a", "#3e8581", "#e55d62", "#6ba363", "#b83864", "#a1d393", "#e598e0", "#5a5d23", "#cc99d9", "#905d1c", "#babaee", "#d2944f", "#7a8bb8", "#9d4d2e", "#9cd5cd", "#a63c49", "#85ba96", "#de72a2", "#3b7a5e", "#d46c80", "#677e4f", "#955282", "#bcb472", "#725e7f", "#ecc38e", "#50748f", "#e38472", "#3d6362", "#e998b9", "#887e3e", "#e3b7e3", "#a27144", "#aac6de", "#8c4b59", "#c4c4a8", "#aa748b", "#7ca9a9", "#a5655b", "#d5c1d0", "#786353", "#e7baba", "#828c7b", "#d49299", "#a29a72", "#a591af", "#daa485", "#ac8b81"]

  root.x0 = height / 2;
  root.y0 = 0;



  function showInput(next) {
    document.getElementsByClassName("d3-context-menu")[0].innerHTML = "<form id=\"new-node-form\"><label>Category name</label><input id='new-node-form-input' name='test'/><input type=\"submit\"/></form>";
    $("#new-node-form-input").focus();
    $("#new-node-form").on('submit', function(e) {
      var name = $("#new-node-form-input").val();
      e.preventDefault();
      return next(name);
    });
    /*
    window.setTimeout(function() {
      var name = "test";
      next(name);
    }, 3000)*/
    
  }

  // function removeChildren(d) {
  //   if(d.children) {
  //     d.children.forEach(removeChildren)
  //   }
  //   if(d._children) {
  //     d._children.forEach(removeChildren)
  //   }
  //   d.children = null;
  //   d._children = null;
  
  // }

  // https://github.com/patorjk/d3-context-menu
  var menu = [
    {
      title: function(d) { return d.name }
    },
    {
      title: '<i class="fa fa-plus"></i>&nbsp;&nbsp;New child category',
      action: function(d, i, next) {
        var name = showInput(function(name) {
          createNewNode(d, name);
          next();
        });
        //elm.closeMenu();
      }
    },
    {
      title: '<i class="fa fa-edit"></i>&nbsp;&nbsp;Rename category',
      action: function(d, i, next) {
        var name = showInput(function(name) {
          renameNode(d, name);
          next();
        });
        //elm.closeMenu();
      }
    },
    {
      title: '<i class="fa fa-trash"></i>&nbsp;&nbsp;Delete category',
      action: function(d, i, next) {
        console.log(i, d.parent);
        //removeChildren(d);
        // Remove this element from parent
        deleteNode(d);
        next();
      }
    }
  ]


  function assignColor(d) {
    d._color = colors.length > 0 ? colors[currentColorIndex % colors.length] : "steelblue";
    currentColorIndex++;
  }

  function assignColorsToChildren(d, i) {
    if (d._children) {
      for(var i = 0; i < d._children.length; i++) {
        d._children[i]._color = d._color;
      }
      d._children.forEach(assignColorsToChildren)
    }
  }

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }
  root._color = "#eee";

  root.children.forEach(assignColor);
  root.children.forEach(collapse);
  root.children.forEach(assignColorsToChildren);
  update(root, false);


  d3.select(self.frameElement).style("height", "800px");

  // https://css-tricks.com/snippets/javascript/lighten-darken-color/
  function LightenDarkenColor(col, amt) {
    
      var usePound = false;
    
      if (col[0] == "#") {
          col = col.slice(1);
          usePound = true;
      }
   
      var num = parseInt(col,16);
   
      var r = (num >> 16) + amt;
   
      if (r > 255) r = 255;
      else if  (r < 0) r = 0;
   
      var b = ((num >> 8) & 0x00FF) + amt;
   
      if (b > 255) b = 255;
      else if  (b < 0) b = 0;
   
      var g = (num & 0x0000FF) + amt;
   
      if (g > 255) g = 255;
      else if (g < 0) g = 0;
   
      return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
    
  }



  function update(source, generateHierarchyText=true) {



    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

    

    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 180; });

    // Update the nodes…
    var node = container.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        

    nodeEnter.append("circle")
        .attr("r", 1e-6 )
        .style("fill", function(d) { return d._children ? d._color : "#fff"; })
        .style("stroke", function(d) { return d._color; })
        .on("click", click)
        .on('contextmenu', d3.contextMenu(menu, function(d) {
          $(".d3-context-menu li.is-header").css("border-color", LightenDarkenColor(d._color, -20) || "#eee");
          $(".d3-context-menu li.is-header").css("background", d._color || "#eee");
        }));

    nodeEnter.append("text")
        .attr("x", function(d) { return d.children || d._children ? -circleRadius*1.5 : circleRadius*1.5; })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        .text(function(d) { return d.name; })
        .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle")
        .attr("r", circleRadius)
        .style("fill", function(d) { return d._children ? d._color : "#fff"; })
        .style("stroke", function(d) { return d._color; });

    nodeUpdate.select("text")
        .style("fill-opacity", 1)
        .text(function(d) { return d.name; })


    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = container.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });


    //console.log(source.length)
    //var txt = json2text(root);
    //if(generateHierarchyText) {
      updateCategoryHierarchy(root);
    //}

  }

  // Toggle children on click.
  function click(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
  }

  function expand(d){   
      var children = (d.children)?d.children:d._children;
      if (d._children) {        
          d.children = d._children;
          d._children = null;       
      }
      if(children)
        children.forEach(expand);
  }

  function expandAll(){
      expand(root); 
      update(root);
  }

  function collapseAll(){
      root.children.forEach(collapse);
      collapse(root);
      update(root);
      click(root);

  }

  function sortTree() {
      tree.sort(function(a, b) {
          return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
      });
  }
  sortTree();

  // Returns a cleaned version of the name with whitespaces relaced with underscores.
  function parseName(name) {
    return name.trim().replace(/\s+/g, "_");

  }


  function createNewNode(d, name) {
      //Adding a new node (as a child) to selected Node (code snippet)
      var newNode = {
          name: parseName(name) || "<New category>"
        };
      newNode._color = d._color;
      if(d == root)
        assignColor(newNode);

      //Creates a Node from newNode object using d3.hierarchy(.)
     // var newNode = d3.layout.hierarchy(newNode);

      //later added some properties to Node like child,parent,depth
      //newNode.parent = selected; 

      //Selected is a node, to which we are adding the new node as a child
      //If no child array, create an empty array

      if(!d._children && !d.children) {
        d.children = [];
      }


      if(!d._children){
        d.children.push(newNode);

        //selected._children = [];
        //selected.data._children = [];
      } else {
        d._children.push(newNode);
        click(d);
      }



      //Push it to parent.children array  
      //selected._children.push(newNode);

     // console.log("Children:", selected._children.length);
      //selected.data.children.push(newNode.data);

      //Update tree
      sortTree();
      update(d);


      // If category hierarchy text exists, write the text version of the tree to it

  }



  function renameNode(selected, name) {
    selected.name = parseName(name);
    sortTree();
    update(selected);
  }

  function deleteNode(d) {
    // if(d.parent == root) {
    //   colors.push(d._color);
    // }
    for (var ii = 0; ii < d.parent.children.length; ii++) {
      if (d.parent.children[ii].name === d.name) {
        d.parent.children.splice(ii, 1);
        break;
      }          
    }
    update(d);
  }


  // Return the text version of the tree


}




var txt = 
`accident_cause
 bodily_contact
 caught_between
 fall
  fall_from_heights
  fall_from_vehicle
 over_exertion
 recurrence
 stepping
 struck_by_object
 trip_and_fall
 vehicle_related
activity
 driving
 running
 walking
age_group
 age_15_24
 age_25_34
 age_35_44
 age_45_54
 age_55_64
 age_65_100
body_part
 arm
  elbow
   left_elbow
   right_elbow
  hand
   fingers
   left_hand
   right_hand
   thumb
    left_thumb
    right_thumb
  left_arm
  right_arm
  shoulder
   left_shoulder
   right_shoulder
  wrist
   left_wrist
   right_wrist
 back
  lower_back
  upper_back
 body
  chest
  stomach
  torso
 groin
 head
  ear
   left_ear
   right_ear
  eye
   left_eye
   right_eye
  mouth
  nose
 leg
  ankle
   left_ankle
   right_ankle
  calf
   left_calf
   right_calf
  foot
   left_foot
   right_foot
   toes
  knee
   left_knee
   right_knee
  left_leg
  right_leg
  thigh
   left_thigh
   right_thigh
 neck
equipment
 bund_wall
 cage
 cables
 catenery_cable
 chock
 chute
 filter
 headframe
 jumbo
 mechanical_equipment
  auger
  cavity_monitoring_system
  conveyor
  crusher
  pump
   sump_pump
  skip
 personal_protective_equipment 
 pipe 
gender
 female
 male
injury
 amputation
 bite
 bruises
  contusion
 burn
  electric_burn
  thermal_burn
 chemical_effect
 crush_injury
 dislocation
  displacement
 fracture
  break
 laceration
 loss_of_conciousness
 multiple_injuries
 muscle
  sprain
  strain
 puncture
 splinter
 unspecified_injuries
location
 camp_medical_centre
 kitchen
 office
person
 blast_guard
 blaster
 boilermaker
 chef
 contractor
 driller
 driver
 electrical_worker
 employee
 fitter
 individual
 injured_person
 maintainer
 offsider
 operator
 personnel
 process_worker
 service_crew
 spotter
 supervisor
 telehandler
 underground_operator
 worker
severity
 minor
 serious
 fatal
 ndi
vehicle
 light_vehicle
  car
  forklift
  man_car
  mine_car
  ute
  golf_buggy
 heavy_vehicle
  bogger
  continuous_miner
  dozer
  dump_truck
  excavator
  haul_truck
  scraper
  grader
unspecified_category`
var txt = "example";
// Converts text into JSON format for visualisation by the tree. The text may look something like:
// category_1
//  category_1_child_1
//  category_1_child_2
// category_2
// category_3
// etc. Children are specified by spaces, as shown above.
// Algorithm adapted from here: https://stackoverflow.com/questions/25170715/creating-a-json-object-from-a-tabbed-tree-text-file
function txt2json(text) {
  var lines = text.split('\n');  
  var depth = 0; // Current indentation
  // var slashData = [];
  var root = {
    "name": "entity",
    "children": []
  };
  var parents = [];
  var node = root;
  for(var i = 0; i < lines.length; i++) {
    var cleanLine = lines[i].replace(/\s/g, "");
    var newDepth  = lines[i].search(/\S/) + 1;
    if(newDepth < depth) {
      parents = parents.slice(0, newDepth);
    } else if (newDepth == depth + 1) {
      parents.push(node);
    } else if(newDepth > depth + 1){
      return new Error("Unparsable tree.");
    }
    depth = newDepth;

    // parentNames = [];
    // for(var i = 0; i < parents.length; i++) {
    //   parentNames.push(parents[i].name)
    // }
    // slashData.push(parentNames.join("/") + cleanLine);

    node = {"name": cleanLine, "children": []};
    if(parents.length > 0)
      parents[parents.length-1]["children"].push(node);
  }
  // Remove empty children
  function removeEmptyChildren(obj)
  {
    if(obj["children"].length == 0) {
      delete obj["children"];
    } else {
      for(var k in obj["children"]) {
        removeEmptyChildren(obj["children"][k]);
      }
    }
  }
  removeEmptyChildren(root);
  // console.log(slashData);

  return root;
}

buildTree(txt);


// Converts 'space' notation to 'slash' notation, e.g.
// person
//  president
//   president_of_us
//  burgerflipper
// ... becomes ->
// person
// person/president
// person/president/president_of_us
// person/burgerflipper
function txt2slash(text) {
  var lines = text.split('\n');  
  var slashData = [];
  var depth = 1;
  var parents = [];
  var prev = "";
  for(var i = 0; i < lines.length; i++) {
    var cleanLine = lines[i].replace(/\s/g, "");
    var newDepth  = lines[i].search(/\S/) + 1;
    if(newDepth < depth){
      parents = parents.slice(newDepth, parents.length);
    } else if (newDepth == depth + 1) {
      parents.push(prev);
    } else if(newDepth > depth + 1) {
      return new Error("Unparsable tree.");
    }
    depth = newDepth;
    prev = cleanLine;
    slashData.push(parents.join("/") + (parents.length > 0 ? "/" : "") + cleanLine);
  }
  return slashData;
}


function json2slash(json) {

}

function json2text(root) {

  var allNodes = [];

  var depth = 1;
  function addNode(d) {
    allNodes.push((new Array(depth).join(" ")) + d.name);
    if(d.children) {
      depth++;
      d.children.forEach(addNode);
      depth--;
    }
    else if(d._children) {
      depth++;
      d._children.forEach(addNode);
      depth--;
    } else {
    }
    
  }

  root.children.forEach(addNode);
  return allNodes.join("\n");

}