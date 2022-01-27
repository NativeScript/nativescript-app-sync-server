import express from 'express'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import helmet from 'helmet'
import config from './core/config'
import _ from 'lodash'
import fs from 'fs'
import routes from './routes/index'
import auth from './routes/auth'
import accessKeys from './routes/accessKeys'
import account from './routes/account'
import users from './routes/users'
import apps from './routes/apps'
import { AppError, NotFoundError } from './core/app-error'
import log4js from 'log4js'
import dotenv from 'dotenv'
dotenv.config()

log4js.configure(_.get(config, 'log4js', {
  appenders: {console: { type: 'console'}},
  categories : { default: { appenders: ['console'], level: 'info' }}
}));

var log = log4js.getLogger("cps:app");
var app = express();
app.use(helmet());
app.disable('x-powered-by');

app.use(log4js.connectLogger(log4js.getLogger("http"), { level: log4js.levels.INFO.levelStr, nolog: '\\.gif|\\.jpg|\\.js|\\.css$' }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//use nginx in production
//if (app.get('env') === 'development') {
log.debug("set Access-Control Header");
app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-NativeScript-AppSync-Plugin-Version, X-NativeScript-AppSync-Plugin-Name, X-NativeScript-AppSync-SDK-Version");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,PATCH,DELETE,OPTIONS");
  log.debug("use set Access-Control Header");
  next();
});
//}

log.debug("config common.storageType value: " + _.get(config, 'common.storageType'));

if (_.get(config, 'common.storageType') === 'local') {
  var localStorageDir = _.get(config, 'local.storageDir');
  if (localStorageDir) {

    log.debug("config common.storageDir value: " + localStorageDir);

    if (!fs.existsSync(localStorageDir)) {
      var e = new Error(`Please create dir ${localStorageDir}`);
      log.error(e);
      throw e;
    }
    try {
      log.debug('checking storageDir fs.W_OK | fs.R_OK');
      fs.accessSync(localStorageDir, fs.constants.W_OK | fs.constants.R_OK);
      log.debug('storageDir fs.W_OK | fs.R_OK is ok');
    } catch (e) {
      log.error(e);
      throw e;
    }
    log.debug("static download uri value: " + _.get(config, 'local.public', '/download'));
    app.use(_.get(config, 'local.public', '/download'), express.static(localStorageDir));
  } else {
    log.error('please config local storageDir');
  }
}

app.use('/', routes);
app.use('/auth', auth);
app.use('/accessKeys', accessKeys);
app.use('/account', account);
app.use('/users', users);
app.use('/apps', apps);

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (req, res, next) {
    var err = new NotFoundError();
    res.status(err.status || 404);
    res.render('error', {
      message: err.message,
      error: err
    });
    log.error(err);
  });
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
    log.error(err);
  });
} else {
  app.use(function (req, res, next) {
    var e = new NotFoundError();
    res.status(404).send(e.message);
    log.debug(e);
  });
  // production error handler
  // no stacktraces leaked to user
  app.use(function (err, req, res, next) {
    if (err instanceof AppError) {
      res.send(err.message);
      log.debug(err);
    } else {
      res.status(err.status || 500).send(err.message);
      log.error(err);
    }
  });
}

app.listen(process.env.PORT || 5000, () => {
  console.log('App is running')
})

