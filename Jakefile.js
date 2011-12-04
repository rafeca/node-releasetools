var releaseTools = require('./lib/main');
var Step = require('step');

// This Jakefile exposes the following tasks using the `releasetools` package:
//
//    
//     jake release:bump      # Bump version in package.json
//     jake release:build     # Build the new package version
//     jake release:site      # Create the public site  
//     jake release:publish   # Publish to GitHub and NPM
//    
// * **release:bump** method only increases the version number in the package.json
//
// * **release:build** updates the changelog, the contributors files and creates the
// annotated examples HTML files
//
// * **release:site** updates the package public site, with the new version information
//
// * **release:publish** commits everything to git, creates the git release tag, pushes to
// GitHub and publishes the package to NPM

// Customize example files to document via docco
releaseTools.setOptions({
  examplePaths: [
    'Jakefile.js'
  ]
});

// ## Test task
// This task executes the package tests by calling the standard `npm test` command
desc("execute tests");
task("test",function() {
  var spawn = require('child_process').spawn;
  var child = spawn('npm', ['test']);
  
  console.log('executing the tests...');
  
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

// Namespace with all the release related tasks
namespace('release', function() {

  // ## Build task
  desc('Modify the working copy with all the release information');
  task('build', ['test'], function(releaseType) {
    Step(
      
      // ### Update Changelog
      // It updated the `History.md` file with all the commit messages since
      // last package release (detected by last created tag).
      function() {
        console.log('Updating History.md file...');
        releaseTools.updateChangelog(this);
      },
      
      // ### Update Contributors
      // It overwrites the AUTHORS file with all the GIT commiters
      function(err) {
        if (err) throw err;
        console.log('Updating AUTHORS file...');
        releaseTools.updateAuthorsFile(this);
      },

      // ### Create examples
      // It converts all the specified example files to
      // HTML files with inline annotated comments, using 
      // [Docco](http://jashkenas.github.com/docco/)
      function(err) {
        if (err) throw err;
        console.log('creating examples documentation...');
        releaseTools.createExamples(this);
      },
      function(err) {
        if (err) fail();
        else complete();
      }
    );
  }, true);
  
  // ## Create site task
  desc('Create the public site');
  task('site', function(releaseType) {
    // ### Create site
    // It creates the `docs/` folder with the following contents:
    // * All the assets in `site/javascripts` and `site/stylesheets`
    // * The `site/index.html` skeleton file with the contents of the
    //   specified markdown files
    console.log('Creating the public site page...');
    releaseTools.createSite(function(err) {
      if (err) fail();
      else complete();
    });
  }, true);

  // ## Publish task
  desc('Publish to GitHub and NPM the new version');
  task('publish', ['test'] ,function() {
    Step(
      
      // Check if the `History.md` is modified
      // (to ensure that the `release:build` task has been already executed)
      function() {
        releaseTools.isWorkingCopyClean('History.md', this);
      },
      
      // ### Commit to Git
      // Makes the commit and creates the tag
      function(err, result) {
        if (err) throw('Error while checking if the git tree is clean: ' + err);
        if (result) throw('You must run jake release:build before publish');
        console.log('Bumping version and creating git tag...');
        releaseTools.commitToGit(this);
      },
      
      // ### Update gh-pages branch
      // If the branch does not exist, it creates it with the contents of
      // the `docs/` folder. If it already exists it copies the new contents
      // of the `docs/` folder into the branch
      function(err) {
        if (err) throw err;
        console.log('Merging changes into gh-pages branch...');
        releaseTools.updatePagesBranch(this);
      },
      
      // ### Push to GitHub
      // It just does a `git push origin`
      function(err) {
        if (err) throw err;
        console.log('Pushing changes to GitHub...');
        releaseTools.pushToGit(this);
      },
      
      // ### Publish to NPM
      // The same as `npm publish`
      function(err) {
        if (err) throw err;
        console.log('Publishing NPM package...');
        releaseTools.npmPublish(this);
      },
      function(err){
        if (err) fail();
        else complete();
      }
    );  
  }, true);
  
  // ## Update package.json task
  // It accepts a parameter which can be patch, minor or major and then 
  // upgrades the version in the `package.json` file based on the 
  // [Semantic Versioning Spec](http://semver.org/).
  // If no parameter is specified, it uses `patch`.
  desc('Bump version in package.json');
  task('bump', function(releaseType) {
    releaseType = releaseType || 'patch';
    console.log('Bumping version in package.json...');
    releaseTools.updateVersionInPackageJson(releaseType, function(err, oldVersion, newVersion) {
      if (err) {
        fail('Error while updating version in package.json: ' + err);
      }
      console.log(oldVersion + ' --> ' + newVersion);
      console.log('Done!');
      complete();
    });
  }, true);
});

desc('Default task is test');
task('default', ['test'], function(){}, true);