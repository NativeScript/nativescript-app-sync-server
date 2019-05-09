var config = require('../../../core/config');
var mysql = require('mysql2');
var redis = require('redis');
var should = require('should');
var fs = require('fs');
var path   = require('path');

describe('api/init/database.js', function() {

  describe('create database', function(done) {
    it('should create database successful', function(done) {
      var connection = mysql.createConnection({
        host: config.db.host,
        user: config.db.username,
        password: config.db.password,
        multipleStatements: true
      });
      connection.connect();
      connection.query(`DROP DATABASE IF EXISTS ${config.db.database};CREATE DATABASE IF NOT EXISTS ${config.db.database}`, function(err, rows, fields) {
        should.not.exist(err);
        done();
      });
      connection.end();
    });
  });

  describe('flushall redis', function(done) {
    it('should flushall redis successful', function(done) {
      var client = redis.createClient(config.redis.default);
      client.flushall(function (err, reply) {
        should.not.exist(err);
        reply.toLowerCase().should.equal('ok');
        done();
      });
    });
  });

  describe('import data from sql files', function(done) {
    var connection;
    before(function() {
      connection = mysql.createConnection({
        host: config.db.host,
        user: config.db.username,
        password: config.db.password,
        database: config.db.database,
        multipleStatements: true
      });
      connection.connect();
    });

    after(function() {
      connection.end();
    });

    it('should import data codepush-all.sql successful', function(done) {
      var sql = fs.readFileSync(path.resolve(__dirname, '../../../sql/codepush-all.sql'), 'utf-8');
      connection.query(sql, function(err, results) {
        should.not.exist(err);
        done();
      });
    });
  });

});
