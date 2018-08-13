# `lfr-ride`

## Install

1. `npm install`;
1. Make sure the following variables are defined:
```
export LYFT_CLIENT_ID=<lyft-client-id>
export LYFT_CLIENT_SECRET=<lyft-client-secret>
export SESS_SECRET=<session-secret>
export MONGODB_URI=<mongodb-instance-uri>
export SMS_SERVICE=<sms-service-uri>
export CRYPTO_ALGORITHM=<encryption-algorithm>
export CRYPTO_PASSWORD=<encryption-password>
```

### Create an `env.sh` file
Instead of redeclaring all the environment variables each time, you can write all the `export` commands into the `env.sh` file and run:
```
source env.sh
```

## Run

1. `npm start` serves the application on port 3000;
1. `npm run dbg` serves the application in debug mode. The debugger URL is printed in the console. To avoid copy-pasting the URL every time connect to the [running instance](http://localhost:9229/json/list) and use [this bookmarklet](javascript:(function (d) {let copyListener = event => {d.removeEventListener("copy", copyListener, true);event.preventDefault();const url = JSON.parse(d.body.innerText)[0].devtoolsFrontendUrl;const clipboardData = event.clipboardData;clipboardData.clearData();    clipboardData.setData("text/plain", url);};d.addEventListener("copy", copyListener, true);d.execCommand("copy");})(document);) to copy the URL to the clipboard automatically.

### Start ngrok
In order to expose the service running on localhost to the Internet use [ngrok](https://ngrok.com/):
```
ngrok http 3000
```

## Prettify code

Before submitting the code run `npm run format`.
