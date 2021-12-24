const express = require('express');
const http = require('http');
const morgan = require('morgan');
const helmet = require('helmet');

const app = express();

const server = http.createServer(app);
const io = require('socket.io')(server);

app.set('view engine', 'pug');
app.set('views', './src/views');

const port = 1337;

app.locals.pretty = true;

require('./chat-server')(io);

// middlewares
app.use(helmet());
app.use(morgan('tiny'));
app.use(express.static('./src/static'));

// route vers la racine
app.get('/', (request, response) => {
    response.render('index.pug');
})

// route vers le chat
app.get('/chat', (request, response) => {
    if (!request.query.pseudo) {
        return response.redirect('/');
    }

    const pseudo = request.query.pseudo;

    response.render('chat.pug', { pseudo });
})

server.listen(port, () => {
    console.log('Le serveur écoute sur http://localhost:' + port);
})