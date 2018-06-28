# dpc-visual-recognizer-workspace

This is an application with integrates with [Watson Workspace](https://workspace.ibm.com) and provides the ability to annotate an image using classifications from the Watson Visual Recognition service.



## How to use

- Click [this link](https://workspace.ibm.com/enableApp?shareToken=6567a145-a86c-4bc4-aba2-be5f5bb88c8b) to add the app to an existing space.
- Upload an image to the space, or paste one in. In a few seconds, the image will be annotated and you can view the classifications.

## For Developers

Create a Watson Visual Recognition service in bluemix and configure your app to use it, as described below.


### Environment Variables

This application requires the following environment variables. You may set them in the
Bluemix deploy step of your toolchain, or in `manifest.yml`. For local testing, you can put
them in the file `local.env` (start with the provided file `local.env.sample`). They are:
```
APP_ID=<workspace appId>
APP_SECRET=<workspace secret>
WEBHOOK_SECRET=<workspace webhook secret>
WW_SDK_LOGGER_LEVEL=info|debug|etc
DEBUG=dpc-visual-* (optional)
VCAP_SERVICES=<your watson service configuration>
```

### Run the application locally

First edit the local.env file as described above.  Then, from a command line, change to the directory where you downloaded the application. Run these commands:

```
npm install
npm start
```

If you configured a `DEBUG` environment variable, you should see a message similar to this:
```
dpc-visual-app authentication successful
```
