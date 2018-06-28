'use strict';
require('dotenv').config({silent: true, path: 'local.env'});
const vcap_services = JSON.parse(process.env.VCAP_SERVICES);
var debug = require('debug');
const log = debug('dpc-visual-app');
// log('vcap:', vcap_services.watson_vision_combined[0].credentials.apikey);

var express = require('express');

var cfenv = require('cfenv');

var appEnv = cfenv.getAppEnv();
process.env.port = appEnv.port;  // for the bot framework

// const SDK = require('./modules/watsonworkspace-sdk/index');
// var ww;

const handleAction = require('./modules/handleAction');
// const handleConfig = require('./modules/handleConfig');
const botFramework = require('watsonworkspace-bot');
// botFramework.level(process.env.WW_SDK_LOGGER_LEVEL);
const handleConfig = {};

botFramework.startServer();
log('about to authenticate');
const customMiddleware = [
  ['config'],
  [function(req, res) {handleConfig.config(req,res)}]
];
const bot = botFramework.create(
  // process.env.APP_ID,
  // process.env.APP_SECRET,
  // process.env.WEBHOOK_SECRET,
  // customMiddleware[0],
  // customMiddleware[1]
); 

// handleConfig.setBot(bot);

// const bot = botFramework.create(); // bot settings defined by process.env
bot.authenticate()
.then( token => {
  log('authentication successful');
  // ww = new SDK('','', token);

  // serve content from /public (for configuration)
  botFramework.express.use(express.static(__dirname + '/public'));
  botFramework.express.get('/', (req, res) => {
    res.end('The Visual Recognizer is alive and kicking!');
  });

})
.catch(err => {
  log('error authenticating:', err);
});


// bot.on('message-created', (message) => {
//   log('found message-created; message is:', message);
//   // log('actionSelected:', annotation.actionId);
//   // handleAction.findAsset(message, annotation, bot);
// });

bot.on('message-annotation-added', (message, annotation) => {
  if (annotation.context && annotation.context.type === 'file' && annotation.contentType.includes('image')) {
    log('a file was added:', annotation);
    handleAction.examineFile(message, annotation, bot);
  } else {
    log('annotation:', annotation);
    log('and message:', message);
    if (annotation.actionId && annotation.actionId.startsWith('SHARE_')) {
      log('found SHARE');
      handleAction.shareAnalysis(message, annotation, bot);
    }
  }
});

// bot.on('actionSelected:View Analysis', (message, annotation, payload) => {
//   log('View Analysis found:', annotation);
//   log('payload:', payload);
//   // log('message is', message);
//   handleAction.viewAnalysis(message, annotation, payload, bot);
// });

bot.on('actionSelected', (message, annotation) => {
  if (annotation.actionId === 'View Analysis') {
    log('actionSelected found:', annotation);
  handleAction.viewAnalysis(message, annotation, bot);
}
  
  // log('payload:', payload);
  // log('message is', message);
});

// bot.on('message-focus:ImageHelper', (message, annotation) => {
//   log('in message-focus:', annotation);
// });