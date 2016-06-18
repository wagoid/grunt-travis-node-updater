module.exports = function(grunt) {
	require('./tasks/travisNodeUpdater.js')(grunt);

	grunt.initConfig({
		updatetravis: {
			all: ['Gruntfile.js', 'tasks/**/*.js']
		}
	});

};