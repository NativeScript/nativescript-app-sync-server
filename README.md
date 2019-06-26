# AppSync Server [source](https://github.com/EddyVerbruggen/nativescript-app-sync-server) 

## What's this then?
This AppSync server is similar to Microsoft's CodePush server, but tailored for NativeScript apps,
working seamlessly with the [NativeScript AppSync plugin](https://github.com/EddyVerbruggen/nativescript-app-sync).

Huge thanks to [this project](https://github.com/lisong/code-push-server) which this project is based upon.
We didn't fork it because significant (non-unforkeable) changes had to be made (replacing hardcoded Chinese text by English comes to mind).

You can either roll your own clone of this server or use [the shared service we provide](https://appsync-server.nativescript.org/) (which is configured by default by the [NativeScript AppSync plugin](https://github.com/EddyVerbruggen/nativescript-app-sync)).

## Support Storage mode 

- local *storage bundle file in local machine*
- qiniu *storage bundle file in [qiniu](http://www.qiniu.com/)*
- s3 *storage bundle file in [aws](https://aws.amazon.com/)*
- oss *storage bundle file in [aliyun](https://www.aliyun.com/product/oss)*
- tencentcloud *storage bundle file in [tencentcloud](https://cloud.tencent.com/product/cos)*

### Shell login

With the [NativeScript AppSync CLI]() installed (`npm i -g nativescript-app-sync-cli`), you can do:

```shell
$ nativescript-app-sync login
$ nativescript-app-sync login https://your-own-server-endpoint.com
```

### Web interface 

[appsync-server.nativescript.org](https://appsync-server.nativescript.org/)

## HOW TO INSTALL nativescript-app-sync-server

- [Installation manual](https://github.com/EddyVerbruggen/nativescript-app-sync-server/blob/master/docs/README.md)

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
