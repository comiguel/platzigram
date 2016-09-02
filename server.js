var express = require('express');
var aws = require('aws-sdk');
var multer = require('multer');
var multerS3 = require('multer-s3');
var ext = require('file-extension');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var passport = require('passport');
var platzigram = require('platzigram-client');
var auth = require('./auth');
var config = require('./config');
var port = process.env.PORT || 5050;
var s3 = new aws.S3({
  accessKeyId: config.aws.accessKey,
  secretAccessKey: config.aws.secretKey
})

var client = platzigram.createClient(config.client);

var storage = multerS3({
  s3: s3,
  bucket: 'platzigram-comiguel',
  acl: 'public-read',
  metadata: function(req, file, cb) {
    cb(null, {fieldName: file.fieldname})
  },
  key: function(req, file, cb) {
    cb(null, +Date.now() + '.' + ext(file.originalname));
  }
})

// var storage = multer.diskStorage({
//   destination: function(req, file, cb){
//     cb(null, './uploads');
//   },
//   filename: function(req, file, cb){
//     cb(null, +Date.now() + '.' + ext(file.originalname));
//   }
// });
var upload = multer({ storage: storage }).single('picture');

var app = express();

app.use(express.static('public'));
app.set(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressSession({
  secret: config.secret,
  resave: false,
  saveUnitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'pug');

passport.use(auth.localStrategy);
passport.use(auth.facebookStrategy);
passport.deserializeUser(auth.deserializeUser);
passport.serializeUser(auth.serializeUser);

app.get('/', function(req, res){
	res.render('index', { 'title': 'Platzigram' });
});

app.get('/signup', function(req, res){
  res.render('index', { 'title': 'Platzigram - Signup' });
});

app.post('/signup', function (req, res) {
  var user = req.body;
  client.saveUser(user, function (err, usr) {
    if (err) return res.status(500).send(err.message);

    res.redirect('/signin')
  })
});

app.get('/signin', function(req, res){
  res.render('index', { 'title': 'Platzigram - Signin' });
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/signin'
}));

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email'}));

app.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: '/',
  failureRedirect: '/signin'
}))

function ensureAuth (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).send({ error: 'not authenticated'});
}

app.get('/whoami', function (req, res) {
  if (req.isAuthenticated()) {
    return res.json(req.user);
  }

  res.json({ auth: false });
})

app.get('/api/pictures', function(req, res){
  client.listPictures(function (err, pictures) {
    if (err) return res.send([]);

    res.send(pictures);
  })
});

app.post('/api/pictures', ensureAuth, function (req, res){
  upload(req, res, function(err){
    if (err) {
      return res.send(500, `Error uploading file: ${err.message}`);
    }

    var user = req.user;
    var token = user.token;
    var username = user.username;
    var src = req.file.location;

    client.savePicture({
      src: src,
      userId: username,
      user: {
        username: username,
        avatar: user.avatar,
        name: user.name
      }
    }, token, function (err, img) {
      if (err) return res.status(500).send(err.message);
      res.send(`File uploaded ${src}`);
    })
  })
});

app.get('/api/user/:username', function(req, res){
  var username = req.params.username;

  client.getUser(username, function (err, user) {
    if (err) return res.status(404).send({ error: 'user not found' });
    
    res.send(user);
  })
});

app.get('/:username', function (req, res){
  res.render('index', {title: `Platzigram - ${req.params.username}`});
});

app.get('/:username/:id', function (req, res){
  res.render('index', {title: `Platzigram - ${req.params.username}`});
});

app.listen(port, function(err){
	if(err) return console.log('Hubo un error'), process.exit(1);

	console.log(`Platzigram escuchando en el puerto ${port}`);
});