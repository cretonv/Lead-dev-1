// Imports the Google Cloud client library
const {PubSub} = require('@google-cloud/pubsub');

// Instantiates a client
const pubsub = new PubSub({projectId: 'leadtechnique2022'});

const getTopic = async () => {
    const topic = await pubsub.topic('dmii2-3');
    return topic
}

const getSubscription = async () => {
    const topic = await getTopic()

    const subscription = await topic.subscription('dmii2-3');

    return subscription
}

const publishMessage = async (message) => {
    const topic = await getTopic()

    topic.publish(Buffer.from(message));
}

module.exports = {
    getTopic,
    getSubscription,
    publishMessage
}
