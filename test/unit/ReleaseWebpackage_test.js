/* globals describe, beforeEach, it, expect, after */
(function () {
  // function (manifestConverter, manifest831, convertedManifest910) {
  'use strict';
  describe('ReleaseWebpackage', function () {
    var ReleaseWebpackage;
    var releaseWebpackage;
    var fs;
    var snapshotWpPath;
    var snapshotManifestPath;
    var notSnapshotWpPath;
    var notSnapshotManifestPath;
    var snapshotDepsWpPath;
    var path;
    var fixedVersion = '0.1.0';
    beforeEach(function () {
      fs = require('fs-extra');
      path = require('path');

      snapshotWpPath = path.resolve(__dirname, '../resources/snapshot-wp');
      snapshotManifestPath = path.join(snapshotWpPath, 'manifest.webpackage');
      notSnapshotWpPath = path.resolve(__dirname, '../resources/not-snapshot-wp');
      notSnapshotManifestPath = path.join(notSnapshotWpPath, 'manifest.webpackage');
      snapshotDepsWpPath = path.resolve(__dirname, '../resources/snapshot-deps-wp');

      ReleaseWebpackage = require('../../lib/cubx-release-webpackage');
      releaseWebpackage = new ReleaseWebpackage(snapshotWpPath);
    });
    describe('#_isValidReleaseVersion', function () {
      it('should return true for a valid 3 digits version', function () {
        expect(releaseWebpackage._isValidReleaseVersion('1.0.0')).to.be.true;
      });
      it('should return true for a valid 1 digit version', function () {
        expect(releaseWebpackage._isValidReleaseVersion('1')).to.be.true;
      });
      it('should return false for a development version version', function () {
        expect(releaseWebpackage._isValidReleaseVersion('1.2-SNAPSHOT')).to.be.false;
      });
    });
    describe('#_isValidDevVersion', function () {
      it('should return true for a valid 3 digits version', function () {
        expect(releaseWebpackage._isValidDevVersion('1.0.0-SNAPSHOT')).to.be.true;
      });
      it('should return true for a valid 1 digit version', function () {
        expect(releaseWebpackage._isValidDevVersion('1-SNAPSHOT')).to.be.true;
      });
      it('should return false for a release version version', function () {
        expect(releaseWebpackage._isValidDevVersion('1.2')).to.be.false;
      });
    });
    describe('#_determineNextDevVersion', function () {
      it('should return a valid \'nextVersion\' for a 3 digits version', function () {
        var nextVersion = releaseWebpackage._determineNextDevVersion('1.0.0');
        expect(nextVersion).to.equal('1.0.1-SNAPSHOT');
      });
      it('should return a valid \'nextVersion\' for a 2 digits version', function () {
        var nextVersion = releaseWebpackage._determineNextDevVersion('1.0');
        expect(nextVersion).to.equal('1.1-SNAPSHOT');
      });
      it('should return a valid \'nextVersion\' for a 1 digit version', function () {
        var nextVersion = releaseWebpackage._determineNextDevVersion('1');
        expect(nextVersion).to.equal('2-SNAPSHOT');
      });
      it('throws error if passed version is not a valid fixed version', function () {
        expect(function () {
          releaseWebpackage._determineNextDevVersion('1.1.0-SNAPSHOT');
        }).to.throw(/Invalid release version/);
      });
    });
    describe('#_determineReleaseVersion', function () {
      it('should return a valid \'releaseVersion\' for a 3 digits version', function () {
        var nextVersion = releaseWebpackage._determineReleaseVersion('1.0.0-SNAPSHOT');
        expect(nextVersion).to.equal('1.0.0');
      });
      it('should return a valid \'releaseVersion\' for a 2 digits version', function () {
        var nextVersion = releaseWebpackage._determineReleaseVersion('1.1-SNAPSHOT');
        expect(nextVersion).to.equal('1.1');
      });
      it('should return a valid \'releaseVersion\' for a 1 digit version', function () {
        var nextVersion = releaseWebpackage._determineReleaseVersion('2-SNAPSHOT');
        expect(nextVersion).to.equal('2');
      });
      it('throws error if passed version is not a valid development version', function () {
        expect(function () {
          releaseWebpackage._determineReleaseVersion('1.1.0');
        }).to.throw(/Invalid development version/);
      });
    });
    describe('#_getDepsInDevelopment', function () {
      var artifacts;
      var expectedDevDeps;
      beforeEach(function () {
        var manifest = JSON.parse(fs.readFileSync(path.join(snapshotDepsWpPath, 'manifest.webpackage'), 'utf8'));
        artifacts = manifest.artifacts;
        expectedDevDeps = [
          {
            artifactId: 'my-elementary-1',
            dependency: {artifactId: 'cubxpolymer', webpackageId: 'cubx.core.rte@2.0.1-SNAPSHOT'}
          },
          {
            artifactId: 'my-compound',
            dependency: {artifactId: 'bar-chart', webpackageId: 'com.incowia.lib.chart-library@0.2.0-SNAPSHOT'}
          }
        ];
        releaseWebpackage = new ReleaseWebpackage(snapshotDepsWpPath);
      });
      it('should return a list containing dependencies in development', function () {
        expect(releaseWebpackage._getDepsInDevelopment(artifacts)).to.deep.have.members(expectedDevDeps);
      });
    });
    describe('#_dependenciesListToString', function () {
      it('should return a string describing the dependencies in development', function () {
        var devDeps = [
          {
            artifactId: 'my-elementary-1',
            dependency: {artifactId: 'cubxpolymer', webpackageId: 'cubx.core.rte@2.0.1-SNAPSHOT'}
          },
          {
            artifactId: 'my-compound',
            dependency: {artifactId: 'bar-chart', webpackageId: 'com.incowia.lib.chart-library@0.2.0-SNAPSHOT'}
          }
        ];
        var expectedString = '\tArtifact: my-elementary-1' +
          '\tReferred Dependency: {"artifactId":"cubxpolymer","webpackageId":"cubx.core.rte@2.0.1-SNAPSHOT"}\n' +
          '\tArtifact: my-compound' +
          '\tReferred Dependency: {"artifactId":"bar-chart","webpackageId":"com.incowia.lib.chart-library@0.2.0-SNAPSHOT"}\n';
        expect(releaseWebpackage._dependenciesListToString(devDeps)).to.equal(expectedString);
      });
    });
    describe('#_loadManifest', function () {
      var expectedManifest;
      beforeEach(function () {
        expectedManifest = JSON.parse(fs.readFileSync(path.join(snapshotWpPath, 'manifest.webpackage'), 'utf8'));
      });
      it('should load the manifest properly', function () {
        expect(releaseWebpackage._loadManifest()).to.deep.equal(expectedManifest);
      });
    });
    describe('#updateManifestToReleaseVersion', function () {
      var manifest;
      beforeEach(function () {
        manifest = JSON.parse(fs.readFileSync(snapshotManifestPath, 'utf8'));
        releaseWebpackage.manifest = manifest;
        releaseWebpackage.options.releaseVersion = fixedVersion;
      });
      after(function () {
        manifest.version = fixedVersion + '-SNAPSHOT';
        fs.writeFileSync(snapshotManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      });
      it('should change the manifest version to next development version', function () {
        releaseWebpackage.updateManifestToReleaseVersion();
        var newManifest = JSON.parse(fs.readFileSync(snapshotManifestPath, 'utf8'));
        expect(newManifest.version).to.deep.equal(fixedVersion);
      });
    });
    describe('#updateManifestToNextDevVersion', function () {
      var manifest;
      var expectedNewVersion;
      beforeEach(function () {
        manifest = JSON.parse(fs.readFileSync(notSnapshotManifestPath, 'utf8'));
        expectedNewVersion = '0.1.1-SNAPSHOT';
        releaseWebpackage = new ReleaseWebpackage(notSnapshotWpPath);
        releaseWebpackage.manifest = manifest;
        releaseWebpackage.options.nextVersion = expectedNewVersion;
      });
      after(function () {
        manifest.version = fixedVersion;
        fs.writeFileSync(notSnapshotManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      });
      it('should change the manifest version to next development version', function () {
        releaseWebpackage.updateManifestToNextDevVersion();
        var newManifest = JSON.parse(fs.readFileSync(notSnapshotManifestPath, 'utf8'));
        expect(newManifest.version).to.deep.equal(expectedNewVersion);
      });
    });
    describe('#prepareUpload', function () {
      it('it should detect invalid release version and throw error', function () {
        expect(function () {
          releaseWebpackage.options.releaseVersion = '1.2-SNAPSHOT';
          releaseWebpackage.prepareUpload();
        }).to.throw(/Invalid release version/);
      });
      it('it should detect invalid next development version and throw error', function () {
        expect(function () {
          releaseWebpackage.options.nextVersion = '1.2';
          releaseWebpackage.prepareUpload();
        }).to.throw(/Invalid development version/);
      });
      it('it should detect dependencies under development and throw error', function () {
        expect(function () {
          releaseWebpackage = new ReleaseWebpackage(snapshotDepsWpPath);
          releaseWebpackage.prepareUpload();
        }).to.throw(/Not released dependencies/);
      });
      describe('Prepare upload works properly', function () {
        var manifest;
        beforeEach(function () {
          manifest = JSON.parse(fs.readFileSync(snapshotManifestPath, 'utf8'));
          releaseWebpackage = new ReleaseWebpackage(snapshotWpPath);
          releaseWebpackage.manifest = manifest;
        });
        after(function () {
          manifest.version = fixedVersion + '-SNAPSHOT';
          fs.writeFileSync(snapshotManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
        });
        it('it should prepare the upload correctly', function () {
          releaseWebpackage.prepareUpload();
          var newManifest = JSON.parse(fs.readFileSync(snapshotManifestPath, 'utf8'));
          expect(newManifest.version).to.deep.equal(fixedVersion);
        });
      });
    });
  });
})();
