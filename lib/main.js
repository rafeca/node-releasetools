// Node Release Tools
// Created by Rafael de Oleza
// MIT License

// Module dependencies
var fs = require('fs');
var path = require('path');

// Include library
module.exports = require('./releasetools');

// Package version
module.exports.version = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
).version;