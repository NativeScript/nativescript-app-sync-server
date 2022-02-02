import app from 'src/app'
import supertest from 'supertest'
import should from "should"
import _ from 'lodash'
import { TEST_ACCOUNT, TEST_PASSWORD } from './index.test'

const request = supertest(app)
describe('api/accessKeys/accessKeys.test.js', function() {

  var authToken;
  var friendlyName = 'test';
  var newFriendlyName = 'newtest';
  before(function(done){
    request.post('/auth/login')
    .send({
      account: TEST_ACCOUNT,
      password: TEST_PASSWORD
    })
    .end(function(err, res) {
      should.not.exist(err);
      var rs = JSON.parse(res.text);
      rs.should.containEql({status:"OK"});
      authToken = (Buffer.from(`auth:${_.get(rs, 'results.tokens')}`)).toString('base64');
      done();
    });
  });

  describe('create accessKeys', function() {
    it('should create accessKeys successful', function(done) {
      request.post(`/accessKeys`)
      .set('Authorization', `Basic ${authToken}`)
      .send({createdBy: 'tablee', friendlyName: friendlyName, ttl: 30*24*60*60})
      .end(function(err, res) {
        should.not.exist(err);
        res.status.should.equal(200);
        var rs = JSON.parse(res.text);
        rs.should.have.properties('accessKey');
        rs.accessKey.should.have.properties(['name', 'createdTime', 'createdBy',
          'expires', 'description', 'friendlyName']);
        done();
      });
    });

    it('should not create accessKeys successful when friendlyName exist', function(done) {
      request.post(`/accessKeys`)
      .set('Authorization', `Basic ${authToken}`)
      .send({createdBy: 'tablee', friendlyName: friendlyName, ttl: 30*24*60*60})
      .end(function(err, res) {
        should.not.exist(err);
        res.status.should.equal(406);
        res.text.should.equal(`The access key "${friendlyName}"  already exists.`);
        done();
      });
    });
  });

  describe('list accessKeys', function() {
    it('should list accessKeys successful', function(done) {
      request.get(`/accessKeys`)
      .set('Authorization', `Basic ${authToken}`)
      .send()
      .end(function(err, res) {
        should.not.exist(err);
        res.status.should.equal(200);
        var rs = JSON.parse(res.text);
        rs.should.have.properties('accessKeys');
        rs.accessKeys.should.be.an.instanceOf(Array);
        rs.accessKeys.should.matchEach(function(it) {
          return it.should.have.properties(['name', 'createdTime', 'createdBy',
          'expires', 'description', 'friendlyName']);
        });
        done();
      });
    });
  });

  describe('delete accessKeys', function() {
    it('should delete accessKeys successful', function(done) {
      request.delete(`/accessKeys/${encodeURI(newFriendlyName)}`)
      .set('Authorization', `Basic ${authToken}`)
      .send()
      .end(function(err, res) {
        should.not.exist(err);
        res.status.should.equal(200);
        var rs = JSON.parse(res.text);
        rs.should.have.properties('friendlyName');
        done();
      });
    });
  });

});
