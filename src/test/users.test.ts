import app from 'src/app'
import * as security from 'src/core/utils/security'
import * as factory from 'src/core/utils/redis'
import supertest from 'supertest'
import should from "should"
import _ from 'lodash'
import { TEST_ACCOUNT, TEST_PASSWORD } from './index.test'

const request = supertest(app)

describe('api/users/users.test.js', function () {
  const accountExist = TEST_ACCOUNT;
  const account = 'randomNewUser@nativescript.com';
  const password = TEST_PASSWORD;
  const registerKey = `REGISTER_CODE_${security.md5(account)}`;
  const newPassword = '123456';

  describe('check email does exists', function () {
    it('should not check email successful when not input email', function (done) {
      request.get(`/users/exists`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          JSON.parse(res.text).should.containEql({ status: "ERROR", message: "Please enter your email address" });
          done();
        });
    });

    it('should not exists account when sign up', function (done) {
      request.get(`/users/exists?email=${encodeURI('newuser1@nativescript.com')}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          JSON.parse(res.text).should.containEql({ status: "OK", exists: false });
          done();
        });
    });

  });

  describe('send register code to email', function () {
    it('should not send register code successful when not input email', function (done) {
      request.post(`/users/registerCode`)
        .send({})
        .expect(200)
        .expect((res) => {
          JSON.parse(res.text).should.containEql({ status: "ERROR", message: "Please enter your email address" });
        })
        .end(done)
    });

    it('should not send register code successful when email already exists', function (done) {
      request.post(`/users/registerCode`)
        .send({ email: accountExist })
        .expect(200)
        .expect((res) => {
          JSON.parse(res.text).should.containEql({ status: "ERROR", message: `"${accountExist}" already registered` });
        })
        .end(done)
    });

    it('should send register successful', function (done) {
      request.post(`/users/registerCode`)
        .send({ email: account })
        .expect(200)
        .expect((res) => {
          JSON.parse(res.text).should.containEql({ status: "OK" });
        })
        .end(done)
    });

  });

  describe('check register code', function () {
    const token = 'invalid token';
    const account2 = '522539441@qq.com2';
    let storageToken = '';
    before(async function () {
      const client = await factory.getRedisClient();
      return client.get(registerKey)
        .then(function (t) {
          storageToken = t || '';
        })
        .finally(() => {
          client.quit()
        });
    });

    it('should not check register code successful when email already exists', function (done) {
      request.get(`/users/registerCode/exists?email=${accountExist}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          JSON.parse(res.text).should.containEql({ status: "ERROR", message: `"${accountExist}" is already registered` });
          done();
        });
    });

    it('should not check register code successful when token expired', function (done) {
      request.get(`/users/registerCode/exists?email=${account2}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          JSON.parse(res.text).should.containEql({ status: "ERROR", message: `The verification code has expired, grab a new one!` });
          done();
        });
    });

    it('should not check register code successful when token is invalid', function (done) {
      request.get(`/users/registerCode/exists?email=${account}&token=${token}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          JSON.parse(res.text).should.containEql({ status: "ERROR", message: `Incorrect verification code, please enter it again.` });
          done();
        });
    });

    it('should check register code successful', function (done) {
      request.get(`/users/registerCode/exists?email=${account}&token=${storageToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          JSON.parse(res.text).should.containEql({ status: "OK" });
          done();
        });
    });

  });

  describe('sign up', function () {
    let storageToken = '';
    before(async function () {
      const client = await factory.getRedisClient();
      return client.get(registerKey)
        .then(function (t) {
          storageToken = t || '';
        })
        .finally(() => {
          client.quit()
        });
    });

    it('should not sign up successful when password length invalid', function (done) {
      request.post(`/users`)
        .send({ email: account, password: '1234', token: storageToken })
        .expect(200)
        .expect((result) => {
          const res = JSON.parse(result.text)
          res.should.containEql({ status: "ERROR", message: `Please enter a password of 6 to 20 digits` });
        }).end(done)
    });

    it('should sign up successful', function (done) {
      request.post(`/users`)
        .send({ email: account, password: password, token: storageToken })
        .end(function (err, res) {
          should.not.exist(err);
          JSON.parse(res.text).should.containEql({ status: "OK" });
          done();
        });
    });
  });

  describe('change password', function () {
    let authBasicToken = '';
    before(function (done) {
      request.post('/auth/login')
        .send({
          account: account,
          password: password
        })
        .end(function (err, res) {
          should.not.exist(err);
          const rs = JSON.parse(res.text);
          rs.should.containEql({ status: "OK" });
          authBasicToken = Buffer.from(`auth:${_.get(rs, 'results.tokens')}`).toString('base64');
          done();
        });
    });

    it('should not change password successful when authToken invalid', function (done) {
      request.patch(`/users/password`)
        .set('Authorization', `Basic 11345`)
        .send({ oldPassword: password, newPassword: newPassword })
        .end(function (err, res) {
          should.not.exist(err);
          var rs = JSON.parse(res.text);
          res.status.should.equal(200);
          rs.should.containEql({ status: 401 });
          done();
        });
    });

    it('should not change password successful where password invalid', function (done) {
      request.patch(`/users/password`)
        .set('Authorization', `Basic ${authBasicToken}`)
        .send({ oldPassword: '123321', newPassword: newPassword })
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          JSON.parse(res.text).should.containEql({ status: "ERROR", message: `The old password is incorrect, please try again` });
          done();
        });
    });

    it('should not change password successful where new password invalid', function (done) {
      request.patch(`/users/password`)
        .set('Authorization', `Basic ${authBasicToken}`)
        .send({ oldPassword: password, newPassword: '1234' })
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          JSON.parse(res.text).should.containEql({ status: "ERROR", message: `Please enter a password between 6 and 20 characters` });
          done();
        });
    });

    it('should change password successful', function (done) {
      request.patch(`/users/password`)
        .set('Authorization', `Basic ${authBasicToken}`)
        .send({ oldPassword: password, newPassword: newPassword })
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          JSON.parse(res.text).should.containEql({ status: "OK" });
          done();
        });
    });
  });

  describe('user modules', function () {
    let authToken = '';
    before(function (done) {
      request.post('/auth/login')
        .send({
          account: account,
          password: newPassword
        })
        .end(function (err, res) {
          should.not.exist(err);
          const rs = JSON.parse(res.text);
          rs.should.containEql({ status: "OK" });
          authToken = (Buffer.from(`auth:${_.get(rs, 'results.tokens')}`)).toString('base64');
          done();
        });
    });

    it('should get userinfo successful', function (done) {
      request.get(`/users`)
        .set('Authorization', `Basic ${authToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          done();
        });
    });

  });

});
