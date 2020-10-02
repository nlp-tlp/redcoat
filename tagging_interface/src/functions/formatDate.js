const dateFormat = require('dateformat');

// Nicely formats a date
function formatDate(d, options) {
  if(options && options.no_hours) {
  	return dateFormat(d, 'dd mmm');
  }
  return dateFormat(d, 'dd mmm') + ' at ' + dateFormat(d, 'h:MM tt')
}

export default formatDate;