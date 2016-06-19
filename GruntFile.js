module.exports = function(grunt) {
	require('./tasks/travisNodeUpdater.js')(grunt);

	grunt.initConfig({
		updatetravis: {
			options: {
				version: '>=0.10.0',
				replacePreviousVersions: true,
				numberOfVersionPerMajorNumber: 3
			}
		}
	});

	grunt.registerTask('default', ['updatetravis']);
};