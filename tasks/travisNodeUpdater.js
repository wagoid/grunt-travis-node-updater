'use strict';

var fs = require('fs');
var yaml = require('yamljs');
var requestPromise = require('request-promise');
var bluebird = require('bluebird');
var _ = require('lodash');
var semver = require('semver');

var readFile = bluebird.promisify(fs.readFile);
var writeFile = bluebird.promisify(fs.writeFile);
var grunt;

var LATEST_VERSION = 'latest';
var TRAVIS_FILE_PATH = './.travis.yml';
var NODE_VERSIONS_URL = 'https://nodejs.org/dist/index.json';

module.exports = function (_grunt) {
	grunt = _grunt;
	grunt.registerTask('updatetravis', 'Updates your Node.js target versions in .travis.yml', function() {
		var done = this.async();
		var options = this.options({
			version: LATEST_VERSION,
			travisFilePath: TRAVIS_FILE_PATH,
			nodeVersionsUrl: NODE_VERSIONS_URL,
			numberOfVersionsPerMajorNumber: 2,
			replacePreviousVersions: false
		});
		options.done = done;

		fs.access(options.travisFilePath, fs.R_OK | fs.W_OK, function (err) {
			if (err) {
				grunt.fail.fatal('Error: no access to the travis file or it does not exist.');
			} else {
				executeTask(options);
			}
		});
	});
};

function executeTask(options) {
	bluebird.all([getTravisConfiguration(options), getNodeAvailableVersions(options)])
		.then(function (results) {
			var travisConfiguration = results[0];
			var nodeVersions = results[1];
			var matchingVersions = getMatchingVersions(nodeVersions, options);
			
			travisConfiguration.node_js = getNewNodeVersions(options, travisConfiguration.node_js || [], matchingVersions);
			return writeFile(options.travisFilePath, yaml.stringify(travisConfiguration, 2), 'utf8').then(options.done);
		})
		.catch(function (e) {
			grunt.fail.fatal('Error executing the travis updater task. Reason: ' + e, 3);
			options.done(false);
		});
}

function getTravisConfiguration(options) {
	return readFile(options.travisFilePath, 'utf8')
		.then(function (travisConfiguration) {
			return yaml.parse(travisConfiguration);
		});
}

function getNodeAvailableVersions(options) {
	return requestPromise({ uri: options.nodeVersionsUrl, json: true });
}

function getMatchingVersions(nodeVersions, options) {
	var versionMatch = getVersionMatch(options.version, nodeVersions);
	var matchingVersions = _.filter(nodeVersions, defaultVersionMatchingComparator(versionMatch));
	filterMaximumNumberOfVersionsPerMajorVersion(options, matchingVersions, nodeVersions);
	matchingVersions = matchingVersions.map(function (nodeVersion) {
		return semver.clean(nodeVersion.version);
	});

	return matchingVersions;
}

function getVersionMatch(versionOption, nodeVersions) {
	var versionMatch;
	if (_.isString(versionOption)) {
		versionMatch = {
			version: versionOption
		};
	} else if (_.isObject(versionOption) && !_.isArray(versionOption)) {
		versionMatch = versionOption;
	} else {
		throw new Error('Type of version should be a string or an object! Instead we got this: ' + versionOption);
	}

	versionMatch.version = versionMatch.version.replace(new RegExp(LATEST_VERSION, 'g'), semver.clean(nodeVersions[0].version));

	return versionMatch;
}

function defaultVersionMatchingComparator(versionMatch) {
	return function (nodeVersion) {
		return semver.satisfies(nodeVersion.version, versionMatch.version) && versionDateMatches(nodeVersion, versionMatch);
	};
}

function versionDateMatches(nodeVersion, versionMatch) {
	var dateMatches = true;

	if (versionMatch.minDate || versionMatch.maxDate) {
		var nodeVersionDate = new Date(nodeVersion.date).getTime();
		var minDate = new Date(versionMatch.minDate).getTime();
		var maxDate = new Date(versionMatch.maxDate).getTime();

		if (versionMatch.minDate && versionMatch.maxDate) {
			dateMatches = _.inRange(minDate -1, nodeVersionDate, maxDate + 1);
		} else if (versionMatch.minDate) {
			dateMatches = nodeVersion >= minDate;
		} else {
			dateMatches = nodeVersion <= maxDate;
		}
	}
	
	return dateMatches;
}

function filterMaximumNumberOfVersionsPerMajorVersion(options, matchingVersions, nodeVersions) {
	for (var i = 0; i < matchingVersions.length; i++) {
		var version = matchingVersions[i].version;
		var equalMajorVersionCount = matchingVersions.reduce(function (currentCount, currentVersion) {
			return currentCount + (semver.clean(currentVersion.version)[0] === semver.clean(version)[0]? 1 : 0);
		}, 0);
		if (equalMajorVersionCount > options.numberOfVersionsPerMajorNumber) {
			matchingVersions.splice(i, equalMajorVersionCount - options.numberOfVersionsPerMajorNumber);
		}
	}
}

function getNewNodeVersions(options, previousVersions, newVersions) {
	var versions = options.replacePreviousVersions? [] : previousVersions;

	_.forEach(newVersions, function (version) {
		if (!~versions.indexOf(version)) {
			versions.unshift(version);
		}
	});

	return versions;
}