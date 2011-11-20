var releaseTools = require('./lib/main');

desc("execute tests");
task("test",function() {
  var spawn = require('child_process').spawn;
  var child = spawn('npm', ['test']);
  
  console.log('\nexecuting the tests...');
  
  child.stderr.on('data', function(stderr) {
    process.stderr.write(stderr);
  });
  child.stdout.on('data', function(stdout) {
    process.stdout.write(stdout);
  });
  child.on('exit', function(code) {
    if (code !== 0) {
      fail(code);
    } else {
      console.log('Done!');
      complete();
    }
  });
}, true);

namespace('release', function() {   
  // ## Update changelog task
  desc('Update changelog with last commits');
  task('changelog', ['test'], function(releaseType) {
    console.log('Updating History.md file...');
    releaseTools.updateChangelog(function(err) {
      if (err) {
        fail('Error while updating Changelog: ' + err);
      }
      console.log('Done!');
      complete();
    });
  }, true);

  // ## Update AUTHORS task
  desc('Update AUTHORS file');
  task('authors', ["release:changelog"], function(){
    console.log('Updating AUTHORS file...');
    releaseTools.updateAuthorsFile(function(err) {
      if (err) {
        fail('Error while updating AUTHORS file: ' + err);
      }
      console.log('Done!');
      complete();
    });
  }, true);

  // ## Creates examples task
  // It converts all the example files inside the examples folder to an
  // HTML file with inline annotated comments, using 
  // [Docco](http://jashkenas.github.com/docco/)
  desc("create examples");
  task("examples",['release:authors'], function() {
    console.log('creating examples documentation...');
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
  
  // ## Git commits task
  // Makes the commit and creates the tag
  desc('Bumps the version and creates the tag in git');
  task('git', ['test'] ,function() {
    // First of all, check if the other tasks have been executed
    releaseTools.isWorkingCopyClean('History.md', function(err, result){
      if (err) {
        fail('Error while checking if the git tree is clean: ' + err);
      }
      if (result) {
        fail('You must run jake release:site before publishing anything');
      }
      
      console.log('Bumping version and creating git tag...');
      releaseTools.commitToGit(function(err) {
        if (err) {
          fail('Error while committing new version and creating git tag: ' + err);
        }
        console.log('Done!');
        complete();
      });
      
    });    
  }, true);
  
  // ## Update pages branch task
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
  
  // ## Update package.json task
  // It accepts a parameter which can be patch, minor or major and then 
  // upgrades the version in the `package.json` file based on the 
  // [Semantic Versioning Spec](http://semver.org/).
  // If no parameter is specified, it uses `patch` as the param.
  desc('Bump version in package.json');
  task('version', function(releaseType) {
    releaseType = releaseType || 'patch';
    console.log('Bumping version in package.json...');
    releaseTools.updateVersion(releaseType, function(err, newVersion) {
      if (err) {
        fail('Error while updating version in package.json: ' + err);
      }
      version = newVersion;
      console.log('Done!');
      complete();
    });
  }, true);
});

desc('Default task is test');
task('default', ['test'], function(){}, true);