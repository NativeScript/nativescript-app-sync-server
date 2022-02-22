import { Configuration as Log4JSConfig } from 'log4js'
import { RedisClientOptions } from 'redis'
import sequelize from 'sequelize'
import { ConfigurationOptions } from 'aws-sdk'
import os from 'os'

export default {
  // Config for database, only support mysql.
  db: {
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "codepush",
    host: process.env.DB_HOST || "db",
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql'
  } as sequelize.Options,
  // Config for Amazon s3 (https://aws.amazon.com/cn/s3/) storage when storageType value is "s3".
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN, // (optional)
    bucketName: process.env.BUCKET_NAME,
    region: process.env.REGION,
    downloadUrl: process.env.DOWNLOAD_URL, // binary files download host address.
  } as ConfigurationOptions,
  // Config for local storage when storageType value is "local".
  local: {
    // Binary files storage dir, Do not use tmpdir and it's public download dir.
    //storageDir: process.env.STORAGE_DIR, //|| "/app/_storage", // TODO this gets wiped upon deploy.. so move to The Cloud™️
    storageDir: process.env.STORAGE_DIR || "../_storage",
    // Binary files download host address which Code Push Server listen to. the files storage in storageDir.
    downloadUrl: process.env.LOCAL_DOWNLOAD_URL || "https://localhost.com/download",
    // public static download spacename.
    public: '/download'
  },
  jwt: {
    // Recommended: 63 random alpha-numeric characters
    // Generate using: https://www.grc.com/passwords.htm
    tokenSecret: process.env.TOKEN_SECRET || 'yqix10jziqI1H0UCwq0y1YCiGib2g4b3lWMl5fXO5KsB8Fk391VyjdmlUF3Tiis'
  },
  common: {
    /*
     * tryLoginTimes is control login error times to avoid force attack.
     * if value is 0, no limit for login auth, it may not safe for account. when it's a number, it means you can
     * try that times today. but it need config redis server.
     */
    tryLoginTimes: 3,
    // CodePush Web(https://github.com/lisong/code-push-web) login address.
    codePushWebUrl: process.env.WEB_APP_URL || "http://localhost:3000",
    // create patch updates's number. default value is 3
    diffNums: 3,
    // data dir for caclulate diff files. it's optimization.
    dataDir: process.env.DATA_DIR || os.tmpdir(),
    // storageType which is your binary package files store. options value is ("local" | "qiniu" | "s3"| "oss" | "tencentcloud")
    storageType: process.env.STORAGE_TYPE || "local",
    // options value is (true | false), when it's true, it will cache updateCheck results in redis.
    updateCheckCache: !!process.env.REDIS_URL,
    // options value is (true | false), when it's true, it will cache rollout results in redis
    rolloutClientUniqueIdCache: !!process.env.REDIS_URL,
  },
  // Config for smtp email，register module need validate user email project source https://github.com/nodemailer/nodemailer
  smtpConfig: {
    host: process.env.ELASTICEMAIL_SMTP_SERVER,
    port: process.env.ELASTICEMAIL_SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.ELASTICEMAIL_USERNAME,
      pass: process.env.ELASTICEMAIL_PASSWORD
    },
    tls: {
      ciphers: 'SSLv3'
    }
  },
  // Config for redis (register module, tryLoginTimes module)
  redis: {
    url: process.env.REDIS_URL || '',
  } as Omit<RedisClientOptions<never, any>, 'modules'>,
  log4js: {
    appenders: { console: { type: 'console' } },
    categories: {
      "default": { appenders: ['console'], level: 'all' },
      "startup": { appenders: ['console'], level: 'all' },
      "http": { appenders: ['console'], level: "all" }
    },
  } as Log4JSConfig
}
