import app from 'src/app'
import supertest from 'supertest'
import should from "should"
import _ from 'lodash'
import { TEST_AUTH_TOKEN } from './index.test'

const request = supertest(app)

describe('api/account/account.test.js', function () {
  describe('user modules', function () {
    it('should get account info successful', function (done) {
      request.get(`/account`)
        .set('Authorization', `Basic ${TEST_AUTH_TOKEN}`)
        .send()
        .end(function (err, res) {
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
