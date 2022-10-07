const formValidator = require('./form_validator');
const photoModel = require('./photo_model');
const pubSub = require('./pubsub')
const { Storage } = require("@google-cloud/storage");

const fileNameDb = require("./fileNameDb");
const storage = new Storage()

function route(app) {
  app.get('/', async (req, res) => {
    const tags = req.query.tags;
    const tagmode = req.query.tagmode;

    const ejsLocalVariables = {
      tagsParameter: tags || '',
      tagmodeParameter: tagmode || '',
      photos: [],
      searchResults: false,
      invalidParameters: false
    };

    // if no input params are passed in then render the view with out querying the api
    if (!tags && !tagmode) {
      return res.render('index', ejsLocalVariables);
    }

    // validate query parameters
    if (!formValidator.hasValidFlickrAPIParams(tags, tagmode)) {
      ejsLocalVariables.invalidParameters = true;
      return res.render('index', ejsLocalVariables);
    }

    console.log(fileNameDb)
    ejsLocalVariables.zipUrl = ''
    if (fileNameDb[tags]) {
      const options = {
        action: 'read',
        expires: +Date.now() + (2*24*3600*1000)
      };
      const signedUrls = await storage
          .bucket('dmii2022bucket')
          .file(fileNameDb[tags])
          .getSignedUrl(options);
      console.log(signedUrls)
      ejsLocalVariables.zipUrl = signedUrls
    }
    // get photos from flickr public feed api
    return photoModel
        .getFlickrPhotos(tags, tagmode)
        .then(photos => {
          ejsLocalVariables.photos = photos;
          ejsLocalVariables.searchResults = true;
          return res.render('index', ejsLocalVariables);
        })
        .catch(error => {
          return res.status(500).send({ error });
        });
  });

  app.get('/zip', async (req, res) => {
    const tags = req.query.tags;

    pubSub.publishMessage(tags)

    res.end('Zip demandé')
  })
}

module.exports = route;
