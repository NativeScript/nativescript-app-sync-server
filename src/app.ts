import express, { ErrorRequestHandler } from 'express'
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
import log4js from 'log4js'
import dotenv from 'dotenv'
import * as middleware from "./core/middleware"
import { UsersInstance } from "./models/users"
import { AppError } from './core/app-error'
dotenv.config()

declare global {
  namespace Express {
    interface Request { users: UsersInstance }
  }
}

log4js.configure(_.get(config, 'log4js', {
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'info' } }
}));

const log = log4js.getLogger("cps:app");
const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.disable('x-powered-by');
app.use(log4js.connectLogger(log4js.getLogger("http"), { level: log4js.levels.INFO.levelStr, nolog: '\\.gif|\\.jpg|\\.js|\\.css$' }));

//use nginx in production
//if (app.get('env') === 'development') {
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
      fs.mkdirSync(localStorageDir)
      console.log('Created local storage dir', localStorageDir)
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
app.use('/accessKeys', middleware.checkToken, accessKeys);
app.use('/account', middleware.checkToken, account);
app.use('/apps', middleware.checkToken, apps);
app.use('/users', users);

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof AppError)
    res.status(err.status).json(err)
  else
    res.status(500).json('Internal Server Error')
}
app.use(errorHandler);

export default app

