var express = require('express');
var moment = require('moment');
var _ = require('underscore');


var ejs = require('ejs');
//parseExpressHttpsRedirect = require('parse-express-https-redirect'),
var parseExpressCookieSession = require('parse-express-cookie-session');
 
var playerController = require('cloud/controllers/player.js');
var clubController = require('cloud/controllers/club.js');  
var pageGenerator = require('cloud/controllers/pageGenerator');
var admin = require('cloud/controllers/admin');
var calendar = require('cloud/controllers/calendar');
var jobs = require('cloud/controllers/job_tasks');
var parseAll = require('cloud/controllers/parseAll');
var preloaders = require('cloud/controllers/preloaders');
var turnirs = require('cloud/controllers/turnirs');
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


app.get('/admin/updatetimetable', calendar.createCalendar);
app.post('/admin/getcalendarentry', calendar.getCalendarEntryWithDate);

app.get('/admin/updatematches', turnirs.updateMatches);
app.get('/initturnirs', preloaders.initTurnirs);
app.get('/initclubs', preloaders.initClubs);
app.post('/admin/uploadallfile', admin.uploadAllFile);
app.get('/', pageGenerator.renderPage);
app.get('/player', playerController.index);
app.get('/player/:playerId', playerController.show);
app.get('/club/:clubId', clubController.show);
app.get('/admin', admin.index);
//app.get('/admin/calendar', calendar.createCalendar);
//app.get('/admin/migratecalendar', calendar.migrateCalendar);

 
app.listen();