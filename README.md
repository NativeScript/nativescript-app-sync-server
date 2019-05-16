# CodePush Server [source](https://github.com/EddyVerbruggen/code-push-server) 

## What's this then?
This CodePush server is like a polyfill for MicroSoft's CodePush server, but with support for NativeScript apps.

Huge thanks to [this project](https://github.com/lisong/code-push-server) which this project is based upon.
We didn't fork it because significant (non-unforkeable) changes had to be made (replacing hardcoded Chinese text by English comes to mind).

You can either roll your own clone of this server or use [the shared service we provide](https://nativescript-codepush-server.herokuapp.com/) (which is configured by default by the [NativeScript CodePush plugin](https://github.com/EddyVerbruggen/nativescript-code-push)).

## Support Storage mode 

- local *storage bundle file in local machine*
- qiniu *storage bundle file in [qiniu](http://www.qiniu.com/)*
- s3 *storage bundle file in [aws](https://aws.amazon.com/)*
- oss *storage bundle file in [aliyun](https://www.aliyun.com/product/oss)*
- tencentcloud *storage bundle file in [tencentcloud](https://cloud.tencent.com/product/cos)*

### Shell login

With the [NativeScript CodePush CLI]() installed (`npm i -g nativescript-code-push`), you can do:

```shell
$ nativescript-code-push login https://nativescript-codepush-server.herokuapp.com # or your own server endpoint
```

### Web interface 

[nativescript-codepush-server.herokuapp.com](https://nativescript-codepush-server.herokuapp.com/)

## HOW TO INSTALL code-push-server

- [Installation manual](https://github.com/EddyVerbruggen/code-push-server/blob/master/docs/README.md)

## DEFAULT ACCOUNT AND PASSWORD

- account: `admin`
- password: `123456`

## Making changes to this server
Go ahead and roll your own, but if you want to change the production code, push to `master`
and Heroku will deploy a new version automatically.

To check the production logs (requires the right credentials 😉):

```shell
heroku logs --app nativescript-codepush-server --tail
```

## IGNORE
[Testing something (iOS)](https://epicurobestsellertest.azurewebsites.net/?utm_source=MichaelTestIOS&utm_campaign=CampaignIOS&utm_medium=email&utm_term=1_6f3694cf9c-159f351e00-291756921#/@pieces/search?query=17094596)

[Testing something (Android)](https://epicurobestsellertest.azurewebsites.net/?utm_source=MichaelTestAndroid&utm_campaign=CampaignAndroid&utm_medium=email&utm_term=2_6f3694cf9c-159f351e00-291756921#/@pieces/search?query=17094596)
