/* A small webhook server :) */

var fs = require('fs');
var https = require('https');
var express = require('express');
var packageInfo = require('./package.json');
var bodyParser = require('body-parser');

var app = express();

var options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
if(require("./settings.json").CA===true){
  options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
    ca: fs.readFileSync('ca.pem')
  };
}
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.json({ version: packageInfo.version });
});


var server = https.createServer(options, app);

server.listen(parseInt(require("./settings.json").WPORT),"");

module.exports = function (bot) {
  app.post('/' + bot.token, function (req, res) {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
};