'use strict';
var debug = require('debug');
const log = debug('dpc-assetfinder-connections');
const rp = require('request-promise');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

exports.queryConnectionsAssets = (configData, assetType) => {
   return new Promise((resolve, reject) => {
      log('---> entering queryConnectionsAssets');
      var myData = {};
      var queryURL = `/search/atom/mysearch?constraint={"type": "category", "values":["Tag/${assetType}"]}&social={"type":"community","id":"${configData.uuid}"}`;
      log('queryURL:', queryURL);
      var connectionsSearchURL = process.env.CONNECTIONS_HOSTNAME + queryURL;
      var options = {
         method: 'GET',
         url: connectionsSearchURL,
         auth: {
            user: configData.username,
            pass: configData.password
         },
         json: false
      };
      rp(options)
         .then(body => {
            parser.parseString(body, function (err, result) {
               if (err) {
                  log("Connections Search : Error parsing xml:", err)
                  reject(err);
               }
               var resultcount = result.feed['openSearch:totalResults'][0];
               myData.resultcount = resultcount;
               if (result.feed.entry) {
                  // we have a result !
                  var resultSet = result.feed.entry;
                  var arrayLength = resultSet.length;
                  var fileList = [];

                  for (var i = 0; i < arrayLength; i++) {
                     fileList.push({
                        id: resultSet[i].id[0],
                        title: resultSet[i].title[0]._,
                        link: resultSet[i].link[0].$.href,
                        author: resultSet[i].author[0].name[0],
                        comments: resultSet[i]['snx:rank'][0]._,
                        recommendations: resultSet[i]['snx:rank'][1]._,
                        updated: resultSet[i].updated[0]
                     });
                  }

                  myData.results = fileList;
               }
               log('<---- exiting queryConnectionsAssets');
               resolve(myData);
            })
         })
         .catch(err => {
            log('error calling connections');
            reject(err);
         });
   });
}