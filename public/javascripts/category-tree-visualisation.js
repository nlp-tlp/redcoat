  // Code for tree found here:
  // https://bl.ocks.org/mbostock/4339083
var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = 1520 - margin.right - margin.left,
    height = 650 - margin.top - margin.bottom;

var i = 0,
    duration = 750,
    root;

var circleRadius = 16;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });


function buildTree(txt) {

  function zoomed() {
      container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }

  var zoom = d3.behavior.zoom()
    .scaleExtent([0.25, 4])
    .on("zoom", zoomed);

  d3.select("#svg-entity-categories").html('');
  var svg = d3.select("#svg-entity-categories")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .call(zoom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  var container = svg.append("g");

  var root = txt2json(txt);

  var colors = ["#99FFCC", "#FFCCCC", "#CCCCFF", "#CCFF99", "#CCFFCC", "#CCFFFF", "#FFCC99", "#FFCCFF", "#FFFF99", "#FFFFCC", "#CCCC99", "#fbafff"].reverse();
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
    d._color = colors.length > 0 ? colors.pop() : "steelblue";
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
  update(root);


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

  function update(source) {

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

      console.log(d);
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
  }



  function renameNode(selected, name) {
    selected.name = parseName(name);
    sortTree();
    update(selected);
  }

  function deleteNode(d) {
    if(d.parent == root) {
      colors.push(d._color);
    }
    for (var ii = 0; ii < d.parent.children.length; ii++) {
      if (d.parent.children[ii].name === d.name) {
        d.parent.children.splice(ii, 1);
        break;
      }          
    }
    update(d);
  }

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
  return root;
}

buildTree(txt);
