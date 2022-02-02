import app from 'src/app'
import config from 'src/core/config'
import * as redis from 'src/core/utils/redis'
import supertest from 'supertest'
import should from "should"
import _ from 'lodash'
import mysql from 'mysql2'
import fs from 'fs'
import path from 'path'

const request = supertest(app)
export const TEST_ACCOUNT = 'test@nativescript.com';
export const TEST_PASSWORD = 'password123!';
export const TEST_COLABORATOR_ACCOUNT = 'colab@nativescript.com';

describe('api/init/database.js', function () {

  describe('create database', function () {
    it('should create database successful', function (done) {
      const connection = mysql.createConnection({
        host: config.db.host,
        user: config.db.username,
        password: config.db.password,
        multipleStatements: true
      });
      connection.connect();
      connection.query(`DROP DATABASE IF EXISTS ${config.db.database};CREATE DATABASE IF NOT EXISTS ${config.db.database}`, function (err, rows, fields) {
        should.not.exist(err);
        done();
      });
      connection.end();
    });
  });

  describe('flushall redis', function () {
    it('should flushall redis successful', async function () {
      try {
        const client = await redis.getRedisClient();
        const reply = await client.flushAll()

        reply.toLowerCase().should.equal('ok');
      } catch (error) {
        should.not.exist(error);
      }
    });
  });

  describe('import data from sql files', function () {
    let connection: mysql.Connection
    before(function () {
      connection = mysql.createConnection({
        host: config.db.host,
        user: config.db.username,
        password: config.db.password,
        database: config.db.database,
        multipleStatements: true
      });
      connection.connect();
    });

    after(function () {
      connection.end();
    });

    it('should import data codepush-all.sql successful', function (done) {
      const sql = fs.readFileSync(path.resolve(__dirname, '../../sql/codepush-all.sql'), 'utf-8');
      connection.query(sql, function (err, results) {
        should.not.exist(err);
        done();
      });
    });

  });
});

describe('api/index/index.test.js', function () {
  const appName = 'Demo-ios';

  let authToken;
  let deploymentKey;
  let packageHash;
  let label;
  before(function (done) {
    request.post('/auth/login')
      .send({ account: TEST_ACCOUNT, password: TEST_PASSWORD })
      .end(function (err, res) {
        should.not.exist(err);
        var rs = JSON.parse(res.text);
        rs.should.containEql({ status: "OK" });
        authToken = (Buffer.from(`auth:${_.get(rs, 'results.tokens')}`)).toString('base64');
        done();
      });
  });

  describe('list apps all deployments', function () {
    it('should list apps all deployments successful', function (done) {
      request.get(`/apps/${appName}/deployments`)
        .set('Authorization', `Basic ${authToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          var rs = JSON.parse(res.text);
          rs.should.have.properties('deployments');
          rs.deployments.should.be.an.instanceOf(Array);
          rs.deployments.should.matchEach(function (it) {
            if (_.get(it, 'name') == 'Production') {
              deploymentKey = _.get(it, 'key');
              packageHash = _.get(it, 'package.packageHash');
              label = _.get(it, 'package.label');
            }
            return it.should.have.properties(['createdTime', 'id', 'key', 'name', 'package']);
          });
          done();
        });
    });
  });

  describe('authenticated', function () {
    it('should authenticated successful', function (done) {
      request.get(`/authenticated`)
        .set('Authorization', `Basic ${authToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          done();
        });
    });
  });

  describe('updateCheck', function () {
    it('should not updateCheck successful where deploymentKey is empty', function (done) {
      request.get(`/updateCheck?deploymentKey=&appVersion=1.0.0&label=&packageHash=`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(404);
          res.text.should.equal(`please input deploymentKey and appVersion`);
          done();
        });
    });

    it('should not updateCheck successful where deploymentKey does not exist', function (done) {
      request.get(`/updateCheck?deploymentKey=123&appVersion=1.0.0&label=&packageHash=`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(404);
          res.text.should.equal(`Not found deployment, check deployment key is right.`);
          done();
        });
    });

    it('should updateCheck successful', function (done) {
      request.get(`/updateCheck?deploymentKey=${deploymentKey}&appVersion=1.0.0&label=&packageHash=`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          var rs = JSON.parse(res.text);
          rs.should.have.properties('updateInfo');
          rs.updateInfo.should.have.properties([
            'downloadURL', 'description', 'isAvailable', 'isMandatory', 'appVersion',
            'packageHash', 'label', 'packageSize', 'updateAppVersion', 'shouldRunBinaryVersion'
          ]);
          rs.updateInfo.isAvailable.should.be.true;
          done();
        });
    });

    it('should updateCheck successful when packageHash is newer', function (done) {
      request.get(`/updateCheck?deploymentKey=${deploymentKey}&appVersion=1.0.0&label=&packageHash=${packageHash}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          var rs = JSON.parse(res.text);
          rs.should.have.properties('updateInfo');
          rs.updateInfo.should.have.properties([
            'downloadURL', 'description', 'isAvailable', 'isMandatory', 'appVersion',
            'packageHash', 'label', 'packageSize', 'updateAppVersion', 'shouldRunBinaryVersion'
          ]);
          rs.updateInfo.isAvailable.should.be.false;
          done();
        });
    });
  });

  describe('reportStatus download', function () {
    console.log('deploymentKey', deploymentKey)
    it('should reportStatus download successful', function (done) {
      request.post(`/reportStatus/download`)
        .send({
          clientUniqueId: Math.random(),
          label,
          deploymentKey
        })
        .expect(200)
        .expect(res => {
          res.text.should.equal(`OK`);
        }) 
        .end(done);
    });
  });

  describe('reportStatus deploy', function () {
    it('should reportStatus deploy successful', function (done) {
      request.post(`/reportStatus/deploy`)
        .send({
          clientUniqueId: Math.random(),
          label: label,
          deploymentKey: deploymentKey,
          status: 'DeploymentSucceeded'
        })
        .expect(200)
        .expect(res => {
          res.text.should.equal(`OK`);
        }) 
        .end(done)
    });

    it('should reportStatus deploy successful', function (done) {
      request.post(`/reportStatus/deploy`)
        .send({
          clientUniqueId: Math.random(),
          label,
          deploymentKey,
          status: 'DeploymentFailed'
        })
        .expect(200)
        .expect(res => {
          res.text.should.equal(`OK`);
        }) 
        .end(done);
    });
  });
});
