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
 
 //functions used by buttons

/**
 * Returns the list of jobs.
 * @returns {Promise} a promise that resolves once the Http request returns.
 */
function getJobList() {
    return $.get('/jobList');
}

/**
 * Waits for the job with the specified jobId to complete or fail.
 * @param jobId the job ID
 * @param dfd the promise object to resolve when the job is done.
 */
function waitJobCompletion(jobId, dfd) {
    // Ask for the job details
    $.get('/job/' + jobId).then(function (job) {
        // Check on the current status of the job to determine whether it is done or running
        if (['PROCESSED', 'FAILED', 'INTERRUPTED'].indexOf(job.executionStatus) < 0) {
            // Job is not started or running: ask for the job status again in 500 millis
            setTimeout(waitJobCompletion(jobId, dfd), 500);
        }
        else { // Job is done
            dfd.resolve(job);
        }
    }, function (err) {
        // The request failed
        dfd.reject(err);
    });
}

/**
 * Solves the model associated with the specified model ID.
 * @param modelID the string reprensenting the model to solve.
 * @param deleteJobWhenDone if true, the job associated with the solve is deleted once done, otherwise the job
 * will have to be deleted manually pressing the deleteAll demo button.
 * @returns {Promise} a promise object that resolves when the solve ends, whether it has succeeded or failed.
 */
function solve(modelID) {
    return $.post('/solve'+modelID).then(function (result) {
        // Wait for the job to complete or fail
        var dfd = $.Deferred();
        waitJobCompletion(result.id, dfd);
        return dfd;
    });
}

/**
 * Deletes all the jobs
 * @returns {Promise} the promise object that resolves once the request is processed.
 */
function deleteAll() {
    return $.ajax({
        url: '/deleteAll',
        type: 'DELETE'
    }).then(function (data) {
        console.log('deleting jobs');
        return "No more jobs !! ";
    }, function (err) {
        console.log('Error deleting jobs');
        return err.message;
    });
}

function jobInfo() {
    return $.get('/jobInfo');
}
