const mongoose = require('mongoose');
const debug = require('debug')('model');

let uri = 'mongodb://localhost/social_APP';

if(process.env.NODE_ENV === 'production') {
  uri = process.env.MONGODB_URI;
}

mongoose.connect(uri, {useNewUrlParser: true,  useUnifiedTopology: true}).then(() => {
  console.log('connected to database')
}).catch(err => debug(err));


mongoose.connection.on('disconnected', () => {
  console.log('Disconnected');
});

const shutdown = (msg, callback) => {
  mongoose.connection.close(() => {
    console.log(`Mongoose disconnected through ${msg}`);
    callback();
  });
};

process.once('SIGUSR2', () => {
  shutdown('nodemon restart', () => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

process.on('SIGINT', () => {
  shutdown('app terminated', () => {
    process.exit(0)
  });
});

process.on('SIGTERM', () => {
  shutdown('Heroku app shutdown', () => {
    process.exit(0);
  })
});

require('./user');
require('./passport');

