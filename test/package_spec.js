var releasetools = require('../lib/main');
var fs = require('fs');
var path = require('path');
var should = require('should');

describe('package test', function(){
  it('should read correctly the package version', function(){    
    // Get version from package.json
    var version = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version;
    releasetools.version.should.equal(version);
  });
});

