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
  var version;

  desc('Bump version in package.json');
  task('version', ['test'], function(releaseType) {
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
  
  desc('Modify changelog with last commits');
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

  desc("create examples");
  task("examples",['release:changelog'], function() {
    console.log('\ncreating examples documentation...');
    releaseTools.createExamples(function(err){
      if (err) {
        fail('Error while creating examples documentation: ' + err);
      }
      console.log('Done!');
      complete();
    });
  }, true);

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
  
  desc('Bumps the version and creates the tag in git');
  task('git', ['test', 'release:site'] ,function() {
    console.log('Bumping version and creating git tag...');
    releaseTools.commitToGit(version, function(err) {
      if (err) {
        fail('Error while committing new version and creating git tag: ' + err);
      }
      console.log('Done!');
      complete();
    });
  }, true);
  
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

desc('Default task is test');
task('default', ['test'], function(){}, true);