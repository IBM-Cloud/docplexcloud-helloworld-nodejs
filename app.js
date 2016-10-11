 // Licensed under the Apache License. See footer for details.
 /*eslint-env node*/

//For docloud node client
var docloud = require("docplexcloud-nodejs-api");
var fs = require('fs');
var client;
//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

//---Deployment Tracker---------------------------------------------------------
require("cf-deployment-tracker-client").track();

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();
var docplexcloudservice;
var docplexcloudURL;
var docplexcloudClientId;

var port = (process.env.VCAP_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');

//get all services in vcap
//if we're in CF or Bluemix, don't need to specify services manually
if (process.env.VCAP_SERVICES) {
    appEnv = cfenv.getAppEnv();
// otherwise, specify the service values when creating the appEnv
} else {
    try {
        appEnv = cfenv.getAppEnv({
            vcap: {
                services: require('./vcap-local.json')
            }
        });
    } catch (e) {
        console.error(e);
    }
}

// initialize the client SDK
var credentials = appEnv.getServiceCreds("DOcplexcloud-service");
client = docloud({
    url: credentials.url,
    clientId: credentials.client_id
});

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function () {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
});

function solve(files, req, res) {
    res.setHeader('Content-Type', 'application/json');
    var attachments = [];
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
    console.log('works');
}

//action when clicking on 'Solve a multi files problem' button
app.post('/solveSteelmill', function (req, res) {
    solve(['steelmill.mod', 'steelmill.dat'], req, res);
});

//action when clicking on 'Solve a 1 file problem' button
app.post('/solveDiet', function (req, res) {
    solve(['diet.lp'], req, res);
});

app.get('/job/:jobid', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    client.getJob(req.params.jobid).then(function (job) {
        res.writeHead(200);
        res.write(JSON.stringify(job));
        res.end();
    }, function (err) {
        res.send("500",err);
    });
});

//Script used to get the list of existing jobs - called by app.get('/JobInfo')
app.get('/jobList', function (req, res) {
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
            for (job = 0; job < results.length; job++) {
                console.log('job list : ' + results[job]._id);
                jobList[job] = results[job]._id;
            }
            //format the output response to html
            res.writeHead(200, {
                'Content-Type': 'application/json'
                , 'Transfer-Encoding': 'chunked'
            });
            res.write(JSON.stringify(jobList));
            res.end();
            console.log("joblist : sent");
        }
        //in case the response fails
    }, function (err) {
        console.log('job list ko' + err);
        res.setHeader('Content-Type', 'application/json');
        res.write("No Jobs to display");
        res.end();
    });
});

 //Script for deleting one job
 app.delete('/delete/:jobid', function (req, res) {
     res.setHeader('Content-Type', 'text/html');
     client.deleteJob(req.params.jobid)
       .then(function (results) {
           console.log("deleted");
           res.send("200");
           res.end();

       }, function (err) {
         res.send("500",err);
         res.end();
     });
 });

//Script executed when clicking on 'Delete all the jobs' button
app.delete('/deleteAll', function (req, res) {
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

//Script executed when clicking on "See existing jobs details" button
app.get('/jobInfo', function (req, res) {
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
        res.write(JSON.stringify(err));
        res.end();
    });
});

function downloadAttachment(jobid, attid, req, res, asAFile) {
    var mimetype = attid.includes('.json') && 'application/json' || 'text/plain';
    res.setHeader('Content-type', mimetype);
    if (asAFile) {
        res.setHeader('Content-disposition', 'attachment; filename=' + attid);
    }
    client.downloadAttachment(jobid, attid, res).then(function () {
   }, function (err) {
        res.send("500",err);
        res.end();
    });
}

app.get('/download/:jobid/:attid', function(req, res){
 downloadAttachment(req.params.jobid, req.params.attid, req, res, true);
});

 app.get('/downloadSolution/:jobid', function(req, res){
     downloadAttachment(req.params.jobid, 'solution.json', req, res, true);
 });

 app.get('/getSolution/:jobid', function(req, res){
     res.setHeader('Content-type', 'application/json');
     downloadAttachment(req.params.jobid, 'solution.json', req, res);
 });

/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
