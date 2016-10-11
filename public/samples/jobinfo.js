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

var listURI = '/jobList'; 
app.get(listURI, function (req, res) {
  var jobList = {};
  //the job list from docplexcloud client api
  var jobs = client.listJobs();
  //parse the promise output, to get the job ids
  jobs.then(function (results) {
    if (results.length === 0) {
      res.write('You currently have no jobs');
      res.end();
    }
    else {
      //format the output response to json
      res.writeHead(200, {
        'Content-Type': 'application/json'
        , 'Transfer-Encoding': 'chunked'
      });
      res.write(JSON.stringify(results));
      res.end();
    }
    //in case the response fails
  }, function (err) {
    console.log('job list ko' + err);
    res.setHeader('Content-Type', 'application/json');
    res.write("No Jobs to display");
    res.end();
  });
});