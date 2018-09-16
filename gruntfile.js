module.exports = function(grunt) {
    "use strict";
  
    grunt.initConfig({
      tslint: {
        options: {
          configuration: "tslint.json"
        },
        files: {
          src: ["src/\*\*/\*.ts"]
        }
      },
    });
  
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-tslint");
  
    grunt.registerTask("default", [
      "tslint"
    ]);
  
  };