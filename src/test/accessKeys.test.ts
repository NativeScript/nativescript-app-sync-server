import app from 'src/app'
import supertest from 'supertest'
import should from "should"
import _ from 'lodash'
import { TEST_AUTH_BASIC_TOKEN } from './index.test'

const request = supertest(app)

describe('api/accessKeys/accessKeys.test.js', function () {
  const friendlyName = 'test';
  const newFriendlyName = 'newtest';

  describe('create accessKeys', function () {
    it('should create accessKeys successful', function (done) {
      request.post(`/accessKeys`)
        .set('Authorization', `Basic ${TEST_AUTH_BASIC_TOKEN}`)
        .send({ createdBy: 'tablee', friendlyName: friendlyName, ttl: 30 * 24 * 60 * 60 })
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          var rs = JSON.parse(res.text);
          rs.should.have.properties('accessKey');
          rs.accessKey.should.have.properties(['name', 'createdTime', 'createdBy',
            'expires', 'description', 'friendlyName']);
          done();
        });
    });

    it('should not create accessKeys successful when friendlyName exist', function (done) {
      request.post(`/accessKeys`)
        .set('Authorization', `Basic ${TEST_AUTH_BASIC_TOKEN}`)
        .send({ createdBy: 'tablee', friendlyName: friendlyName, ttl: 30 * 24 * 60 * 60 })
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`The access key "${friendlyName}"  already exists.`);
          done();
        });
    });
  });

  describe('list accessKeys', function () {
    it('should list accessKeys successful', function (done) {
      request.get(`/accessKeys`)
        .set('Authorization', `Basic ${TEST_AUTH_BASIC_TOKEN}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          var rs = JSON.parse(res.text);
          should(rs).have.properties('accessKeys')
          should(rs.accessKeys).be.an.instanceOf(Array)
          should(rs.accessKeys).matchEach(function (it) {
            return it.should.have.properties(['name', 'createdTime', 'createdBy',
              'expires', 'description', 'friendlyName']);
          });

          done();
        });
    });
  });

  describe('delete accessKeys', function () {
    it('should delete accessKeys successful', function (done) {
      request.delete(`/accessKeys/${encodeURI(newFriendlyName)}`)
        .set('Authorization', `Basic ${TEST_AUTH_BASIC_TOKEN}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          var rs = JSON.parse(res.text);
          rs.should.have.properties('friendlyName');
          done();
        });
    });
  });

});
