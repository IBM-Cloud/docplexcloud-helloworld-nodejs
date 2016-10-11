var app = express();
var cfenv = require('cfenv');
var docloud = require("docplexcloud-nodejs-api");
var fs = require('fs');
var appEnv = cfenv.getAppEnv();
var credentials = appEnv.getServiceCreds("[Your service]");

var client = docloud({
  url: credentials.url,
  clientId: credentials.client_id
});

var deleteURI = '/deleteAll';
app.delete(deleteURI, function (req, res) {
  res.setHeader('Content-Type', 'text/html');
  client.deleteJobs()
    .then(function (results) {
      console.log("deleted");
      res.send("200");
      res.end();

    }, function (err) {
      res.send("500",err);
      res.end();
    });
});
