var colors = ["#99FFCC", "#FFCCCC", "#CCCCFF", "#CCFF99", "#CCFFCC", "#CCFFFF", "#FFCC99", "#FFCCFF", "#FFFF99", "#FFFFCC", "#CCCC99", "#fbafff"];
var currentColorIndex = 0;

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

// The category hierarchy.
class CategoryHierarchy {

  // tagging_version specifies whether not to include the 'rename' button, which should only be present when setting up the project initially.
  constructor(canRenameCategories = true, canCreateNewCategories = true, canDeleteCategories = true) {

    var t = this;
    // Code for tree found here:  
    // https://bl.ocks.org/mbostock/4339083
    this.margin = {top: 20, right: 120, bottom: 20, left: 120};
    if($("#svg-entity-categories").hasClass("large-left-margin")) {
      this.margin.left = 300;
    }
    this.width = 1520 - this.margin.right - this.margin.left;
    this.height = 700 - this.margin.top - this.margin.bottom;
    this.i = 0;
    this.duration = 750;
    this.root;
    var rooot = this.root;
    this.container;
    this.circleRadius = 16;
    this.tree = d3.layout.tree()
        .size([this.height, this.width]);

    this.diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    this.error_message = $("#category-hierarchy-error");
    this.error_message_inner = $("#category-hierarchy-error .message");



    // Returns a cleaned version of the name with whitespaces relaced with underscores. Replaces forward slashes with |
    function parseName(name) {
      return name.replace(/[^\S\n]/g, "_").replace(/\//g, "|");
    }

    // Creates a new node and updates the tree.
    function createNewNode(t, d, name, done) {
        validateName(d, parseName(name), function(err) {
          if(!err) {
            $(document).trigger("tree_modified");
         
            var newNode = {
                name: parseName(name) || "<New category>"
              };
            newNode._color = d._color;
            if(d == t.root)
              assignColor(newNode);
            if(!d._children && !d.children) {
              d.children = [];
            }
            if(!d._children){
              d.children.push(newNode);
            } else {
              d._children.push(newNode);
              t.click(d, t);
            }
            t.update(d);
          }
          done(err);
        });
    }

    function validateName(p, name, done) {
      if(name.trim().length == 0)
        return done("Error: name cannot be blank.");
      if(name.length > 100)
        return done("Error: name exceeds max length of 100 characters.");
      if(p.children) {
        for(var c of p.children) {
          if(c.name == name) return done("Error: name must be unique<br/>within this level of the hierarchy.")
        }
      } else if(p._children) {
        for(var c of p._children) {
          if(c.name == name) return done("Error: name must be unique<br/>within this level of the hierarchy.")
        }
      }
      return done(null);
    }

    // Renames the selected node to the name provided.
    function renameNode(d, name, done) {     
      validateName(d.parent, parseName(name), function(err) {
        $(document).trigger("tree_modified");
        if(!err) {
          d.name = parseName(name);
          t.update(d);          
        }
        done(err);
      });
      //sortTree();
    }

    // Deletes a node.
    function deleteNode(d, rootNode) {
      for (var ii = 0; ii < d.parent.children.length; ii++) {
        if (d.parent.children[ii].name === d.name) {
          d.parent.children.splice(ii, 1);
          break;
        }          
      }
      currentColorIndex = 0;
      rootNode.children.forEach(assignColor);
      //rootNode.children.forEach(collapse);
      rootNode.children.forEach(assignColorsToChildren);

      //rootNode.children.forEach(assignColorsToChildren);
      $(document).trigger("tree_modified");
      t.update(d);
    }

    // Displays an input box for the user.
    function showInput(next) {
      document.getElementsByClassName("d3-context-menu")[0].innerHTML = "<form id=\"new-node-form\"><label>Category name</label><input id='new-node-form-input' name='test'/><input type=\"submit\"/></form>";
      $("#new-node-form-input").focus();
      $("#new-node-form").on('submit', function(e) {
        var name = $("#new-node-form-input").val();
        e.preventDefault();
        return next(name);
      });      
    }

    function showError(err, next) {
      document.getElementsByClassName("d3-context-menu")[0].innerHTML = "<form id=\"new-node-form\"><label class=\"new-node-form-error\">" + err + "</label><input class=\"submit-fail\" type=\"submit\" value=\"OK\"/></form>";
      $("#new-node-form input").focus();
      $("#new-node-form").on('submit', function(e) {
        e.preventDefault();
        return next();
      }); 


    }

    // A context menu for the tree that calls the functions above.
    // https://github.com/patorjk/d3-context-menu
    this.menu = function(d) {
      var title = {
          title: function(d) { return d.name.replace(/\|/g, "/"); }//.replace(/\\\//g, '/'); }
      }
      var menu = [title];
      if(canCreateNewCategories) {
        var newChildCategory = {
          title: '<i class="fa fa-plus"></i>&nbsp;&nbsp;New child category',
          action: function(d, i, next) {
            var name = showInput(function(name) {
              createNewNode(t, d, name, function(err) {
                if(err) { showError(err, next) }
                else {
                  updateCategoryHierarchy(t.root);
                  next();
                }
              });            
            });
          }
        }
        menu.push(newChildCategory);
      }
      if(canRenameCategories) {
        var renameCategory = {
          title: '<i class="fa fa-edit"></i>&nbsp;&nbsp;Rename category',
          action: function(d, i, next) {
            var name = showInput(function(name) {
              renameNode(d, name, function(err) {
                if(err) { showError(err, next) }
                else {
                  updateCategoryHierarchy(t.root);
                  next();
                }
              });            
            });
          }
        }
        menu.push(renameCategory);
      }
      if(canDeleteCategories) {
        var deleteCategory = {
          title: '<i class="fa fa-trash"></i>&nbsp;&nbsp;Delete category',
          action: function(d, i, next) {
            deleteNode(d, t.root);
            updateCategoryHierarchy(t.root);
            next();
          }
        }
        menu.push(deleteCategory);
      }
      if(d == t.root) {
        return [
          title,
          newChildCategory
        ]
      }
      if(!canCreateNewCategories && !canDeleteCategories) return [];
      return menu;
    }
  }



  // Lighten or darken a colour.
  // https://css-tricks.com/snippets/javascript/lighten-darken-color/
  LightenDarkenColor(col, amt) {  
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

  // Toggle children on click.
  click(d, t) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    t.update(d);
  }

  // expand(d){   
  //     var children = (d.children)?d.children:d._children;
  //     if (d._children) {        
  //         d.children = d._children;
  //         d._children = null;       
  //     }
  //     if(children)
  //       children.forEach(expand);
  // }

  // expandAll(){
  //     this.expand(this.root); 
  //     this.update(this.root);
  // }

  // collapseAll(){
  //     this.root.children.forEach(collapse);
  //     this.collapse(this.root);
  //     this.update(this.root);
  //     this.click(this.root);
  // }

  // sortTree() {
  //     this.tree.sort(function(a, b) {
  //         return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
  //     });
  // }
  //sortTree();

  update(source) {

    var margin       = this.margin,
        width        = this.width,
        height       = this.height,
        circleRadius = this.circleRadius,
        duration     = this.duration,
        tree         = this.tree,
        diagonal     = this.diagonal,
        t            = this;

    // Compute the new tree layout.
    var nodes = tree.nodes(this.root).reverse(),
        links = tree.links(nodes);     




    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 180; });

