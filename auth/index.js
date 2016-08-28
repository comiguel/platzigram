var LocalStrategy = require('passport-local').Strategy;
var platzigram = require('platzigram-client');
var config = require('../config');

var client = platzigram.createClient(config.client);

exports.localStrategy = new LocalStrategy((username, password, done) => {
  client.auth(username, password, (err, token) => {
    // console.log('token:');
    // console.log(token);
    // console.log('error:');
    // console.log(err);
    if (err) {
      return done(null, false, { message: 'username and password not found' });
    }

    client.getUser(username, (err, user) => {
      // console.log('user:');
      // console.log(user);
      // console.log('error 2222:');
      // console.log(err);
      if (err) {
        return done(null, false, { message: `an error ocurred: ${err.message}` });
      }

      user.token = token;
      // console.log('después de asignado token:');
      // console.log(user);
      return done(null, user);
    });
  });
});

exports.serializeUser = function (user, done) {
  console.log("Serializandooo!!");
  done(null, {
    username: user.username,
    token: user.token
  });
};

exports.deserializeUser = function (user, done) {
  console.log("Desserializandooo!!");
  client.getUser(user.username, (err, usr) => {
    if (err) return done(err);

    usr.token = user.token;
    done(null, usr);
  });
};
