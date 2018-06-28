'use strict';
var debug = require('debug');
const log = debug('dpc-visual-handleAction');
const UI = require('watsonworkspace-bot').UI;
const VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
const vcap_services = JSON.parse(process.env.VCAP_SERVICES);
const visualRecognition = new VisualRecognitionV3({
  version: '2018-03-19',
  iam_apikey: vcap_services.watson_vision_combined[0].credentials.apikey
});
// require('dotenv').config({silent: true, path: 'local.env'});
// log('vcap:', vcap_services);
// const connections = require('./connections_search');
// const db = require('./db');

module.exports = {
  shareAnalysis: function(message, annotation, bot) {
  log('entering shareAnalysis with annotation:', annotation);
  const msg_base64 = annotation.actionId.substring(6);
  log('msg_base64:', msg_base64);
  const msg = new Buffer(msg_base64, 'base64').toString('ascii');
  bot.sendMessage(message.spaceId, `The above image has this classification: *${msg_base64}*` );
  // log('msg is', msg);
  this.viewAnalysis(message, annotation, bot);
},


  viewAnalysis: function(message, originalAnnotation, bot) {
  log('in viewAnalysis with annotation:', originalAnnotation);
  log('and message:', message);
  // log('and payload:', payload);
  const query = `query getMessage {
    message(id: "${originalAnnotation.referralMessageId}") {
      id
      annotations
    }
  }`;
  // log('query:', query);
  bot.sendGraphql(query)
  .then(result => {
    // log('result of getMessage:', result);
    if (result.message.annotations) {
      log('found annotations');
      for (let i = 0; i < result.message.annotations.length; i++) {
        const annotation = JSON.parse(result.message.annotations[i]);
        if (annotation.type === 'message-focus' && annotation.category === 'Image_Analyzed') {
          const payload = JSON.parse(annotation.payload);
          // log('payload:', payload);
          if (payload && payload.classes) {
            const cards = [];
            for (let j = 0; j < payload.classes.length; j++) {
              // let card = UI.card('title','', `content`);
              // cards.push(card);
              // const jsonString = new Buffer(parsed[1], 'base64').toString('ascii');


              const msg = `${payload.classes[j].class} (confidence: ${payload.classes[j].score})`;
              const msg_base64 = new Buffer(msg.toString('base64'));
              // log('msg_base64:', msg_base64);
              cards.push(
                UI.card('Classification', msg, '', [
                  UI.cardButton('Share with Space', `SHARE_${msg_base64}`)
                ]));
              
            }
            // log('cards:', cards);
            log('userId:', message.userId);
            // log()
            bot.sendTargetedMessage(message.userId, originalAnnotation, cards)
            .then(result => {
              log('cards sent')
            })
            .catch(err => {
              log('error sending cards:', err);
            });
          }
          i = result.message.annotations.length; // break
        }
      }
    }
  })
  .catch(err => {
    log('error in getMessage:', err);
  });

},

  examineFile: function(message, annotation, bot) {
  log('entering examineFile with annotation:', annotation);
  log('fileId is', annotation.fileId);
  bot.getFile(annotation.fileId)
    .then(result => {
      log('got file from workspace');
      // var fs = require('fs');


      var images_file = result;
      var classifier_ids = ["fruits_1462128776", "SatelliteModel_6242312846"];
      var threshold = 0.6;

      var params = {
        images_file: images_file,
        // classifier_ids: classifier_ids,
        threshold: threshold
      };

      visualRecognition.classify(params, function (err, response) {
        if (err)
          log(err);
        else
          log(JSON.stringify(response, null, 2));

          if (response.images && response.images.length > 0) {

          }
          bot.sendMessage(message.spaceId, 'Annotations available for the above image.')
          .then(result => {
            log('result of sendMessage:', result);
            const payload = {
              fileId: annotation.fileId,
              classes: response.images[0].classifiers[0].classes
            };
            // log('adding focus to message:', message);
            bot.addMessageFocus(result, 'Annotations available', 'ImageHelper', 'Image_Analyzed', 'View Analysis', payload);
          });
      });
    })
    .catch(err => {
      log('error getting file:', err);
    })
}
}