    // Update the nodes…
    var node = this.container.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++t.i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        

    nodeEnter.append("circle")
        .attr("r", 1e-6 )
        .style("fill", function(d) { return d._children ? d._color : "#fff"; })
        .style("stroke", function(d) { return d._color; })
        .on("click", function(d) { t.click(d, t) })
        .on('contextmenu', d3.contextMenu(this.menu, function(d) {
          $(".d3-context-menu li.is-header").css("border-color", t.LightenDarkenColor(d._color, -20) || "#eee");
          $(".d3-context-menu li.is-header").css("background", d._color || "#eee");
        }));

    nodeEnter.append("text")
        .attr("x", function(d) { return d.children || d._children ? -circleRadius*1.5 : circleRadius*1.5; })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        .text(function(d) { return d.name })
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
        .text(function(d) { return d.name.replace(/\|/g, "/"); }); //.replace(/\\\//g, '/') })


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
    var link = this.container.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return t.diagonal({source: o, target: o});
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", t.diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = {x: source.x, y: source.y};
          return t.diagonal({source: o, target: o});
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
    
    //}

  }

  // Clears the tree and prints an error message if provided.
  clearTree(errmsg) {
    d3.select("#svg-entity-categories").html('');

    this.error_message.show();
    this.error_message_inner.html(errmsg);

  }



  buildTree(slash) {
    currentColorIndex = 0;

    this.error_message.hide();

    var margin    = this.margin,
        width     = this.width,
        height    = this.height,
        tree      = this.tree,
        t         = this;



    function zoomed() {
        t.container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
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
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")

    this.container = svg.append("g");

    var root = slash2json(slash);
    
    //var colors = ["#688024", "#9a35c9", "#5be34b", "#c75ff1", "#95d73f", "#5759e4", "#cbd429", "#8050c7", "#4db22c", "#d92eb3", "#6be279", "#e362db", "#b9d447", "#4957bc", "#eeca19", "#8878e8", "#99ad24", "#be79e4", "#3ab862", "#d84dac", "#3e8d29", "#a13ea2", "#84ba55", "#e64690", "#5ce0b2", "#e12e27", "#51d7df", "#e95314", "#5882e7", "#dac03e", "#80509f", "#e4a130", "#5e93df", "#e57e20", "#68cef1", "#ea5d3f", "#41b07e", "#e7386a", "#48b3a6", "#c62b3b", "#4aa1bc", "#ae4419", "#64a9de", "#a47e1c", "#ee83dd", "#35773e", "#ab367d", "#bacd6e", "#c66db8", "#aaa037", "#a089d5", "#e1be6a", "#4e61a1", "#e17e4a", "#3e8581", "#e55d62", "#6ba363", "#b83864", "#a1d393", "#e598e0", "#5a5d23", "#cc99d9", "#905d1c", "#babaee", "#d2944f", "#7a8bb8", "#9d4d2e", "#9cd5cd", "#a63c49", "#85ba96", "#de72a2", "#3b7a5e", "#d46c80", "#677e4f", "#955282", "#bcb472", "#725e7f", "#ecc38e", "#50748f", "#e38472", "#3d6362", "#e998b9", "#887e3e", "#e3b7e3", "#a27144", "#aac6de", "#8c4b59", "#c4c4a8", "#aa748b", "#7ca9a9", "#a5655b", "#d5c1d0", "#786353", "#e7baba", "#828c7b", "#d49299", "#a29a72", "#a591af", "#daa485", "#ac8b81"]
    root.x0 = height / 2;
    root.y0 = 0;


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
    //root.children.forEach(assignColorsToChildren);

    t.root = root;


    t.update(root, false);
    d3.select(self.frameElement).style("height", "800px");
    }
  

}


