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







/*              

automatic_labeller_id: ...

token_str: "hydraulic air fan" 

ngram_size: 3,


times_labeled: 8,           // Have to retroactively go back when a new ngram is created to check whether it has been labeled or not labeled previously
times_not_labeled: 2,
times_seen: 10,

confidence: 0.8,

labels: [
  [ ["Item"], 6 ],
  [ ["Item", "Location"], 2]
]
document_annotation_ids: [                        // use this to retroactively go back
  (array of ids in which this ngram occurs)
]




*/