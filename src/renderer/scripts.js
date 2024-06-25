$(document).ready(function() {
    // API Base URL
    const API_URL = 'http://localhost:3000';

    // Mock data for initial display
    let rooms = ['General', 'Technology', 'Random'];
    let currentUser = null;
    let currentRoom = 'General';

    function displayRooms() {
        $('#room-list').empty();
        rooms.forEach(room => {
            $('#room-list').append(`<li class="list-group-item">${room}</li>`);
        });
    }

    function displayMessages(messages) {
        $('#message-list').empty();
        messages.forEach(message => {
            $('#message-list').append(`<p><strong>${message.username}:</strong> ${message.message}</p>`);
        });
    }

    function switchRoom(room) {
        currentRoom = room;
        $.get(`${API_URL}/messages`, { room: currentRoom }, function(data) {
            displayMessages(data);
        });
    }

    // User registration
    $('#register-form').submit(function(event) {
        event.preventDefault();
        let username = $('#register-username').val();
        let password = $('#register-password').val();

        $.post(`${API_URL}/register`, { username, password }, function(response) {
            alert(response);
        }).fail(function() {
            alert('Username already exists');
        });
    });

    // User login
    $('#login-form').submit(function(event) {
        event.preventDefault();
        let username = $('#login-username').val();
        let password = $('#login-password').val();

        $.post(`${API_URL}/login`, { username, password }, function(response) {
            currentUser = username;
            $('#auth-section').hide();
            $('#chat-section').show();
            displayRooms();
            switchRoom(currentRoom);
        }).fail(function() {
            alert('Invalid username or password');
        });
    });

    // Send message
    $('#message-form').submit(function(event) {
        event.preventDefault();
        let messageText = $('#message-input').val();

        if (messageText.trim()) {
            $.post(`${API_URL}/messages`, { room: currentRoom, username: currentUser, message: messageText }, function() {
                $('#message-input').val('');
                switchRoom(currentRoom);
            });
        }
    });

    // Switch room
    $('#room-list').on('click', 'li', function() {
        $('#room-list li').removeClass('active');
        $(this).addClass('active');
        switchRoom($(this).text());
    });
});
