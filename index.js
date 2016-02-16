// Load Environment variables
require('dotenv').load();

// we are using http for this sample server
var http     = require('http');
// querystring module is required to parse post data
var qs       = require('querystring');
// paystack module is required to make charge token call
var paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
// uuid module is required to create a random reference number
var uuid     = require('node-uuid');
// filestream to read favicon
var fs   = require('fs');

var port = process.env.PORT || 5000;

http.createServer(function (req, res){
  
  if((req.method == 'GET') && (req.url==='/favicon.ico')){
    res.writeHead(200, { 'Content-Type': 'image/x-icon' });
    fs.readFile('./favicon.ico',function(err,data){
        res.end(data);
    });

  } else if((req.method == 'GET') && (req.url==='/')){
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<body><head><link href="favicon.ico" rel="shortcut icon" /></head><body><h1>Awesome!</h1><p>Your server is set up. Go ahead and configure your Paystack sample apps to post <b>[email, token, amountinkobo]</b> to <a href="#">http://'+req.headers.host+'/charge/.</a></p></body></html>');

  } else if ((req.method == 'POST') && (req.url==='/charge') || (req.url==='/charge/')) {
        var body = '';

        req.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6){
                req.connection.destroy();
            }
        });

        req.on('end', function () {
            var post = qs.parse(body);
            
            paystack.transaction.chargeToken({
              token: post.token, // token sent by mobile app
              email: post.email, // a valid email address
              amount: post.amountinkobo, // only kobo and must be integer
              reference: uuid.v1() //time-based uuid
            },function(error, body) {
               res.writeHead(200, { 'Content-Type': 'application/json' });
               res.end(JSON.stringify({error:error, body:body}));
            });
           
        });
        
  } else {
    // All other calls are invalid
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Only a post to /charge is allowed\n');
  }
}).listen(port, function(){
  console.log(`Server running at http://localhost:${port}/`);
});