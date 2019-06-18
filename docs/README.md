## INSTALL NODE AND NPM

[see](https://nodejs.org/en/download/)

> (chosen latest LTS version)

## INSTALL PM2

```bash
$ sudo npm i -g pm2
```

## INSTALL MYSQL

- [Linux](https://dev.mysql.com/doc/refman/8.0/en/linux-installation.html)
- [macOS](https://dev.mysql.com/doc/refman/8.0/en/osx-installation.html)
- [Microsoft Windows](https://dev.mysql.com/doc/refman/8.0/en/windows-installation.html)
- [Others](https://dev.mysql.com/doc/refman/8.0/en/installing.html)

> notice. mysql8.x default auth caching_sha2_pasword not support in node-mysql2 see [issue](https://github.com/mysqljs/mysql/pull/1962)


## GET nativescript-app-sync-server FROM SOURCE CODE

```shell
$ git clone https://github.com/EddyVerbruggen/nativescript-app-sync-server
$ cd nativescript-app-sync-server
$ npm i
```

## INIT DATABASE

```shell
$ ./bin/db init --dbhost "your mysql host" --dbport "your mysql port" --dbname "codepush" --dbuser "your mysql user" --dbpassword "your mysql password"
```

## CONFIGURE nativescript-app-sync-server

save the file [config.js](https://github.com/EddyVerbruggen/nativescript-app-sync-server/blob/master/config/config.js)

Some config has to change:

- `local`.`storageDir` change to your directory,make sure have read/write permissions.
- `local`.`downloadUrl` replace `127.0.0.1` to your machine ip.
- `common`.`dataDir` change to your directory,make sure have read/write permissions.
- `jwt`.`tokenSecret` get the random string from `https://www.grc.com/passwords.htm`, and replace the value `INSERT_RANDOM_TOKEN_KEY`.
- `db` config: `username`,`password`,`host`,`port` change your own's

## CONFIGURE for pm2

save the file [process.json](https://github.com/EddyVerbruggen/nativescript-app-sync-server/blob/master/docs/process.json)

some config have to change:

- `script` if you install nativescript-app-sync-server from npm use `nativescript-app-sync-server`, or use `"your source code dir"/bin/www`
- `CONFIG_FILE` above config.js file path, use absolute paths.

## START SERVICE

```shell
$ pm2 start process.json
```

## RESTART SERVICE

```shell
$ pm2 restart process.json
```

## STOP SERVICE

```shell
$ pm2 stop process.json
```

## CHECK SERVICE IS OK 

```shell
$ curl -I http://YOUR_APPSYNC_SERVER_IP:3000/
```

> return httpCode `200 OK`

```http
HTTP/1.1 200 OK
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-Download-Options: noopen
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Type: text/html; charset=utf-8
Content-Length: 592
ETag: W/"250-IiCMcM1ZUFSswSYCU0KeFYFEMO8"
Date: Sat, 25 Aug 2018 15:45:46 GMT
Connection: keep-alive
```


## Use Redis to impove concurrent and security

> config redis in config.js

- `updateCheckCache`
- `rolloutClientUniqueIdCache`
- `tryLoginTimes`


## UPGRADE

```shell
$ cd /path/to/nativescript-app-sync-server
$ git pull --rebase origin master
$ ./bin/db upgrade --dbhost "your mysql host" --dbport "your mysql port"  --dbuser "your mysql user" --dbpassword "your mysql password"
# upgrade codepush database
$ pm2 restart nativescript-app-sync-server # restart service
```


## view pm2 logs

```shell
$ pm2 ls
$ pm2 show nativescript-app-sync-server
$ tail -f "output file path"
```


## Supported Storage modes

- local (default)
- qiniu (qiniu)
- s3 (aws)
- oss (aliyun)
- tencentcloud

## Default listen Host/Port  0.0.0.0/3000 

> you can change it in process.json, env: PORT,HOST


## [AppSync CLI](https://github.com/EddyVerbruggen/nativescript-app-sync-sdk-cli)

```shell
$ npm i -g nativescript-app-sync-cli
$ nativescript-app-sync login http://YOU_SERVICE_IP:3000 #login in browser account:admin password:123456
```

> change admin password eg.

```shell
$ curl -X PATCH -H "Authorization: Bearer mytoken" -H "Accept: application/json" -H "Content-Type:application/json" -d '{"oldPassword":"123456","newPassword":"654321"}' http://YOU_SERVICE_IP:3000/users/password
```

## Use [NativeScript AppSync Web](https://github.com/EddyVerbruggen/nativescript-app-sync-web) to manage apps

> add codePushWebUrl config in config.js

eg.

```json
"common": {
  "codePushWebUrl": "Your AppSync Web address",
}
```
