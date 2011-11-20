var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var Step = require('step');
var markdown = require('robotskirt');

var ReleaseTools = module.exports = function releaseTools(options) {
  options = options || {};
  options.currentPath = options.currentPath || path.join(__dirname, '..');

  var isWorkingCopyClean = function(callback) {
    exec('git status --porcelain', function(err, stdout, stderr) {
      if (err) {
        callback(err);
      }
      else if (stdout) {
        callback(null, false);
      } else {
        callback(null, true);
      }
    });
  };

  this.createExamples = function(callback) {
    var doccoExec = path.join(options.currentPath, 'node_modules', 'docco', 'bin', 'docco');
    var examplesPath = path.join(options.currentPath, 'examples', '*');
  
    exec(doccoExec + ' ' + examplesPath, function(err, stdout, stderr) {
      if (err) {
        callback(err);
        return;
      }
      callback();
    });
  };

  this.createSite = function(callback) {
    // Insert README.md and History.md between site/_header.html and site/_footer.html
    var html = fs.readFileSync(path.join(
      options.currentPath, 'site', 'index.html'), 'utf8'
    );
    
    var pattern = /\{\{\s*([A-Za-z0-9\.\-\_]*)\s*\}\}/gm;
    
    html = html.replace(pattern, function(fullMatch, match) {
      return markdown.toHtmlSync(
        fs.readFileSync(path.join(options.currentPath, match), 'utf8')
      );
    });

    // Write the result into docs/index.html
    fs.writeFileSync(path.join(options.currentPath, 'docs', 'index.html'), html, 'utf8');

    // Copy all the assets to docs/ folder
    exec('cp -r site/javascripts site/stylesheets docs', function(err, stdout, stderr){
      if (err) {
        callback('Error while copying the assets from site/ folder to docs/ folder: ' + err);
        return;
      }
      callback();
    });
  };

  this.createAuthorsFile = function(callback) {
    exec('git shortlog', function(err, stdout, stderr) {
      if (err) {
        callback('Error while getting the git contributors: ' + err);
        return;
      }
      fs.writeFileSync(path.join(options.currentPath, 'AUTHORS'), stdout, 'utf8');
      callback();
    });
  };

  this.updateVersion = function(releaseType, callback) {
    RELEASE_TYPES = [
      'major',
      'minor',
      'patch'
    ];
  
    Step(
      function() {
        isWorkingCopyClean(this);
      }, 
      function(err, isClean) {
        if (err) throw err;
        if (!isClean) {
          callback('There are local changes in your git repository, please commit them');
          return;
        }
       
        var jsonData = JSON.parse(fs.readFileSync(path.join(options.currentPath, "package.json"), 'utf8'));
        var version = jsonData.version.split('.');
    
        var releaseIndex = RELEASE_TYPES.indexOf(releaseType);
        if (releaseIndex !== -1) {
          releaseIndex = 2;
          version[releaseIndex]++;
          version = version.join('.');
        } else if (releaseType.split('.').length === 3) {
          version = releaseType;
        }

        jsonData.version = version;
        fs.writeFileSync(path.join(options.currentPath, "package.json"), JSON.stringify(jsonData, null, 2), 'utf8');
        callback(null, version);
      }
    );
  };

  this.updateChangelog = function(version, callback) {
    var months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
  
    Step(
      function(){
        exec('git tag | tail -1', this);
      },
      function(err, stdout) {
        if (err) throw err;
        
        if (stdout === '') {
          exec('git log --format=%H | tail -1', this)
        } else {
          return stdout;
        }
      },
      function(err, tag) {
        tag = tag.replace("\n", "");
        exec('git log ' + tag + '..HEAD --pretty=format:"  * %s"', function(err, stdout, stderr) {
          if (err) {
            callback("Error while getting the git commits: " + err);
          }

          var d = new Date();
          var changelog = '### ' + version + ' — *' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() + '*\n';

          changelog += '\n' + stdout + '\n\n';
          changelog += fs.readFileSync(path.join(options.currentPath, 'History.md'), 'utf8');

          // Write contents to `History.md` file again
          fs.writeFileSync('History.md', changelog, 'utf8');

          callback();
        });
      }
    );
  };

  this.commitToGit = function(version, callback) {  
    Step(
      function() {
        exec('git commit -a -m "Bump version to ' + version + '"', this);
      },
      function(err, stdout, stderr) {
        if (err) throw err;
        exec('git tag ' + version, callback);
      }
    );
  };

  this.createPagesBranch = function(callback) {
    Step(
      function() {
        exec('git checkout -b gh-pages', this);
      },
      function(err, stdout, stderr) {
        if (err) throw err;
        exec('ls | grep -v docs | xargs rm', this);
      },
      function(err, stdout, stderr) {
        if (err) throw err;
        exec('git mv docs/* .', this);
      },
      function(err, stdout, stderr) {
        if (err) throw err;
        exec('git commit -a -m "Initial commit in pages branch"', callback);
      }
    );
  };

  this.updatePagesBranch = function(callback) {
    Step(
      function() {
        exec('git branch | grep gh-pages | wc -l', this);
      },
      function(err, stdout, stderr) {
        if (err) throw err;
        if (parseInt(stdout, 10) !== 1) {
          this.createPagesBranch(this);
        } else {
          exec('git checkout gh-pages', this);
        }
      },
      function(err, stdout, stderr) {
        if (err) throw err;
        exec('git merge -s recursive -Xsubtree master', this);
      },
      function(err, stdout, stderr) {
        if (err) throw err;
        exec('git checkout master', callback);
      }
    );
  };

  this.pushToGit = function(callback) {
    exec('git push origin master gh-pages --tags', callback);
  };

  this.npmPublish = function(callback) {
    exec('npm publish', callback);  
  };
  
  return this;
}();