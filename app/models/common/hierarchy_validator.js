var CATEGORY_HIERARCHY_MAX_NAME_LENGTH = 200;

(function(exports) {
  // Validates a category hierarchy. The category hierarchy should be formatted as follows:
  // ["test", "test/test", "test/test/test", "test/test2", "test/test2/test3" ... ]
  exports.validateCategoryHierarchy = function(arr, done) {
    // A lot of this code is summarised here: https://i.redd.it/hk54ti5n6tk11.png
    function generateMessage(line, lineno, msg) {      
      return "Error on line " + (lineno + 1) + " (\"" + line +"\"): category " + msg;
    }

    var depth = 0;
    var prevParents = [];
    var parents = [];
    var newDepth = 0;

    var seenSet = new Set();

    for(var i = 0; i < arr.length; i++) {
      line = arr[i];

      if(seenSet.has(line)) {
        return done(false, generateMessage(line, i, "already appears elsewhere in the hierarchy."));
      }
      seenSet.add(line);

      if(line.length > 0 && line[0] == "/")
         return done(false, generateMessage(line, i, "must not begin with a forward slash."));
      if(line[line.length-1] == "/")
         return done(false, generateMessage(line, i, "must not end with a forward slash."));

      if(line.match(/\/\//g))
        return done(false, generateMessage(line, i, "must not be empty."));

      //line = line.replace("\\/", ""); // Ignore backslashed-forwardslashes
      var cats = line.match(/[^\/]+/g);

      if(cats == null)
        return done(false, generateMessage(line, i, "must not be empty."));

      

      var newDepth = cats.length;
      var parents = cats.slice(0, -1); // The parents of this category
      var cat = cats[cats.length - 1]; // The category itself



      if(newDepth < depth){
        prevParents = prevParents.slice(0, newDepth -1);
      } else if(newDepth > depth + 1) {
        return done(false, generateMessage(line, i, "appears to be skipping a level in the hierarchy."));
      }

      // Ensure parents match
      for(var j = 0; j < parents.length; j++) {
        if(parents[j] != prevParents[j]) {
          return done(false, generateMessage(line, i, "does not have the correct parent for its position in the hierarchy."));
        }
      }
      

      if(cat.trim().length == 0)
        return done(false, generateMessage(line, i, "must not be empty."));
      if(cat.length > CATEGORY_HIERARCHY_MAX_NAME_LENGTH)
        return done(false, generateMessage(line, i, "must be shorter than " + CATEGORY_HIERARCHY_MAX_NAME_LENGTH + " characters."));
      if(cat.length < 1)
        return done(false, generateMessage(line, i, "must contain at least one character."));
      if(cat == "O") {
        return done(false, generateMessage(line, i, "cannot be \"O\" as it is used to denote non-entities."));
      }

      //if(newDepth == depth+1) {
      parents.push(cat);
      //}
      depth = newDepth;    
      prevParents = parents;
    }

    done(true);
  };
})(typeof exports === 'undefined' ? this['hierarchyValidator'] = {} : exports);