(function() {
  /*
  Test Setup
  */  var Init, Instagram, app, assert, completed, http_client, should, test, to_do, url;
  console.log("\nInstagram API Node.js Lib Tests :: OAuth");
  Init = require('./initialize');
  Instagram = Init.Instagram;
  app = Init.app;
  assert = require('assert');
  should = require('should');
  test = require('./helpers');
  http_client = require('http');
  url = require('url');
  completed = 0;
  to_do = 0;
  /*
  Tests
  */
  module.exports = {
    'oauth#roundtrip': function() {
      var options, request, result;
      console.log("\noauth#roundtrip");
      result = Instagram.oauth.authorization_url({
        scope: 'comments likes',
        display: 'touch'
      });
      result.should.match(/\/oauth\/authorize\//);
      result.should.match(/client_id\=/);
      result.should.match(/redirect_uri\=/);
      result.should.match(/response_type\=code/);
      result.should.not.match(/client_id\=CLIENT\-ID/);
      result.should.not.match(/redirect_uri\=REDIRECT_URI/);
      test.output("result matched authorization url", result);
      result = url.parse(result);
      options = {
        host: process.env['TEST_HOST'] != null ? process.env['TEST_HOST'] : result.hostname,
        port: process.env['TEST_PORT'] != null ? process.env['TEST_PORT'] : result.port,
        method: "GET",
        path: "/fake" + result['pathname'] + result['search']
      };
      request = http_client.request(options, function(response) {
        var token_options, token_request, token_uri;
        response.should.have.property('statusCode', 302);
        response.should.have.property('headers');
        response.headers.should.have.property('location');
        test.output("response met redirect criteria", response.headers.location);
        token_uri = url.parse(response.headers.location);
        token_options = {
          host: token_uri['hostname'],
          port: typeof token_uri['port'] !== 'undefined' ? token_uri['port'] : null,
          method: "GET",
          path: "" + token_uri['pathname'] + token_uri['search']
        };
        token_request = http_client.request(token_options, function(token_response) {
          var data;
          data = '';
          token_response.on('data', function(chunk) {
            return data += chunk;
          });
          return token_response.on('end', function() {
            test.output("final receipt", data);
            return app.finish_test();
          });
        });
        token_request.addListener('error', function(connectionException) {
          if (connectionException.code !== 'ENOTCONN') {
            console.log("\n" + connectionException);
            throw connectionException;
            return app.finish_test();
          }
        });
        return token_request.end();
      });
      request.addListener('error', function(connectionException) {
        if (connectionException.code !== 'ENOTCONN') {
          console.log("\n" + connectionException);
          throw connectionException;
          return app.finish_test();
        }
      });
      return request.end();
    }
  };
  app.start_tests(module.exports);
}).call(this);
