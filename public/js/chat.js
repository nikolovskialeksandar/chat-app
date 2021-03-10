const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messageContainer = document.querySelector('#messages');
const $chatSidebar = document.querySelector('#sidebar');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
 const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

// Send message
$messageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = event.target.elements.message.value;
    
    // Disable button
    $messageFormButton.setAttribute('disabled', 'disabled');

    socket.emit('sendMessage', message, (acknowlegement) => {
        console.log('Sent!');

        // Enable send button, empty input and focus
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        console.log(acknowlegement);
    });
});

// Display received messages
socket.on('receivedMessage', (receivedMessage) => {
   const html = Mustache.render(messageTemplate, {
       username: receivedMessage.username,
       message: receivedMessage.text,
       createdAt: moment(receivedMessage.createdAt).format('HH:mm')
   });
   $messageContainer.insertAdjacentHTML('beforeend', html);
   autoscroll();
});

socket.on('locationMessage', (location) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: location.username,
        url: location.url,
       createdAt: moment(location.createdAt).format('HH:mm')
    });
    $messageContainer.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

// Send location
$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
       return alert('Your browser does not support geolocation!');
    }

    $sendLocationButton.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (acknowlegement) => {
            $sendLocationButton.removeAttribute('disabled');
            console.log(acknowlegement);
        });
    });
});

// Display user list
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room: room,
        users: users
    });
    $chatSidebar.innerHTML = html;
});

// Join user
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});

// Autoscroll when message is received
const autoscroll = () => {
    // New message element
    const $newMessage = $messageContainer.lastElementChild;
    
    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible height
    const visibleHeight = $messageContainer.offsetHeight;

    // Height of message container
    const containerHeight = $messageContainer.scrollHeight;

    // How far am i scrolled
    const scrollOffset = $messageContainer.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messageContainer.scrollTop = $messageContainer.scrollHeight;
    }
}