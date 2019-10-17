// common files
const config = require('./common/env.config'),
    express = require('express'),
    auth = require('./common/auth')
    logger = require('morgan'),
    movieRoutes = require('./routes/movies'),
    userRoutes = require('./routes/users'),
    bodyParser = require('body-parser'),
    mongoose = require('./common/database'),
    app = express();

// connection to mongodb
mongoose.connection.on('error', console.error.bind(console, 'Could not connect to the MongoDB...'));

// Log if development mode is true
if (config.development == true) {
    app.use(logger('dev'));
}

app.use(bodyParser.urlencoded({
    extended: false
}));


// Routing for users model
app.use('/users', userRoutes);

// Routing for movies model
app.use('/movies', auth.isAuthorized, movieRoutes);


app.get('/', function(req, res) {
    res.json({
        "tutorial": "Build REST API with node.js"
    });
});

// handle 404 error
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// handle errors
app.use(function(err, req, res, next) {
    console.log(err);

    if (err.status === 404)
        res.status(404).json({
            message: "Not found"
        });
    else
        res.status(500).json({
            message: "Something looks wrong :( !!!"
        });
});

app.listen(config.port, function() {
    console.log(`Node server listening on port ${config.port}`);
});