const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, colorize } = format;
const { red } = require('colors');
const myFormat = printf(info => {
  //return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`
  return `${info.level}: ${info.message}`
});
var logger = createLogger({
  format: combine(
    label({ label: red('My Label') }),
    timestamp()
  ),  
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        myFormat
      ),
      level: 'debug' }),
  ]
});


logger.stream = {
    write: function(message, encoding){
        logger.info(message.substring(0,message.lastIndexOf('\n')));
    }
};

module.exports = logger;