# grunt-travis-node-updater
Grunt task to update your Node.js target versions in .travis.yml


## Installation

1. First, install it:
`npm install --save-dev grunt-travis-node-updater`
2. Then, load it in your GruntFile.js: `grunt.loadNpmTasks('grunt-travis-node-updater');`

## Usage

Set your configuration for the plugin. Example usage:

```javascript
grunt.initConfig({
  updatetravis: {
    options: {
      version: '>=0.10.0',
      travisFilePath: './.travis.yml',
      replacePreviousVersions: true,
      numberOfVersionsPerMajorNumber: 3
    }
  }
});

```

And then just run it! `grunt updatetravis`

## Options

1. version: any semver expression (we use the same semver matcher npm uses). You can put the word 'latest' anywhere and we will replace it by the last available Node.js version. Default is 'latest'.
2. travisFilePath: the path to your .travis.yml file. Default is './.travis.yml'.
3. nodeVersionsUrl: url from which we will search the json containing the node versions. Default is 'https://nodejs.org/dist/index.json'.
4. numberOfVersionsPerMajorNumber: specify the maximum number of the same major version you will have in your travis configuration file. This helps if you want, for instance, any version that is above of 0.10.0, but you dont want all of 0.x versions, and dont want all of 4.x versions. So you just put the version '>=0.10.0' and numberOfVersionsPerMajorNumber to 3 (instead of a complex version expression), and you will have 3 versions of each major version Node.js publishes. Default is 2.
5. replacePreviousVersions: sets if you want to replace the previous node_js versions you had in your travis configuration file. We don't duplicate versions, but you may want to always replace the previous versions before adding new ones. Default is false.