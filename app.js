var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var logger = require('morgan');
const webpush = require('web-push');

var indexRouter = require('./routes/index');

const vapidKeys = {
    publicKey: fs.readFileSync("./server.pub").toString(),
    privateKey: fs.readFileSync('./server.priv').toString()
};

webpush.setVapidDetails(
    'mailto:web-push-book@gauntface.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);
var app = express();

app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

module.exports = app;
