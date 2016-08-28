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
var port = process.env.PORT || 3000;
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
app.use(express.static('public'));

passport.use(auth.localStrategy);
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

function ensureAuth (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).send({ error: 'not authenticated'});
}

app.get('/api/pictures', function(req, res){
  var pictures = [
    {
      user: {
        username: 'comiguel0812',
        avatar: 'https://scontent.fgig1-4.fna.fbcdn.net/v/t1.0-1/c42.42.528.528/s160x160/1234142_10151869965756095_1675162330_n.jpg?oh=5458f8d2ee5f0aa83e4ba0eb57379258&oe=58345EDF'
      },
      url: 'office.jpg',
      likes: 0,
      liked: false,
      createdAt: new Date().getTime()
    },
    {
      user: {
        username: 'comiguel0812',
        avatar: 'https://scontent.fgig1-4.fna.fbcdn.net/v/t1.0-1/c42.42.528.528/s160x160/1234142_10151869965756095_1675162330_n.jpg?oh=5458f8d2ee5f0aa83e4ba0eb57379258&oe=58345EDF'
      },
      url: 'office.jpg',
      likes: 1,
      liked: true,
      createdAt: new Date().setDate(new Date().getDate() - 10)
    },
  ];

  setTimeout(() => res.send(pictures), 2000);
});

app.post('/api/pictures', ensureAuth, function (req, res){
  upload(req, res, function(err){
    if (err) {
      return res.send(500, 'Error uploading file');
    }
    res.send('File uploaded');
  })
});

app.get('/api/user/:username', function(req, res){
  const user = {
    username: 'comiguel0812',
    avatar: 'https://scontent.fgig1-4.fna.fbcdn.net/v/t1.0-1/c42.42.528.528/s160x160/1234142_10151869965756095_1675162330_n.jpg?oh=5458f8d2ee5f0aa83e4ba0eb57379258&oe=58345EDF',
    pictures: [
      {
        id: 1,
        src: 'https://scontent-mia1-1.xx.fbcdn.net/v/t1.0-9/10665843_10152793390586095_4066738513453243560_n.jpg?oh=c94bfbb25f20932d2eab36051d494b59&oe=58214136',
        likes: 1
      },
      {
        id: 2,
        src: 'https://scontent-mia1-1.xx.fbcdn.net/v/t1.0-9/1424423_10152130734911095_514727589_n.jpg?oh=52121a6ca2e33262b34824ce7b042197&oe=5815BEE7',
        likes: 4
      },
      {
        id: 3,
        src: 'https://scontent-mia1-1.xx.fbcdn.net/v/t1.0-9/1526486_10152166140586095_85779509_n.jpg?oh=fe6f07aa15bd7031c1457223fd71749e&oe=58170EB6',
        likes: 7
      },
      {
        id: 4,
        src: 'https://scontent-mia1-1.xx.fbcdn.net/v/t1.0-9/10500494_10152586052681095_5321006374099172056_n.jpg?oh=85243d18c1c6a2d202dda14d4b59027a&oe=582E624C',
        likes: 10
      },
      {
        id: 5,
        src: 'https://scontent-mia1-1.xx.fbcdn.net/v/t1.0-9/10660331_10152791348426095_5231639662865431928_n.jpg?oh=03a382ad783d3fa1c66fcb596cf34fc7&oe=5825239E',
        likes: 13
      },
      {
        id: 6,
        src: 'https://scontent-mia1-1.xx.fbcdn.net/v/t1.0-9/10392469_10152996295131095_6200105824557244141_n.jpg?oh=8b8b8672ff90b2e406fb37fb9698df6b&oe=5817D611',
        likes: 50
      }
    ]
  };
  res.send(user);
});

app.get('/:username', function (req, res){
  res.render('index', {title: `Platzigram - ${req.params.username}`});
});

app.get('/:username/:id', function (req, res){
  res.render('index', {title: `Platzigram - ${req.params.username}`});
});

app.listen(port, function(err){
	if(err) return console.log('Hubo un error'), process.exit(1);

	console.log('Platzigram escuchando en el puerto 3000');
});