const dateFormat = require('dateformat');

// Nicely formats a date
function formatDate(d) {
  return dateFormat(d, 'dd mmm') + ' at ' + dateFormat(d, 'h:MM tt')
}

export default formatDate;