'use strict';

var dbm;
var type;
var seed;
var fs = require('fs');
var path = require('path');

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  var filePath = path.join(__dirname, 'sql', '20260709041617-estructura-inicial-up.sql');
  return db.runSql(fs.readFileSync(filePath, 'utf8'));
};

exports.down = function(db) {
  var filePath = path.join(__dirname, 'sql', '20260709041617-estructura-inicial-down.sql');
  return db.runSql(fs.readFileSync(filePath, 'utf8'));
};

exports._meta = {
  "version": 1
};