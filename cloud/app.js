var express = require('express');
var moment = require('moment');
var _ = require('underscore');


    ejs = require('ejs'),
//parseExpressHttpsRedirect = require('parse-express-https-redirect'),
    parseExpressCookieSession = require('parse-express-cookie-session'),
    _ = require('underscore');
 
var playerController = require('cloud/controllers/player.js');
var clubController = require('cloud/controllers/club.js');  
var pageGenerator = require('cloud/controllers/pageGenerator');
var admin = require('cloud/controllers/admin');
var parseAll = require('cloud/controllers/parseAll');
var app = express();
 
 
app.set('views', 'cloud/views');
app.set('view engine', 'ejs');  // Switch to Jade by replacing ejs with jade here.
app.use(express.bodyParser());
//app.use(parseExpressHttpsRedirect());
app.use(express.methodOverride());
app.use(express.cookieParser('SECRET_SIGNING_KEY'));
app.use(parseExpressCookieSession({
    fetchUser: true,
    key: 'image.sess',
    cookie: {
        maxAge: 3600000 * 24 * 30
    }
}));
 
app.locals._ = _;


app.get('/admin/updatetimetable', admin.updateTimetable);
app.get('/', pageGenerator.renderPage);
app.get('/player', playerController.index);
app.get('/club/:clubId', clubController.show);
 
app.listen();