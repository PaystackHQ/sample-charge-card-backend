// Load Environment variables
require('dotenv').load();

// paystack module is required to make charge token call
var paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);

// uuid module is required to create a random reference number
var uuid     = require('node-uuid');

var express =  require('express');
var app = require('express')();
var bodyParser = require('body-parser');

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
    extended: true
}));

app.get('/', function(req, res) {
res.send('<body><head><link href="favicon.ico" rel="shortcut icon" />\
    </head><body><h1>Awesome!</h1><p>Your server is set up. \
    Go ahead and configure your Paystack sample apps to make calls to: \
    <ul><li> <a href="#">https://'+req.headers.host+'</a></li></ul> \
    </p></body></html>');
});

app.get('/new-access-code', function(req, res) {
    var customerid = req.params.customerid;
    var cartid     = req.params.cartid;
    // you can then look up customer and cart details in a db etc
    // I'm hardcoding an email here for simplicity
    amountinkobo = process.env.TEST_AMOUNT * 100;
    if(isNaN(amountinkobo) || (amountinkobo < 2500)){
        amountinkobo = 2500;
    }
    email = process.env.SAMPLE_EMAIL;

    // all fields supported by this call can be gleaned from
    // https://developers.paystack.co/reference#initialize-a-transaction
    paystack.transaction.initialize({
        email:     email,        // a valid email address
        amount:    amountinkobo, // only kobo and must be integer
        metadata:  {
            custom_fields:[
                {
                    "display_name":"Started From",
                    "variable_name":"started_from",
                    "value":"sample charge card backend"
                },
                {
                    "display_name":"Requested by",
                    "variable_name":"requested_by",
                    "value": req.headers['user-agent']
                },
                {
                    "display_name":"Server",
                    "variable_name":"server",
                    "value": req.headers.host
                }
            ]
        }
    },function(error, body) {
        if(error){
            res.send({error:error});
            return;
        }
        res.send(body.data.access_code);
    });
});

app.get('/verify/:reference', function(req, res) {
    var reference = req.params.reference;

    paystack.transaction.verify(reference,
        function(error, body) {
        if(error){
            res.send({error:error});
            return;
        }
        if(body.data.success){
            // save authorization
            var auth = body.authorization;
        }
        res.send(body.data.gateway_response);
    });
});

//The 404 Route (ALWAYS Keep this as the last route)
app.get('/*', function(req, res){
    res.status(404).send('Only GET /new-access-code \
        or GET /verify/{reference} is allowed');
});

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'))
})
