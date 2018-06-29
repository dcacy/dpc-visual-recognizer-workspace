'use strict';
require('dotenv').config({silent: true, path: 'local.env'});
const vcap_services = JSON.parse(process.env.VCAP_SERVICES);
const debug = require('debug');
const log = debug('dpc-visual-app');
// const express = require('express');
const cfenv = require('cfenv');
const appEnv = cfenv.getAppEnv();
process.env.port = appEnv.port;  // for the bot framework


const handleAction = require('./modules/handleAction');
const botFramework = require('watsonworkspace-bot');
botFramework.level(process.env.WW_SDK_LOGGER_LEVEL);

botFramework.startServer();
log('about to authenticate');
const bot = botFramework.create(); 


bot.authenticate()
.then( token => {
  log('authentication successful');

  botFramework.express.get('/', (req, res) => {
    res.end('The Visual Recognizer is alive and kicking!');
  });

})
.catch(err => {
  log('error authenticating:', err);
});

/*
Listen for annotations. If it was an image file, then examine the file using Watson Visual Recognition.
If the annotation was "SHARE", it means the user clicked the share button.
*/
bot.on('message-annotation-added', (message, annotation) => {
  if (annotation.context && annotation.context.type === 'file' && annotation.contentType.includes('image')) {
    handleAction.examineFile(message, annotation, bot);
  } else {
    if (annotation.actionId && annotation.actionId.startsWith('SHARE_')) {
      handleAction.shareAnalysis(message, annotation, bot);
    }
  }
});

/*
Listen for actionSelectd, and if it was View Analysis then show the cards with the classifications
*/
bot.on('actionSelected', (message, annotation) => {
  if (annotation.actionId === 'View Analysis') {
    log('actionSelected found:', annotation);
    handleAction.viewAnalysis(message, annotation, bot);
  }
});