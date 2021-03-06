/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/
var fs = require('fs');
const url = require('url');
var data = {messages: [], currentMessageId: 0};
var defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10 // Seconds.
};

var saveMessage = function(message, response) {
  fs.readFile(('./server/db.db'), function(err, fileBuffer) {
    if(err) {
      throw err;
    } else {
      var database = JSON.parse(fileBuffer.toString());
      database.currentMessageId++;
      message.objectId = database.currentMessageId;
      database.messages.push(message);
      fs.writeFile(('./server/db.db'), JSON.stringify(database), function(err) {
        response.end(JSON.stringify(database.messages)); 
      });
    }
  });
};
var loadMessages = function(response) {
  fs.readFile(('./server/db.db'), function(err, fileBuffer) {
    if (err) {
      fs.writeFile('./server/db.db', JSON.stringify(data), function(err) {
        response.end(JSON.stringify(data.messages));
      });
    } else {
      var messages = {results: JSON.parse(fileBuffer.toString()).messages};
      response.end(JSON.stringify(messages));
    }
  });
};

var requestHandler = function(request, response) {
  // Request and Response come from node's http module.
  //
  // They include information about both the incoming request, such as
  // headers and URL, and about the outgoing response, such as its status
  // and content.
  //
  // Documentation for both request and response can be found in the HTTP section at
  // http://nodejs.org/documentation/api/

  // Do some basic logging.
  //
  // Adding more logging to your server can be an easy way to get passive
  // debugging help, but you should always be careful about leaving stray
  // console.logs in your code.
  console.log('Serving request type ' + request.method + ' for url ' + request.url);
  // The outgoing status.

  // See the note below about CORS headers.
  var headers = defaultCorsHeaders;

  var send404 = function(errorMessage) {
    var statusCode = 404;
    headers['Content-Type'] = 'text/html';
    response.writeHead(statusCode, headers);
    response.end(errorMessage);
  };

  if (request.method === 'GET' && (request.url === '/' || request.url.startsWith('/?username'))) {
    fs.readFile(('./client/client/index.html'), function(err, data) {
      if (err) {
        send404('Error reading index.html!');
      } else {
        var statusCode = 200;
        headers['Content-Type'] = 'text/html';
        response.writeHead(statusCode, headers);
        response.end(data);
      }
    });
  } else if (request.method === 'GET' && (request.url.endsWith('.html') || request.url.endsWith('.css') || request.url.endsWith('.js') || request.url.endsWith('.gif'))) {
    fs.readFile(('./client/client' + request.url), function(err, data) {
      if (err) {
        send404('File does not exist!');
      } else {
        if (request.url.endsWith('.css')) {
          headers['Content-Type'] = 'text/css';
        } else {
          headers['Content-Type'] = 'text';
        }
        var statusCode = 200;
        response.writeHead(statusCode, headers);
        response.end(data);
      }
    });
  } else if (request.method === 'GET' && request.url === '/classes/messages') {
    var statusCode = 200;
    headers['Content-Type'] = 'application/json';
    response.writeHead(statusCode, headers);
    loadMessages(response);
  } else if (request.method === 'OPTIONS' && request.url === '/?order=-createdAt') {
    var statusCode = 200;
    response.writeHead(statusCode, headers);
    response.end();
  } else if (request.method === 'GET' && request.url === '/?order=-createdAt') {
    var statusCode = 200;
    headers['Content-Type'] = 'application/json';
    response.writeHead(statusCode, headers);
    loadMessages(response);
  } else if (request.method === 'POST') {
    var statusCode = 201;
    //console.log(JSON.stringify(request._postData));
    request.on('data', (data) => {
      var message = JSON.parse(data);
      saveMessage(message, response);
    });
    headers['Content-Type'] = 'application/json';
    response.writeHead(statusCode, headers);
    loadMessages(response);
  } else {
    send404('Resource could not be located!');
  }

  // Make sure to always call response.end() - Node may not send
  // anything back to the client until you do. The string you pass to
  // response.end() will be the body of the response - i.e. what shows
  // up in the browser.
  //
  // Calling .end "flushes" the response's internal buffer, forcing
  // node to actually send all the data over to the client.
};

// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.

module.exports = {
  requestHandler: requestHandler,
  defaultCorsHeaders: defaultCorsHeaders
};

