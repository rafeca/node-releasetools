// Example of usage of the Node.js Release tools library inside a Jakefile library

// Require the package
var releaseTools = require('../lib/main');

// Create a namespace to have all the tasks together
namespace('release', function() { 
  var version;

  // ## Update package.json task
  // It accepts a parameter which can be patch, minor or major and then 
  // upgrades the version in the `package.json` file based on the 
  // [Semantic Versioning Spec](http://semver.org/).
  // If no parameter is specified, it uses `patch` as the param. 
  desc('Bump version in package.json');
  task('version', function(releaseType) {
    releaseType = releaseType || 'patch';
    releaseTools.updateVersion(releaseType, function(err, newVersion) {
      if (err) {
        fail('Error while updating version in package.json: ' + err);
      }
      version = newVersion;
      console.log('Done!');
      complete();
    });
  }, true);

  // ## Creates examples task
  // It converts all the example files inside the examples folder to an
  // HTML file with inline annotated comments, using 
  // [Docco](http://jashkenas.github.com/docco/)  
  desc("create examples");
  task("examples",['release:version'], function() {
    console.log('\ncreating examples documentation...');
    releaseTools.createExamples(function(err){
      if (err) {
        fail('Error while creating examples documentation: ' + err);
      }
      console.log('Done!');
      complete();
    });
  }, true);

  // ## Create site task
  desc("create site");
  task("site", ["release:examples"], function() {
    releaseTools.createSite(function(err){
      if (err) {
        fail('Error while creating web site: ' + err);
      }
      console.log('Done!');
      complete();
    });
  }, true);
  
  // ## Update AUTHORS task
  desc('Update AUTHORS file');
  task('authors', ["release:site"], function(){
    console.log('Updating AUTHORS file...');
    releaseTools.createAuthorsFile(function(err) {
      if (err) {
        fail('Error while updating AUTHORS file: ' + err);
      }
      console.log('Done!');
      complete();
    });
  }, true);
  
  // ## Update changelog task
  desc('Update changelog with last commits');
  task('changelog', ['release:version'], function(releaseType) {
    console.log('Updating History.md file...');
    releaseTools.updateChangelog(version, function(err) {
      if (err) {
        fail('Error while updating AUTHORS file: ' + err);
      }
      console.log('Done!');
      complete();
    });
  }, true);
  
  // ## git commits task
  desc('Bumps the version and creates the tag in git');
  task('git', ['test', 'release:site'] ,function() {
    console.log('Bumping version and creating git tag...');
    releaseTools.createGitTag(version, function(err) {
      if (err) {
        fail('Error while committing new version and creating git tag: ' + err);
      }
      console.log('Done!');
      complete();
    });
  }, true);

  // ## Pages branch task
  desc('Merge the master branch into the gh-pages branch');
  task('gh-pages', ['release:git'] ,function() {    
    console.log('Merging changes into gh-pages branch...');
    releaseTools.updatePagesBranch(function(err) {
      if (err) {
        fail('Error while merging changes into gh-pages branch: ' + err);
      }
      console.log('Done!');
      complete();
    });
  }, true);

  // ## Push to GitHub task  
  desc('Push code to GitHub and publishes the NPM package');
  task('publish', ['release:gh-pages'] ,function() {
    console.log('Pushing changes to GitHub and publishing NPM package...');
    releaseTools.pushToGit(function(err) {
      if (err) {
        fail('Error while pushing the code to GitHub repository: ' + err);
      }
      releaseTools.npmPublish(function(err) {
        if (err) {
          fail('Error while publishing the package to NPM repository: ' + err);
        }
        console.log('Done!');
        complete();
      })
    });
  }, true);
});