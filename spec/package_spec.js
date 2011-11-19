var package = require('../lib/main');
var fs = require('fs');
var path = require('path');

describe('package tests', function(){
  
  it('should read correctly the package version', function(){
    
    // Get version from package.json
    var version = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version;
    expect(package.version).toEqual(version);
  });
});

