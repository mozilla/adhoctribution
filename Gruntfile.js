module.exports = function (grunt) {
  // Node and client side JS have slightly different JSHint directives
  // We'll create 2 versions with .jshintrc as a baseline
  var browserJSHint = grunt.file.readJSON('.jshintrc');
  var nodeJSHint = grunt.file.readJSON('.jshintrc');

  // Don't throw errors for expected Node globals
  nodeJSHint.node = true;

  // Don't throw errors for expected browser globals
  browserJSHint.browser = true;

  var clientSideJS = [
    'public/js/**/*.js',
    '!public/js/lib/**',
    '!public/js/vendor/**'
  ];

  var nodeJS = [
    'Gruntfile.js',
    'web.js',
    'lib/**/*.js',
    'routes/**/*.js',
    'test/**/*.js'
  ];

  var allJS = clientSideJS.concat(nodeJS);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jsbeautifier: {
      modify: {
        src: allJS,
        options: {
          config: '.jsbeautifyrc'
        }
      },
      verify: {
        src: allJS,
        options: {
          mode: 'VERIFY_ONLY',
          config: '.jsbeautifyrc'
        }
      }
    },
    jshint: {
      browser: {
        src: clientSideJS,
        options: browserJSHint
      },
      node: {
        src: nodeJS,
        options: nodeJSHint
      }
    }
  });

  grunt.loadNpmTasks('grunt-jsbeautifier');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Clean & verify code (Run before commit)
  grunt.registerTask('default', ['jsbeautifier:modify', 'jshint']);

  // Verify code (Read only)
  grunt.registerTask('validate', ['jsbeautifier:verify', 'jshint']);

};
