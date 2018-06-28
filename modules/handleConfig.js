'use strict';
var debug = require('debug');
const log = debug('dpc-assetfinder-handleConfig');
const url = require('url');
const db = require('./db');
let bot;

exports.setBot = (theBot) => {
    bot = theBot;
}

exports.config = (req, res) => {
    log('----> entering config');
    var qs = url.parse(req.url,true).query;
    var body = req.body;
    log('body is', body);
    log('qs:', qs);
    if (qs.thespaceId) {
        log('found thespaceId:', qs.thespaceId);
        log('now to get config data');
        db.getConfigurationBySpaceId(qs.thespaceId)
        .then(result => {
            var data = {};
            log('result of config from db:', result);
            if (result.docs[0]) {
                data.uuid = result.docs[0].uuid;
                data.username = result.docs[0].username;
                data.password = result.docs[0].password
            }
            bot.getSpace(qs.thespaceId, ['title'])
            .then(spaceDetails => {
                log('spaceDetails:', spaceDetails);
                data.appId = process.env.APP_ID;
                data.spaceId = qs.thespaceId;
                data.spaceName = spaceDetails.space.title; 
                res.json(data);
            })
            .catch(err => {
                log('error getting space details:', err);
                reject(err);
            });
        })
        .catch(err => {
            log('error getting config from db:', err);
            res.status(500).end(err);
        });
    } else if (qs.configurationToken) {
        log('redirecting to html');
        res.redirect(`/configure.html?configurationToken=${qs.configurationToken}&thespaceId=${qs.spaceId}&appId=${process.env.APP_ID}`);
    } else if (body.spaceId) {
        log('submtting config to save');
        db.saveConfiguration(body)
        .then(result => {
            log('result of saving configuration:', result);
        })
        .catch(err => {
            log('error saving configuratin:', err);
        });
        res.json({result:'success'});
    }

    // log('referer:',req);
  // log('current is %O', qs.incidentNbr);
  // var current = JSON.parse(qs.incidentNbr);
  // log('current is now: %O', current);
  // log('headers are', req.headers);
}
