// Remove empty children from the JSON data.
var removeEmptyChildren = function(obj) {
  if(obj["children"].length == 0) {
    delete obj["children"];
  } else {
    for(var k in obj["children"]) {
      removeEmptyChildren(obj["children"][k]);
    }
  }
}

module.exports.slash2txt = function(slash) {
  var txt = [];
  for(var i = 0; i < slash.length; i++) {
    txt.push(slash[i].replace(/[^\/]*\//g, ' ')); // Replace any forwardslashes+text with a space.
  }
  return txt.join("\n");
}

module.exports.txt2json = function(text, slash, descriptions={} ) {
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
    node = {"id": i, "children": [], "colorId": colorId};
    node[fieldname] = cleanLine;
    node['full_name'] = slash[i];
    if(descriptions[slash[i]]) {
      node['description'] = descriptions[slash[i]];
    }

    if(parents.length > 0) {
      parents[parents.length-1]["children"].push(node);
    }
  }
  removeEmptyChildren(root); // Remove 'children' properties of all nodes without children
  return root;
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


module.exports.json2slash = function(json) {
  var txt = json2text(json);
  var slash = txt2slash(txt);
  return slash;
}