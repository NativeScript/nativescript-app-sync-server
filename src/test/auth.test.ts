import supertest from 'supertest'
import should from "should"
import _ from 'lodash'
import app from 'src/app'
import { TEST_ACCOUNT, TEST_PASSWORD } from './index.test'

const request = supertest(app)

describe('api/auth/test.js', function () {

  describe('sign in', function () {
    it('should not sign in successful when account is empty', function (done) {
      request.post('/auth/login')
        .send({
          account: '',
          password: TEST_PASSWORD
        })
        .end(function (err, res) {
          should.not.exist(err);
          JSON.parse(res.text).should.containEql({ status: "ERROR", errorMessage: "Please enter your email address" });
          done();
        });
    });
    it('should not sign in successful when account is not exist', function (done) {
      request.post('/auth/login')
        .send({
          account: TEST_ACCOUNT + '1',
          password: TEST_PASSWORD
        })
        .end(function (err, res) {
          should.not.exist(err);
          JSON.parse(res.text).should.containEql({ status: "ERROR", errorMessage: "The email or password you entered is incorrect" });
          done();
        });
    });
    it('should not sign in successful when password is wrong', function (done) {
      request.post('/auth/login')
        .send({
          account: TEST_ACCOUNT,
          password: TEST_PASSWORD + '1'
        })
        .end(function (err, res) {
          should.not.exist(err);
          JSON.parse(res.text).should.containEql({ status: "ERROR", errorMessage: "The email or password you entered is incorrect" });
          done();
        });
    });
    it('should sign in successful', function (done) {
      request.post('/auth/login')
        .send({
          account: TEST_ACCOUNT,
          password: TEST_PASSWORD
        })
        .end(function (err, res) {
          should.not.exist(err);
          JSON.parse(res.text).should.containEql({ status: "OK" })
          done();
        });
    });
  });

  describe('logout', function () {
    it('should logout successful', function (done) {
      request.post('/auth/logout')
        .end(function (err, res) {
          should.not.exist(err);
          res.text.should.equal('ok');
          done();
        });
    });
  });

  describe('link', function () {
    it('should link successful', function (done) {
      request.get('/auth/link')
        .end(function (err, res) {
          should.not.exist(err);
          res.headers.location.should.equal('/auth/login');
          done();
        });
    });
  });
})