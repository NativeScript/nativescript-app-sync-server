var express = require('express');
var router = express.Router();
var Promise = require('bluebird');
var AppError = require('../core/app-error');
var middleware = require('../core/middleware');
var ClientManager = require('../core/services/client-manager');
var _ = require('lodash');
var log4js = require('log4js');
var log = log4js.getLogger("cps:index");

router.get('/', (req, res, next) => {
  res.render('index', { title: 'AppSync Server' });
});

router.get('/README.md', (req, res, next) => {
  var MarkdownIt = require('markdown-it');
  const path = require('path');
  const fs = require('fs');
  const readFile = Promise.promisify(fs.readFile);
  const README = path.join(__dirname, '../README.md');
  readFile(README, { encoding: 'utf8' })
  .then(source => {
    var md = new MarkdownIt();
    res.send(md.render(source));
  })
  .catch(e=>{
    if (e instanceof AppError.AppError) {
      res.send(e.message);
    } else {
      next(e);
    }
  });
});

router.get('/WEB_USAGE.md', (req, res, next) => {
  var MarkdownIt = require('markdown-it');
  const path = require('path');
  const fs = require('fs');
  const readFile = Promise.promisify(fs.readFile);
  const README = path.join(__dirname, '../WEB_USAGE.md');
  readFile(README, { encoding: 'utf8' })
  .then(source => {
    var md = new MarkdownIt();
    res.send(md.render(source));
  })
  .catch(e=>{
    if (e instanceof AppError.AppError) {
      res.send(e.message);
    } else {
      next(e);
    }
  });
});

router.get('/tokens', (req, res) => {
  res.render('tokens', { title: 'Get token' });
});

router.get('/updateCheck', (req, res, next) => {
  var deploymentKey = _.get(req, "query.deploymentKey");
  var appVersion = _.get(req, "query.appVersion");
  var label = _.get(req, "query.label");
  var packageHash = _.get(req, "query.packageHash");
  var clientUniqueId = _.get(req, "query.clientUniqueId");
  var clientManager = new ClientManager();
  log.info('req.query', req.query);
  clientManager.updateCheckFromCache(deploymentKey, appVersion, label, packageHash, clientUniqueId)
  .then((rs) => {
    //灰度检测
    return clientManager.chosenMan(rs.packageId, rs.rollout, clientUniqueId)
    .then((data)=>{
      if (!data) {
        rs.isAvailable = false;
        return rs;
      }
      return rs;
    });
  })
  .then((rs) => {
    delete rs.packageId;
    delete rs.rollout;
    res.send({"updateInfo":rs});
  })
  .catch((e) => {
    if (e instanceof AppError.AppError) {
      res.status(404).send(e.message);
    } else {
      next(e);
    }
  });
});

router.post('/reportStatus/download', (req, res) => {
  log.debug('req', req);
  var clientUniqueId = _.get(req, "body.clientUniqueId");
  var label = _.get(req, "body.label");
  var deploymentKey = _.get(req, "body.deploymentKey");
  var clientManager = new ClientManager();
  clientManager.reportStatusDownload(deploymentKey, label, clientUniqueId)
  .catch((err) => {
    if (!err instanceof AppError.AppError) {
      console.error(err.stack)
    }
  });
  res.send('OK');
});

router.post('/reportStatus/deploy', (req, res) => {
  log.debug('req.body', req.body);
  var clientUniqueId = _.get(req, "body.clientUniqueId");
  var label = _.get(req, "body.label");
  var deploymentKey = _.get(req, "body.deploymentKey");
  var clientManager = new ClientManager();
  clientManager.reportStatusDeploy(deploymentKey, label, clientUniqueId, req.body)
  .catch((err) => {
    if (!err instanceof AppError.AppError) {
      console.error(err.stack)
    }
  });
  res.send('OK');
});

router.get('/authenticated', middleware.checkToken, (req, res) => {
  return res.send({authenticated: true});
});

module.exports = router;
