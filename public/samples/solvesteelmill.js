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

var solveURI = '/solveSteelmill';

app.post(solveURI, function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  var attachments = [];
  // For this entry point, we solve the diet file.
  // Replace ['diet.lp'] with ['steelmill.mod', 'steelmill.dat'] for solving the steelmill problem
  var files = ['steelmill.mod', 'steelmill.dat'];
  files.map(function (file) {
    attachments.push({
      name: file,
      stream: fs.createReadStream('resources/' + file)
    });
  });
  client.execute({
      logstream: process.stdout,
      parameters: {"oaas.TIME_LIMIT": 3 * 60 * 1000},
      attachments: attachments
    })
    .on('created', function (jobid) {
      res.writeHead("200");
      res.write(JSON.stringify({ id: jobid }));
      res.end();
    })
    .on('processed', function (jobid) {
      console.log(jobid + " processed");
      client.downloadAttachment(jobid, 'solution.json', fs.createWriteStream('resources/solution.json'))
        .then(function () {
          return client.downloadLog(jobid, fs.createWriteStream('resources/solution.log'))
        });
    })
    .on('interrupted', function (jobid) {
      console.log("job was interrupted :"+jobid);
    })
    .on('failed', function (jobid) {
      console.log("job has failed :"+jobid);
    })
    .on('error', function (error) {
      console.log(error);
      res.status(500).send({
        error: true,
        message: error.message
      });
    });
});
