# Node Release Tools

Node Release Tools is a simple NPM package which makes it really easy automate releases of your Node.js libraries

## Installation

Just install it via NPM:
    
    
    $ npm install releasetools
    

## Usage

The easiest way to use it is by requiring it in your build script. You can see an 
[example](http://rafeca.com/node-releasetools/Jakefile.html) of usage in this package
Jakefile file.

Additionally, it's possible to customize its behaviour by changing some parameters:


    var releaseTools = require('releasetools');

    releaseTools.setOptions({
      changelogFile: 'History.md',
      authorsFile: 'AUTHORS',
      baseBranch: 'master',
      siteIndexPath: 'site/index.html',
      siteAssetsPaths: [
        'site/javascripts',
        'site/stylesheets'
      ],
      examplePaths: [
        'examples/*'
      ]
    });
    


## Tests

You just have to checkout this package from GitHub, install development dependencies and execute the tests:

    
    $ git clone "https://github.com/rafeca/node-releasetools.git"
    $ npm install --dev
    $ npm test
