const xss = require('xss');
const seedColor = require('seed-color');

module.exports = (io) => {

    const connectedUsers = [];
    const antiSpam = new AntiSpam();

    io.on('connection', (socket) => {

        console.log(`Socket #${socket.id} connected!`)

        socket.on('user:pseudo', (pseudo) => {
            console.log(`L\'utilisateur ${pseudo} vient d'arriver sur le chat !`);
            connectedUsers.push({
                id: socket.id,
                pseudo,
                color: seedColor(pseudo).toHex()
            })

            console.log('Utilisateurs connectés :', connectedUsers)

            // envoyer un message à tous les clients connectés
            io.emit('users:list', connectedUsers);
        })

        socket.on('user:message', message => {
            console.log('Nouveau message !', message);
        });

        socket.on('user:message', message => {

            // vérifier si un utilisateur est dans la spamlist
            if(antiSpam.isInList(socket.id)) {
                return console.info(`[antispam]: Message from ${message.pseudo} blocked!`)
            }

            if(message.message.trim() === '') return;

            message.message = xss(message.message, {
                whiteList: {}
            });
            message.color = seedColor(message.pseudo).toHex();
            // Transférer le message à tous les AUTRES sockets (sauf l'emetteur)
            io.emit('user:message', message);

            //
            antiSpam.addToList(socket.id)
        });

        // Dès que le serveur reçoit l'info de qqn en train d'écrire
        socket.on('user:typing', (user) => {
            // Envoie à tout le monde SAUF à l'émetteur
            socket.broadcast.emit('user:typing', {
                user,
                id: socket.id
            });
        });

        socket.on('disconnect', reason => {
            let disconnectedUser = connectedUsers.findIndex(
                user => user.id === socket.id
            );
            if (disconnectedUser > -1) {
                connectedUsers.splice(disconnectedUser, 1); // Supprime l'utilisateur déconnecté du TBL
                io.emit('users:list', connectedUsers);
            }
        });
    })

}

class AntiSpam {

    static coolTime = 2000;

    constructor() {
        this.spamList = [];
    }

    addToList(socketId) {
        if (!this.isInList(socketId)) {
            this.spamList.push(socketId)
            setTimeout(() => { this.removeFromList(socketId) }, AntiSpam.coolTime)
        }
    }

    removeFromList(socketId) {
        let index = this.spamList.indexOf(socketId);
        if (index > -1) {
            this.spamList.splice(index, 1);
        }
    }

    isInList(socketId) {
        return this.spamList.includes(socketId);
    }
}
