var express = require('express'),
    ejs = require('ejs'),
//parseExpressHttpsRedirect = require('parse-express-https-redirect'),
    parseExpressCookieSession = require('parse-express-cookie-session'),
    _ = require('underscore');
 
 
var pageGenerator = require('cloud/controllers/pageGenerator');
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
 
app.get('/', pageGenerator.renderPage);
 
 
app.listen();