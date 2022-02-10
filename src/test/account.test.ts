import app from 'src/app'
import supertest from 'supertest'
import should from "should"
import _ from 'lodash'
import { TEST_ACCOUNT, TEST_PASSWORD } from './index.test'

const request = supertest(app)

describe('api/account/account.test.js', function() {
  describe('user modules', function() {
    var authToken = '';
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

    it('should get account info successful', function(done) {
      request.get(`/account`)
      .set('Authorization', `Basic ${authToken}`)
      .send()
      .end(function(err, res) {
        should.not.exist(err);
        res.status.should.equal(200);
        var rs = JSON.parse(res.text);
        rs.should.have.properties('account');
        rs.account.should.have.properties(['email', 'linkedProviders', 'name']);
        done();
      });
    });

  });
});
