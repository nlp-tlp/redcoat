var mongoose = require('mongoose')
var Schema = mongoose.Schema;


/* Schema */

var TokenSchema = new Schema({
  token: String,
  category: String,        
  total: Number,
  frequency: Number,
})

var FrequentTokensSchema = new Schema({
  tokens: {
    type: Object,
    default: {}
  },
}, {
  timestamps: { 
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});


// Adds a token, along with its corresponding category, to the tokens object.
// This should ideally be called from document_group_annotation, which can save it after all tokens have been added.
FrequentTokensSchema.methods.addToken = function(token, category) {
  try {
  var t = this;
  if(!t.tokens[token]) {
    t.tokens[token] = { cfs: {}, total: 0 };  // category frequencies, total
  } 
  t.tokens[token].total++;
  if(t.tokens[token].cfs[category]) {
    t.tokens[token].cfs[category] += 1;
  } else {
    t.tokens[token].cfs[category] = 0;
  }
} catch(eee) { console.log(eee) ;}

}


/* Model */

var FrequentTokens = mongoose.model('FrequentTokens', FrequentTokensSchema);

module.exports = FrequentTokens;