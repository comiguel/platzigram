var page = require('page');
var empty = require('empty-element');
var template = require('./template');
var title = require('title');
var request = require('superagent');
var header = require('../header');
var axios = require('axios');
var Webcam = require('webcamjs');
var picture = require('../picture-card');

page('/', header, loading, asyncLoad, function (ctx, next) {
  title('Platzigram');
  var main = document.getElementById('main-container');

  empty(main).appendChild(template(ctx.pictures));

  const picturePreview = $('#picture-preview');
  const camaraInput = $('#camara-input');
  const cancelPicture = $('#cancel-picture');
  const shootButton = $('#shoot');
  const uploadButton = $('#uploadButton');

  function reset(){
    picturePreview.addClass('hide');
    cancelPicture.addClass('hide');
    uploadButton.addClass('hide');
    shootButton.removeClass('hide');
    camaraInput.removeClass('hide');
  }

  cancelPicture.click(reset);

  $('.modal-trigger').leanModal({
    ready: function(){
      // Webcam.set({ width: 320, height: 240 });
      Webcam.attach('#camara-input');
      shootButton.click(ev => {
        Webcam.snap(data_uri => {
          picturePreview.html(`<img src="${data_uri}"/>`);
          picturePreview.removeClass('hide');
          cancelPicture.removeClass('hide');
          uploadButton.removeClass('hide');
          shootButton.addClass('hide');
          camaraInput.addClass('hide');
          uploadButton.off('click');
          uploadButton.click(() => {
            const pic = {
              url: data_uri,
              likes: 0,
              liked: false,
              createdAt: +new Date(),
              user: {
                username: 'comiguel0812',
                avatar: 'https://scontent.fgig1-4.fna.fbcdn.net/v/t1.0-1/c42.42.528.528/s160x160/1234142_10151869965756095_1675162330_n.jpg?oh=5458f8d2ee5f0aa83e4ba0eb57379258&oe=58345EDF'
              }
            }
            $('#picture-cards').prepend(picture(pic));
            reset();
            $('#modalCamara').closeModal();
          });
        });
      });
    },
    complete: function(){
      Webcam.reset();
      reset();
    }
  });
});

  function loading(ctx, next){
    var el = document.createElement('div');
    el.classList.add('loader');
    document.getElementById('main-container').appendChild(el);
    next();
  }

function loadPictures(ctx, next) {
  request
    .get('/api/pictures')
    .end(function(err, res){
      if (err) return console.log(err);

      ctx.pictures = res.body;
      next();
    });
}

function loadPicturesAxios(ctx, next) {
  axios
    .get('/api/pictures')
    .then(function(res){
      ctx.pictures = res.data;
      next();
    })
    .catch(function(err){
      console.log(err)
    });
}

function loadPicturesFetch(ctx, next) {
  fetch('/api/pictures')
    .then(function (res){
      return res.json();
    })
    .then(function (pictures){
      ctx.pictures = pictures;
      next();
    })
    .catch(function(err){
      console.log(err)
    });
}

async function asyncLoad(ctx, next){
  try {
    ctx.pictures = await fetch('/api/pictures').then(res => res.json());
    next();
  } catch (err) {
    return console.log(err);
  }
}