// Update the category hierarchy text field if it is present.
// Should only be called by createNewNode, rename, delete... not when the tree is updated via the category hierarchy itself.
function updateCategoryHierarchy(root) {
  if($("#entity-categories-textarea")) {
    $("#entity-categories-preset").val("no-preset")
    //$("#entity-categories-textarea").val(json2text(root).replace(/ /g, "\t"));
    $("#entity-categories-textarea").val(json2text(root));
  }
}





// Remove empty children from the JSON data.
function removeEmptyChildren(obj) {
  if(obj["children"].length == 0) {
    delete obj["children"];
  } else {
    for(var k in obj["children"]) {
      removeEmptyChildren(obj["children"][k]);
    }
  }
}

/* Conversion functions */


// Converts text into JSON format for visualisation by the tree. The text may look something like:
// category_1
//  category_1_child_1
//  category_1_child_2
// category_2
// category_3
// etc. Children are specified by spaces, as shown above.
// Algorithm adapted from here: https://stackoverflow.com/questions/25170715/creating-a-json-object-from-a-tabbed-tree-text-file
function txt2json(text) {
  var fieldname = "name";

  var lines = text.split('\n');  
  var depth = 0; // Current indentation
  var root = {
    "children": []
  };
  root["" + fieldname] = "entity";
  var parents = [];
  var node = root;
  var colorId = -1;
  for(var i = 0; i < lines.length; i++) {
    var cleanLine = lines[i].trim()//replace(/\s/g, "");
    var newDepth  = lines[i].search(/\S/) + 1;
    if(newDepth == 1) colorId++;
    if(newDepth < depth) {
      parents = parents.slice(0, newDepth);      
    } else if (newDepth == depth + 1) {      
      parents.push(node);
    } else if(newDepth > depth + 1){
      return new Error("Unparsable tree.");
    }
    depth = newDepth;
    node = {"children": []};
    node[fieldname] = cleanLine;
    if(parents.length > 0) {
      parents[parents.length-1]["children"].push(node);
    }
  }
  removeEmptyChildren(root);
  return root;
}

