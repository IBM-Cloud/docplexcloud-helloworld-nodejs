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

var downloadURI = '/download';
// Specify 'solution.json' as the attid for downloading the solution attachment
app.get(downloadURI + '/:jobid/:attid', function(req, res){
  var mimetype = attid.includes('.json') && 'application/json' || 'text/plain';
  res.setHeader('Content-type', mimetype);
  res.setHeader('Content-disposition', 'attachment; filename=' + attid);
  client.downloadAttachment(jobid, attid, res).then(function () {
  }, function (err) {
    res.send("500",err);
    res.end();
  });
});