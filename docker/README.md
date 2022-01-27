# docker deploy code-push-server

> This document is used to describe the docker deployment code-push-server, the example consists of three parts

- code-push-server section
  - Update packages are stored in `local` by default (i.e. stored on the local machine). Using the docker volume storage method, container destruction will not cause data loss unless the volume is manually deleted.
  - Internally, pm2 cluster mode is used to manage processes. The default number of open processes is the number of CPUs. You can set the deploy parameters in the docker-compose.yml file according to your own machine configuration.
  - docker-compose.yml only provides some parameter settings of the application. If you need to set other configurations, you can modify the file config.js
- mysql part
  - Data is stored in docker volume, and container destruction will not cause data loss unless the volume is manually deleted.
  - Do not use the root user for the application. For security, you can create permissions with relatively small permissions for use by code-push-server. You only need to give `select, update, insert` permissions. To initialize the database, you need to use root or have permission to create a table
- redis部分
  - `tryLoginTimes` Login Error Limit
  - `updateCheckCache` Improve application performance 
  - `rolloutClientUniqueIdCache` grayscale release

## install docker

Refer to the official docker installation tutorial

- [>>mac](https://docs.docker.com/docker-for-mac/install/)
- [>>windows](https://docs.docker.com/docker-for-windows/install/)
- [>>linux](https://docs.docker.com/install/linux/docker-ce/ubuntu/)


`$ docker info` If the relevant information can be successfully output, the installation is successful, and the following steps can be continued.

## start up swarm

```shell
$ sudo docker swarm init
```


## get code

```shell
$ git clone https://github.com/lisong/code-push-server.git
$ cd code-push-server/docker
```

##  Modify the configuration file

```shell
$ vim docker-compose.yml
```

*Replace `YOU_MACHINE_IP` in `DOWNLOAD_URL` with your own external network ip or domain name*

*Replace `YOU_MACHINE_IP` in `MYSQL_HOST` with the local network ip*

*Replace `YOU_MACHINE_IP` in `REDIS_HOST` with the local network ip*

## jwt.tokenSecret modification

> code-push-server verifies the json web token encryption method used by the login authentication method. The symmetric encryption algorithm is public, so it is very important to modify the tokenSecret value in config.js.

*Very important! Very important! Very important! *

> You can open the connection `https://www.grc.com/passwords.htm` to obtain a randomly generated number of type `63 random alpha-numeric characters` as the key

## deploy

```shell
$ sudo docker stack deploy -c docker-compose.yml code-push-server
```

> If the internet speed is not good, a long and patient wait is required. . . Let's chat with the girls ^_^


## View progress

```shell
$ sudo docker service ls
$ sudo docker service ps code-push-server_db
$ sudo docker service ps code-push-server_redis
$ sudo docker service ps code-push-server_server
```

> Make sure `CURRENT STATE` is `Running about ...`, the deployment is complete

## Access interface simple verification

`$ curl -I http://YOUR_CODE_PUSH_SERVER_IP:3000/`

returns `200 OK`

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

## Browser login

> Default username: admin Password: 123456 Remember to change the default password
> If you enter the wrong password continuously for more than a certain number of times, you will no longer be able to log in. You need to clear the redis cache

```shell
$ redis-cli -p6388  # 进入redis
> flushall
> quit
```


## View service logs

```shell
$ sudo docker service logs code-push-server_server
$ sudo docker service logs code-push-server_db
$ sudo docker service logs code-push-server_redis
```

## View storage `docker volume ls`

DRIVER | VOLUME NAME |  描述    
------ | ----- | -------
local  | code-push-server_data-mysql | database storage data directory
local  | code-push-server_data-storage | directory to store packaged files
local  | code-push-server_data-tmp | Temporary directory for calculating update package difference files
local  | code-push-server_data-redis | redis landing data

## destroy exit application

```bash
$ sudo docker stack rm code-push-server
$ sudo docker swarm leave --force
```