function slash2jstree(slash) {

  //https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
  String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
      chr   = this.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };

  var hotkeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  var text = slash2txt(slash);
  var fieldname = "text";
  var tagClassMap = {};
  var treeMap = {};
  var nodeIds = new Set();
  var reverseTreeMap = {};

  var lines = text.split('\n');  
  var depth = 0; // Current indentation
  var root = {
    "children": []
  };
  root["" + fieldname] = "entity";
  var parents = [];
  var parentIds = [];
  var node = root;
  var colorId = -1;

  for(var i = 0; i < lines.length; i++) {
    var originalLineHashed = slash[i].hashCode() // Hash the string so jQuery doesn't complain about the slashes in the ids
    var cleanLine = lines[i].trim()//replace(/\s/g, "");
    var newDepth  = lines[i].search(/\S/) + 1;

    if(newDepth == 1)  {
      colorId++;
    }
    if(newDepth < depth) {
      //console.log(cleanLine, parents.length, newDepth)
      parents = parents.slice(0, newDepth);      
      parentIds = parentIds.slice(0, newDepth);      
    } else if (newDepth == depth + 1) {      
      parents.push(node);
      parentIds.push(i-1);
      h = 0;
    } else if(newDepth > depth + 1){
      return new Error("Unparsable tree.");
    }

    depth = newDepth;
    node = {"children": []};
    node[fieldname] = cleanLine;// + '<span>' + hotkey + '</span>';
    var color = (colorId % colors.length) + 1;
    var hashed_id = "j1_" + (originalLineHashed)
    node["li_attr"] = { "data-index": i, "class": "color-" + color, "data-color": color, "data-full": slash[i], "id": hashed_id  };
    node["a_attr"] = { "id": "j1_" + (originalLineHashed) + "_anchor" };
    treeMap[i] = hashed_id;
    nodeIds.add(hashed_id);
    if(parents.length > 0) {
      parents[parents.length-1]["children"].push(node);
    }
    tagClassMap[i] = [];
    for(var j in parentIds) {
      if(j == 0) continue;
      tagClassMap[i].push(parentIds[j]);
    }
    h++;
  }
  removeEmptyChildren(root);
  var data = [];
  data.push( { "text": "(No label) <span class=\"no-label\">~</span>", "li_attr": { "id": "remove-label", "data-index": -1, "data-full": "" } })
  for(var i in root.children) {
    data.push(root.children[i]);
  }
  // Add the appropriate hotkey to the node inside a span tag.
  function addHotkey(node, i) {
    node["text"] = node["text"] + (i < hotkeys.length ? '<span>' + hotkeys[i] + '</span>' : '<span class="hide"></span>');
    for(var i in node.children) {
      addHotkey(node.children[i], i);
    }    
  }
  // Shorten a name to ensure it fits on the tree.
  // Depth is considered 2 characters per level, and having children takes up 3 characters.
  function shortenName(node, depth) {
    var maxlength = 20;
    var extra = 2 * depth;
    if(node.children) extra += 3;
    if(node[fieldname].length + extra > maxlength) {
      node.li_attr["title"] = node[fieldname];
      node[fieldname] = node[fieldname].substr(0, maxlength - extra) + "...";
    }
    for (var i in node.children) {
      shortenName(node.children[i], depth+1);
    }    
  }
  for(var i in data) {
    if(i == 0) continue;
    shortenName(data[i], 0);
    addHotkey(data[i], i-1);    
  }
  
  return { "data": data, "tagClassMap": tagClassMap, "treeMap": treeMap, "nodeIds": nodeIds };
}

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
    var cleanLine = lines[i].replace(/\s/g, "").replace(/\//g, '|');
    var newDepth  = lines[i].search(/\S/) + 1;
    if(newDepth < depth){
      parents = parents.slice(0, newDepth-1);
    } else if (newDepth == depth + 1) {
      parents.push(prev);
    } else if(newDepth > depth + 1) {
      //return new Error("Unparsable tree.");
    }
    depth = newDepth;
    prev = cleanLine;
    slashData.push(parents.join("/") + (parents.length > 0 ? "/" : "") + cleanLine);
  }
  return slashData;
}


function json2slash(json) {
  var txt = json2text(json);
  var slash = txt2slash(txt);
  return slash;
}

function json2text(root) {
  var allNodes = [];
  var depth = 1;
  function addNode(d) {
    allNodes.push((new Array(depth).join(" ")) + d.name.replace(/\|/, '/'));
    if(d.children) {
      depth++;
      d.children.forEach(addNode);
      depth--;
    }
    else if(d._children) {
      depth++;
      d._children.forEach(addNode);
      depth--;
    }    
  }
  if(root.children)
    root.children.forEach(addNode);
  else if(root._children) 
    root._children.forEach(addNode);

  return allNodes.join("\n");
}

function slash2json(slash, fieldname) {
  return txt2json(slash2txt(slash), fieldname, slash);
}

function slash2txt(slash) {
  var txt = [];
  for(var i = 0; i < slash.length; i++) {
    txt.push(slash[i].replace(/[^\/]*\//g, ' ')); // Replace any forwardslashes+text with a space.
  }
  return txt.join("\n");
}