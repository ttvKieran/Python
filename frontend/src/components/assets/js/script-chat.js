document.querySelector('.menu-button').addEventListener('click', function() {
    const functionList = document.getElementById('functionList');
    const buttonRect = event.target.getBoundingClientRect(); // Lấy vị trí của nút
    functionList.style.top = `${buttonRect.bottom + window.scrollY}px`; // Đặt vị trí y
    functionList.style.left = `${buttonRect.left + window.scrollX}px`; // Đặt vị trí x

    if (functionList.style.display === 'none' || functionList.style.display === '') {
        functionList.style.display = 'block';
    } else {
        functionList.style.display = 'none';
    }
});

const chatMessages = document.querySelector('.chat-messages');
chatMessages.scrollTop = chatMessages.scrollHeight; // Cuộn xuống dưới cùng

