import io from 'socket.io-client';

const socket = io('http://localhost:3000');
socket.on('connect', () => {
    console.log('connected', socket.id);
    socket.emit('sendMessage', {
        roomID: 'group_1',
        sender_id: 1,
        group_id: 1,
        content: 'Test group message'
    });

    setTimeout(() => {
        process.exit(0);
    }, 1000);
});
