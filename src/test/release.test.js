import app from '../../app'
import supertest from 'supertest'
import should from "should"
import path from "path"
import _ from 'lodash'
import { TEST_AUTH_BEARER } from './index.test'

const request = supertest(app)

describe('api/apps/release.test.js', function () {

  const appName = 'Demo-ios';

  describe('add apps', function (done) {
    it('should add apps successful', function (done) {
      request.post(`/apps`)
        .set('Authorization', `Bearer ${TEST_AUTH_BEARER}`)
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
  });

  describe('release apps', function (done) {
    it('should release apps successful', function (done) {
      request.post(`/apps/${appName}/deployments/Staging/release`)
        .set('Authorization', `Bearer ${TEST_AUTH_BEARER}`)
        .attach('package', path.resolve(__dirname, './bundle.zip'))
        .field('packageInfo', `{"appVersion": "1.0.0", "description": "test", "isMandatory": false}`)
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          done();
        });
    });

    it('should release apps v2 successful', function (done) {
      request.post(`/apps/${appName}/deployments/Staging/release`)
        .set('Authorization', `Bearer ${TEST_AUTH_BEARER}`)
        .attach('package', path.resolve(__dirname, './bundle_v2.zip'))
        .field('packageInfo', `{"appVersion": "1.0.0", "description": "test", "isMandatory": false}`)
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          done();
        });
    });
  });

  describe('promote apps', function (done) {
    it('should promote apps successful', function (done) {
      request.post(`/apps/${appName}/deployments/Staging/promote/Production`)
        .set('Authorization', `Bearer ${TEST_AUTH_BEARER}`)
        .send()
        .end(function (err, res) {
          res.status.should.equal(200);
          done();
        });
    });
  });

  describe('rollback deployments', function (done) {
    it('should rollback deployments successful when point labels', function (done) {
      request.post(`/apps/${appName}/deployments/Staging/rollback/v1`)
        .set('Authorization', `Bearer ${TEST_AUTH_BEARER}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          res.text.should.equal(`ok`);
          done();
        });
    });

    it('should rollback deployments successful', function (done) {
      request.post(`/apps/${appName}/deployments/Staging/rollback`)
        .set('Authorization', `Bearer ${TEST_AUTH_BEARER}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          res.text.should.equal(`ok`);
          done();
        });
    });
  });

  describe('show deployments history', function (done) {
    it('should not show deployments history successful where deployments does not exist', function (done) {
      request.get(`/apps/${appName}/deployments/Test/history`)
        .set('Authorization', `Bearer ${TEST_AUTH_BEARER}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`does not find the deployment`);
          done();
        });
    });

    it('should show deployments history successful', function (done) {
      request.get(`/apps/${appName}/deployments/Staging/history`)
        .set('Authorization', `Bearer ${TEST_AUTH_BEARER}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          var rs = JSON.parse(res.text);
          rs.should.have.properties('history');
          rs.history.should.be.an.instanceOf(Array);
          rs.history.should.matchEach(function (it) {
            return it.should.have.properties([
              'description', 'isDisabled', 'isMandatory', 'rollout', 'appVersion', 'packageHash',
              'blobUrl', 'size', 'manifestBlobUrl', 'diffPackageMap', 'releaseMethod', 'uploadTime',
              'originalLabel', 'originalDeployment', 'label', 'releasedBy'
            ]);
          });
          done();
        });
    });
  });

  describe('delete deployments history', function (done) {
    it('should not delete deployments history successful where deployments does not exist', function (done) {
      request.delete(`/apps/${appName}/deployments/Test/history`)
        .set('Authorization', `Bearer ${TEST_AUTH_BEARER}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(406);
          res.text.should.equal(`does not find the deployment`);
          done();
        });
    });

    it('should delete deployments history successful', function (done) {
      request.delete(`/apps/${appName}/deployments/Staging/history`)
        .set('Authorization', `Bearer ${TEST_AUTH_BEARER}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          res.text.should.equal(`ok`);
          done();
        });
    });
  });

  describe('show deployments metrics', function (done) {
    it('should not show deployments metrics successful where deployments does not exist', function (done) {
      request.get(`/apps/${appName}/deployments/Test/metrics`)
        .set('Authorization', `Bearer ${TEST_AUTH_BEARER}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          done();
        });
    });

    it('should show deployments metrics successful', function (done) {
      request.get(`/apps/${appName}/deployments/Staging/metrics`)
        .set('Authorization', `Bearer ${TEST_AUTH_BEARER}`)
        .send()
        .end(function (err, res) {
          should.not.exist(err);
          res.status.should.equal(200);
          var rs = JSON.parse(res.text);
          rs.should.have.properties('metrics');
          rs.metrics.should.be.an.instanceOf(Object);
          rs.metrics.should.matchEach(function (it) {
            return it.should.have.properties(['active', 'downloaded', 'failed', 'installed']);
          });
          done();
        });
    });
  });
});
