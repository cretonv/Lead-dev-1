const { getSubscription } = require("./pubsub");
const photoModel = require("./photo_model");

const request = require('request');
const ZipStream = require('zip-stream');
const { Storage } = require('@google-cloud/storage');
const fileNameDb = require("./fileNameDb");

const makeId = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

const createZip = async (tags) => {
    const filename = `public/users/${makeId(6)}.zip`

    let storage = new Storage();
    const file = await storage
        .bucket('dmii2022bucket')
        .file(filename);
    const stream = file.createWriteStream({
        metadata: {
            contentType: 'application/zip',
            cacheControl: 'private'
        },
        resumable: false
    });


    const zip = new ZipStream()
    zip.pipe(stream)

    function addNextFile(queue) {
        const elem = queue.shift()
        const stream = request(elem.media.b)
        zip.entry(stream, { name: elem.title + '.jpg' }, err => {
            if(err)
                throw err;
            if(queue.length > 0)
                addNextFile(queue)
            else
                zip.finalize()
        })
    }

    photoModel
        .getFlickrPhotos(tags, 'all')
        .then(photos => addNextFile(photos.slice(0, 10)))

    return new Promise ((resolve, reject) => {
        stream.on('error', (err) => {
            reject(err);
        });
        stream.on('finish', () => {
            resolve(filename);
        });
    });
}

module.exports = async function main() {
    const subscription = await getSubscription()

    let messageCount = 0;
    const messageHandler = async message => {

        messageCount += 1;

        const filename = await createZip(message.data.toString())

        console.log('name', message.data.toString())

        fileNameDb[message.data.toString()] = filename
        console.log('zip ok')

        message.ack();
    };

    subscription.on('message', messageHandler);
}
