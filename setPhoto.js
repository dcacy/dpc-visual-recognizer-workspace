// require('dotenv').config({silent: true, path: 'local.env'});

console.log(process.argv);
var appId, appSecret;
if (process.argv[2]) {
      appId = process.env.APP_ID ? process.env.APP_ID : process.argv[3];
      appSecret = process.env.APP_SECRET ? process.env.APP_SECRET : process.argv[4];
      if (appId && appSecret) {
         console.log(`updating photo with [${process.argv[2]}]`);
         const SDK = require('watsonworkspace-sdk');
         const ww = new SDK(
            process.env.APP_ID,
            process.env.APP_SECRET
         );

         ww.authenticate()
         .then(token => {
            ww.uploadPhoto(process.argv[2]);
            console.log('success!');
         })
         .catch(error => console.log(error))
      } else {
         showUsage();               
      }
} else {
   showUsage();
}

function showUsage() {
   console.log('usage: node setPhoto.js <full path to file> [APP_ID] [APP_SECRET]');
   console.log('APP_ID and APP_SECRET may be set as environment variables.')

}
// if(true){return}
// if (process.argv[2] == null) {
//    console.log("Usage:\n");
//    console.log("node getappJWT.js <appId> <appSecret>\n");
//  } else {
// const SDK = require('watsonworkspace-sdk');
// const ww = new SDK(
//   process.env.APP_ID,
//   process.env.APP_SECRET
// );

// ww.authenticate()
// .then(token => {
//    ww.uploadPhoto('./assetfinder.jpg');

// })
// .catch(error => logger.error(error))