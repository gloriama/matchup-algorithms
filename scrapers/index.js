var SURVEY_FILE_PATH = 'data/cleanedCSV';
var TAPOUT_FILE_PATH = 'data/tapoutCSV';

var surveyScraper = require('./surveyScraper');
var tapoutScraper = require('./tapoutScraper');

var surveyOutput = surveyScraper(SURVEY_FILE_PATH);
var finalOutput = tapoutScraper(surveyOutput, TAPOUT_FILE_PATH);

module.exports = finalOutput;