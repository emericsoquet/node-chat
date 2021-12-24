const socket = io('/');

const URLQuery = Object.fromEntries(
    new URLSearchParams(window.location.search)
)

const pseudo = URLQuery.pseudo;

socket.emit('user:pseudo', pseudo);

socket.on('users:list', connectedUsers => {
    addUsersToList(connectedUsers);
})

const form = document.querySelector('.chat-form');

form.addEventListener('submit', event => {
    event.preventDefault();
    console.log('salut')
    // Récupération du input text
    const messageEl = form.querySelector('[name=message]');
    // Création de l'objet 'message'

    if (messageEl.value.trim() === '') {
        return;
    }

    const message = createMessage(messageEl.value);
    // Envoi de l'objet 'message' au serveur
    socket.emit('user:message', message);

    // Afficher le message dans la zone de tchat
    // showMessage(message);
});

const messageEl = document.querySelector('[name=message]');
messageEl.addEventListener('input', event => {
    socket.emit('user:typing', { pseudo });
});

const typingUsers = [
    // { pseudo, id, timer }
];

// Si on reçoit une info serveur comme quoi qqn écrit …
socket.on('user:typing', user => {
    
    // Vérifier si l'utilisateur n'est pas déjà dans la liste des "typingUsers"
    let typingUser = typingUsers.find(u => u.id === user.id);
    
    // S'il est déjà présent dans le tableau, on supprime son ancien timer
    if (typingUser) {
        clearTimeout(typingUser.timer);
    } else {
        // Sinon, on le crée et on l'ajoute au tableau
        typingUser = {
            pseudo: user.pseudo,
            id: user.id,
            timer: null
        };
        typingUsers.push(typingUser);
    }

    typingUser.timer = setTimeout(() => {
        let index = typingUsers.findIndex(u => u.id === typingUser.id);
        if (index > -1) {
            typingUsers.splice(index, 1);
            showTypingUsers();
        }
    }, 5000);
    
    showTypingUsers();
});

function showTypingUsers() {
    let html = '';
    typingUsers.forEach(user => {
        html += `<div>${user.pseudo} est en train d'écrire…</div>`;
    });

    const notifications = document.querySelector('.notifications');
    notifications.innerHTML = html;
}

socket.on('user:message', message => {
    // Afficher le message dans la zone de chat
    showMessage(message);
});

function addUsersToList(connectedUsers) {
    const chatUsers = document.querySelector('.chat-users ul');

    chatUsers.innerHTML = connectedUsers.map(({pseudo, id, color}) => `<li style="color: ${color}">${pseudo}</li>`).join('');
}

function createMessage(message) {

        return {
            date: Date.now(),
            pseudo,
            message
        }

}

function showMessage({ date, pseudo, message, color }) {
    let messageHtml = `<div class="message" style="color: ${color}">
        <span class="msg-date">${new Date(date).toLocaleString()}</span>
        <span class="msg-user">${pseudo} ></span>
        <span class="msg-message">${message}</span>
    </div>`;

    const chatboxMessages = document.querySelector('.chat-messages');
    chatboxMessages.innerHTML += messageHtml;
}