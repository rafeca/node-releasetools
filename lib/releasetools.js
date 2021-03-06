var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var Step = require('step');
var markdown = require('marked');
var semver = require('semver');

var extend = function(obj1, obj2) {
	var output = {};
	for (key in obj1) {
		output[key] = obj2[key] ? obj2[key] : obj1[key]
	}
	return output;
};

var ReleaseTools = module.exports = function releaseTools() {
  var options = {
    currentPath: process.cwd(),
    changelogFile: 'History.md',
    authorsFile: 'AUTHORS',
    siteIndexPath: 'site/index.html',
    siteAssetsPaths: [
      'site/javascripts',
      'site/stylesheets'
    ],
    examplePaths: [
      'examples/*'
    ]
  };

  var libPath = path.join(__dirname, '..');
  
  var getCurrentVersion = function() {
    return JSON.parse(
      fs.readFileSync(path.join(options.currentPath, "package.json"), 'utf8')
    ).version;
  };
  
  var getCurrentBranch = function(callback) {
    exec('git symbolic-ref HEAD', function(err, stdout, stderr){
      if (err) {
        callback(err);
        return;
      }
      
      var currentBranch = stdout.split('/');
      currentBranch = currentBranch[currentBranch.length-1].replace('\n', '');
      callback(null, currentBranch);
    });
  }
  
  var formatDate = function(d) {
    var months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  };
  
  var createPagesBranch = function(callback) {
    Step(
      function() {
        exec('git checkout -b gh-pages', this);
      },
      function(err, stdout, stderr) {
        if (err) throw err;
        exec('ls | grep -v docs | xargs rm -r', this);
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
  
  this.setOptions = function(newOptions) {
    options = extend(options, newOptions);
  };
  
  this.isWorkingCopyClean = function(file, callback) {
    if (typeof callback === 'undefined') {
      callback = file;
      file = '';
    }
    
    exec('git status --porcelain ' + file, function(err, stdout, stderr) {
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
  
  this.updateChangelog = function(callback) {
    
    var currentVersion = getCurrentVersion();
  
    Step(
      function(){
        exec('git checkout ' + options.changelogFile, this);
      },
      function(){
        exec('git describe  --tags --abbrev=0', this);
      },
      function(err, tag) {
        if (err) {
          // When there are no tags, git describe returns an error
          tag = '';
        }
        tag = tag.replace('\n', '');
        var interval = '';
        if (tag !== '') {
          if (tag == currentVersion) {
            throw new Error('First you have to update your package.json with the release version.' +
                  'You can use the method updateVersionInPackageJson(<major|minor|patch>)');
          }
          interval = tag + '..HEAD ';
        }
        
        exec('git log ' + interval + '--pretty=format:"  * %s"', function(err, stdout, stderr) {
          if (err) {
            callback(new Error("Error while getting the git commits: " + err));
            return;
          }

          var changelog = '### ' + currentVersion + ' — *' + formatDate(new Date()) + '*\n';

          changelog += '\n' + stdout + '\n\n';
          try {
            if (fs.statSync(path.join(options.currentPath, options.changelogFile)).isFile()) {
              changelog += fs.readFileSync(path.join(options.currentPath, options.changelogFile), 'utf8');;
            }
          } catch (err) {}

          // Write contents to `History.md` file again
          fs.writeFileSync(options.changelogFile, changelog, 'utf8');

          callback();
        });
      }
    );
  };
  
  this.updateAuthorsFile = function(callback) {
    exec('git log --all --format="- %aN <%aE>" | sort -u', function(err, stdout, stderr) {
      if (err) {
        callback(new Error('Error while getting the git contributors: ' + err));
        return;
      }
      fs.writeFileSync(path.join(options.currentPath, options.authorsFile), stdout, 'utf8');
      callback();
    });
  };

  this.createExamples = function(callback) {
    var doccoExec = path.join(libPath, 'node_modules', 'docco', 'bin', 'docco');
    var examplePaths = options.examplePaths.join(' ');
  
    exec(doccoExec + ' ' + examplePaths, function(err, stdout, stderr) {
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
      options.currentPath, options.siteIndexPath), 'utf8'
    );
    
    var pattern = /\{\{\s*([A-Za-z0-9\.\-\_]*)\s*\}\}/gm;
    
    html = html.replace(pattern, function(fullMatch, match) {
      return markdown(
        fs.readFileSync(path.join(options.currentPath, match), 'utf8')
      ).toString();
    });

    // Write the result into docs/index.html
    fs.writeFileSync(path.join(options.currentPath, 'docs', 'index.html'), html, 'utf8');

    // Copy all the assets to docs/ folder
    exec('cp -r ' + options.siteAssetsPaths.join(' ') + ' docs', function(err, stdout, stderr) {
      if (err) {
        callback(new Error('Error while copying the assets to docs/ folder: ' + err));
        return;
      }
      callback();
    });
  };

  this.commitToGit = function(callback) {  
    var version = getCurrentVersion();
    
    Step(
      function() {
        exec('git add package.json ' + options.authorsFile + ' ' + options.changelogFile + ' docs/*', this);
      },
      function() {
        exec('git commit -a -m "Bump version to ' + version + '"', this);
      },
      function(err, stdout, stderr) {
        if (err) throw err;
        exec('git tag ' + version, callback);
      }
    );
  };

  this.updatePagesBranch = function(callback) {
    var currentBranch;
    
    Step(
      function() {
        getCurrentBranch(this);
      },
      function(err, branch) {
        if (err) throw err;
        currentBranch = branch;
        exec('git branch | grep gh-pages | wc -l', this);
      },
      function(err, stdout, stderr) {
        if (err) throw err;
        if (parseInt(stdout, 10) !== 1) {
          createPagesBranch(this);
        } else {
          exec('git checkout gh-pages', this);
        }
      },
      function(err, stdout, stderr) {
        if (err) throw err;
        exec('git merge -s recursive -Xsubtree ' + currentBranch, this);
      },
      function(err, stdout, stderr) {
        if (err) throw err;
        exec('git checkout ' + currentBranch, callback);
      }
    );
  };

  this.pushToGit = function(callback) {
    Step(
      function(){
        getCurrentBranch(this);
      },
      function(err, currenBranch){
        exec('git push origin ' + currenBranch + ' gh-pages --tags', callback);
      }
    );
  };

  this.npmPublish = function(callback) {
    exec('npm publish', callback);  
  };
  
  this.updateVersionInPackageJson = function(releaseType, callback) {
    var self = this;
    Step(
      function() {
        self.isWorkingCopyClean(this);
      }, 
      function(err, isClean) {
        if (err) throw err;
        if (!isClean) {
          callback(new Error('There are local changes in your git repository, please commit them'));
          return;
        }
       
        var jsonData = JSON.parse(
          fs.readFileSync(path.join(options.currentPath, "package.json"), 'utf8')
        );
        var oldVersion = jsonData.version;
        
        var version = semver.inc(oldVersion, releaseType);
        if (version === null) {
          fail('Invalid release type. Possible values are: major, minor, patch or build');
          return;
        }

        jsonData.version = version;
        fs.writeFileSync(
          path.join(options.currentPath, "package.json"),
          JSON.stringify(jsonData, null, 2), 
          'utf8'
        );
        callback(null, oldVersion, version);
      }
    );
  };
  
  return this;
}();
