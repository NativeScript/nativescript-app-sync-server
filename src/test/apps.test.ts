import app from '../app'
import supertest from 'supertest'
import should from "should"
import _ from 'lodash'
import { TEST_ACCOUNT, TEST_PASSWORD, TEST_COLABORATOR_ACCOUNT } from './index.test'

const request = supertest(app)

describe('api/apps/apps.test.js', function () {
  const emailInvalid = TEST_COLABORATOR_ACCOUNT + 'hello';
  const machineName = `Login-${Math.random()}`;
  const friendlyName = `Login-${Math.random()}`;
  const appName = 'test';
  const newAppName = 'newtest';
  const testDeployment = 'test';
  const newTestDeployment = 'newtest';
  let bearerToken = '';
  let authToken = '';


  before(function (done) {
    request.post('/auth/login')
      .send({
        account: TEST_ACCOUNT,
        password: TEST_PASSWORD
      })
      .end(function (err, res) {
        should.not.exist(err);
        var rs = JSON.parse(res.text);
        rs.should.containEql({ status: "OK" });
        authToken = (Buffer.from(`auth:${_.get(rs, 'results.tokens')}`)).toString('base64');
        done();
      });
  });

  describe('create accessKeys', function () {
    it('should create accessKeys successful', function (done) {
      request.post(`/accessKeys`)
        .set('Authorization', `Basic ${authToken}`)
        .send({ createdBy: machineName, friendlyName: friendlyName, ttl: 30 * 24 * 60 * 60 })
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          var rs = JSON.parse(res.text);
          rs.should.have.properties('accessKey');
          rs.accessKey.should.have.properties(['name', 'createdTime', 'createdBy',
            'expires', 'description', 'friendlyName']);
          bearerToken = _.get(rs, 'accessKey.name');
          done();
        });
    });
  });

  describe('add apps', function () {
    it('should not add apps successful when appName is empty', function (done) {
      request.post(`/apps`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({})
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`Please input name!`);
          done();
        });
    });

    it('should add apps successful', function (done) {
      request.post(`/apps`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ name: appName, os: 'iOS', platform: 'React-Native' })
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          var rs = JSON.parse(res.text);
          rs.should.have.properties('app');
          rs.app.should.have.properties(['name', 'collaborators']);
          done();
        });
    });

    it('should not add apps successful when appName exists', function (done) {
      request.post(`/apps`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ name: appName, os: 'iOS', platform: 'React-Native' })
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`${appName} Exist!`);
          done();
        });
    });
  });

  describe('list apps', function () {
    it('should list apps successful', function (done) {
      request.get(`/apps`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          const rs = JSON.parse(res.text);
          should(rs).have.properties('apps')
          should(rs.apps).be.an.instanceOf(Array)
          should(rs.apps).matchEach(function (it) {
            return it.should.have.properties(['collaborators', 'deployments', 'name']);
          });
        
          done();
        });
    });
  });

  describe('list apps all deployments', function () {
    it('should list apps all deployments successful', function (done) {
      request.get(`/apps/${appName}/deployments`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          const rs = JSON.parse(res.text);

          should(rs).have.properties('deployments')
          should(rs.deployments).be.an.instanceOf(Array)
          should(rs.deployments).matchEach(function (it) {
            return it.should.have.properties(['createdTime', 'id', 'key', 'name', 'package']);
          });
         
          done();
        });
    });
  });

  describe(`create deployments ${testDeployment}`, function () {
    it('should create deployments successful', function (done) {
      request.post(`/apps/${appName}/deployments`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ name: testDeployment })
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          var rs = JSON.parse(res.text);
          rs.should.have.properties('deployment');
          rs.deployment.should.have.properties(['key', 'name']);
          done();
        });
    });

    it('should not create deployments successful when deployment exists', function (done) {
      request.post(`/apps/${appName}/deployments`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ name: testDeployment })
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`${testDeployment} name does Exist!`);
          done();
        });
    });
  });

  describe(`rename deployments ${testDeployment}`, function () {
    it('should rename deployments successful', function (done) {
      request.patch(`/apps/${appName}/deployments/${testDeployment}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ name: newTestDeployment })
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          var rs = JSON.parse(res.text);
          rs.should.have.properties('deployment');
          rs.deployment.should.have.properties(['name']);
          done();
        });
    });

    it('should not rename deployments successful when new deployments name does exists', function (done) {
      request.patch(`/apps/${appName}/deployments/${testDeployment}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ name: newTestDeployment })
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`${newTestDeployment} name does Exist!`);
          done();
        });
    });

    it('should not rename deployments successful when deployments name does not exists', function (done) {
      request.patch(`/apps/${appName}/deployments/${testDeployment}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ name: 'hello' })
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`does not find the deployment "${testDeployment}"`);
          done();
        });
    });
  });

  describe(`delete deployments ${newTestDeployment}`, function () {
    it('should delete deployments successful', function (done) {
      request.delete(`/apps/${appName}/deployments/${newTestDeployment}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          var rs = JSON.parse(res.text);
          rs.should.have.properties('deployment');
          rs.deployment.should.have.properties(['name']);
          done();
        });
    });

    it(`should not delete deployments successful when ${newTestDeployment} not exists`, function (done) {
      request.delete(`/apps/${appName}/deployments/${newTestDeployment}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`does not find the deployment "${newTestDeployment}"`);
          done();
        });
    });
  });

  describe(`add collaborators`, function () {
    it(`should not add collaborators successful when email invalid`, function (done) {
      request.post(`/apps/${appName}/collaborators/${emailInvalid}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`${emailInvalid} does not exist`);
          done();
        });
    });

    it('should add collaborators successful', function (done) {
      request.post(`/apps/${appName}/collaborators/${TEST_COLABORATOR_ACCOUNT}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          done();
        });
    });

    it(`should not add collaborators successful when ${TEST_COLABORATOR_ACCOUNT} is already a collaborators`, function (done) {
      request.post(`/apps/${appName}/collaborators/${TEST_COLABORATOR_ACCOUNT}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`user already is Collaborator.`);
          done();
        });
    });
  });

  describe(`list collaborators`, function () {
    it('should list collaborators successful', function (done) {
      request.get(`/apps/${appName}/collaborators`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          var rs = JSON.parse(res.text);
          rs.should.have.properties('collaborators');
          done();
        });
    });
  });

  describe(`delete collaborators`, function () {
    it(`should not delete collaborators successful when ${emailInvalid} invalid`, function (done) {
      request.delete(`/apps/${appName}/collaborators/${emailInvalid}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`${emailInvalid} does not exist`);
          done();
        });
    });

    it(`should not delete collaborators successful when email is yourself`, function (done) {
      request.delete(`/apps/${appName}/collaborators/${TEST_ACCOUNT}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`can't delete yourself!`);
          done();
        });
    });

    it('should delete collaborators successful', function (done) {
      request.delete(`/apps/${appName}/collaborators/${TEST_COLABORATOR_ACCOUNT}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          done();
        });
    });

    it(`should not delete collaborators successful when ${TEST_COLABORATOR_ACCOUNT} is not a collaborators`, function (done) {
      request.delete(`/apps/${appName}/collaborators/${TEST_COLABORATOR_ACCOUNT}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`user is not a Collaborator`);
          done();
        });
    });
  });

  describe(`transfer apps`, function () {
    let authTokenOther = '';
    before(function (done) {
      request.post('/auth/login')
        .send({
          account: TEST_COLABORATOR_ACCOUNT,
          password: TEST_PASSWORD
        })
        .end(function (err, res) {
          should.not.exist(err);
          var rs = JSON.parse(res.text);
          rs.should.containEql({ status: "OK" });
          authTokenOther = (new Buffer(`auth:${_.get(rs, 'results.tokens')}`)).toString('base64');
          done();
        });
    });

    it(`should not transfer apps successful when ${emailInvalid} invalid`, function (done) {
      request.post(`/apps/${appName}/transfer/${emailInvalid}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`${emailInvalid} does not exist`);
          done();
        });
    });

    it(`should not transfer apps successful when email is yourself`, function (done) {
      request.post(`/apps/${appName}/transfer/${TEST_ACCOUNT}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`You can't transfer to yourself!`);
          done();
        });
    });

    it(`should transfer apps successful`, function (done) {
      request.post(`/apps/${appName}/transfer/${TEST_COLABORATOR_ACCOUNT}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          done();
        });
    });

    it(`should transfer apps back successful`, function (done) {
      request.post(`/apps/${appName}/transfer/${TEST_ACCOUNT}`)
        .set('Authorization', `Basic ${authTokenOther}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          done();
        });
    });
  });

  describe(`rename apps`, function () {
    it(`should not rename apps successful when new name is invalid`, function (done) {
      request.patch(`/apps/${appName}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`Please input name!`);
          done();
        });
    });

    it(`should not rename apps successful when new name does exists`, function (done) {
      request.patch(`/apps/${appName}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ name: appName })
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`${appName} Exist!`);
          done();
        });
    });

    it(`should rename apps successful`, function (done) {
      request.patch(`/apps/${appName}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ name: newAppName })
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          done();
        });
    });
  });

  describe(`delete apps`, function () {
    it(`should delete apps successful`, function (done) {
      request.delete(`/apps/${newAppName}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          done();
        });
    });
  });

});
