module.exports.index = function(req, res) {
  if(req.user) {
    return res.redirect('/projects');
  }
  res.render('homepage', {title: "Welcome"});
}