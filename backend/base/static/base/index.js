document.addEventListener('DOMContentLoaded', function() {
    const menuItems = document.querySelectorAll('.menu ul li');
    const content = document.querySelector('.content');
    const profileForm = document.getElementById('profile-form');
    const useridElement = document.getElementById('userid');
    const userid = useridElement.dataset.userid;
    const profileFormContainer = document.createElement('div'); // Создаем контейнер для формы профиля
    
    const newMeetingsContainer = document.createElement('div');
    newMeetingsContainer.classList.add('new-meetings-container'); 


    // Функция для создания формы профиля
    function createProfileForm() {
        profileFormContainer.innerHTML = ''; // Очищаем содержимое контейнера

        // Создаем форму профиля
        const formHTML = `
            <form id="profile-form">
                <div class="form-group">
                    <label for="first_name">First Name:</label>
                    <input type="text" id="first_name" name="first_name">
                </div>
                <div class="form-group">
                    <label for="last_name">Last Name:</label>
                    <input type="text" id="last_name" name="last_name">
                </div>
                <button type="submit">Update User</button>
            </form>
        `;
        profileFormContainer.innerHTML = formHTML; // Добавляем HTML формы в контейнер

        // Добавляем обработчик события для отправки формы профиля через AJAX
        profileFormContainer.querySelector('#profile-form').addEventListener('submit', function(event) {
            event.preventDefault(); // Отменяем стандартное действие отправки формы

            // Получаем данные формы
            const formData = new FormData(profileFormContainer.querySelector('#profile-form'));

            // Отправляем PATCH AJAX запрос на обновление профиля
            fetch(`/api/user/${userid}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    firstName: formData.get('first_name'),
                    lastName: formData.get('last_name')
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                console.log(response);
                if (!response.ok) {
                    throw new Error('Failed to update user');
                }
                return response.json();
            })
            .then(data => {
                console.log(data.message);
            })
            .catch(error => {
                console.error('Error updating user:', error);
            });
        });

        // Отображаем форму профиля в .content
        content.innerHTML = '';
        content.appendChild(profileFormContainer);
    }


    
    // Функция для отправки PATCH запроса при нажатии на кнопку пропуска встречи
    function handleSkipMeetingClick(meetingId, userId) {
        console.log("Meeting ID:", meetingId);
        // Отправляем PATCH AJAX запрос на обновление поля skipped у встречи и поля ready у пользователя
        fetch(`/api/meeting/${meetingId}/`, {
            method: 'PATCH',
            body: JSON.stringify({
                skipped: true  // Устанавливаем поле skipped в true
            }),
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            console.log(response);
            if (!response.ok) {
                throw new Error('Failed to update meeting');
            }
            // После успешного обновления встречи отправляем PATCH запрос на обновление поля ready у пользователя
            return fetch(`/api/user/${userId}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: false  // Устанавливаем поле ready в false
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
        })
        .then(userResponse => {
            console.log(userResponse);
            if (!userResponse.ok) {
                throw new Error('Failed to update user');
            }
            return userResponse.json();
        })
        .then(data => {
            console.log(data.message);
        })
        .catch(error => {
            console.error('Error updating meeting or user:', error);
        });
    }

    

    // Функция для отображения встреч
    function displayMeetings(meetings, container) {
        // Создаем HTML-разметку на основе полученных данных о встречах пользователя
        let meetingsHTML = '<div class="meetings-container">';
        meetings.forEach(meeting => {
            // Проверяем, пропущена ли встреча
                meetingsHTML += `
                    <div class="meeting">
                        <div class="date">${meeting.date}</div>
                        <div class="time">${meeting.time}</div>
                        <div class="companion">${meeting.companion}</div>
                        <div class="companion-telegram">${meeting.companion_telegram}</div>
                        <div class="format">${meeting.format}</div>
                        <div class="duration">${meeting.duration}</div>
                    </div>
                `;
                // Если встреча в будущем, добавляем кнопку пропуска
                if (isFutureMeeting(meeting) && (!(meeting.skipped))) {
                    meetingsHTML += `<button class="skip-meeting-btn" data-meeting-id="${meeting.id}">×</button>`;
                }
        });
        meetingsHTML += '</div>';
    
        // Обновляем содержимое блока .content информацией о встречах пользователя
        container.innerHTML = meetingsHTML;
    
        // Добавляем контейнер новых встреч внутрь блока content
        content.appendChild(newMeetingsContainer);
    
        /// Добавляем обработчики событий для кнопок пропуска встречи
        const skipMeetingButtons = container.querySelectorAll('.skip-meeting-btn');
        skipMeetingButtons.forEach(button => {
            button.addEventListener('click', function() {
                const meetingId = this.dataset.meetingId; // Получаем ID встречи из атрибута data-meeting-id
                handleSkipMeetingClick(meetingId, userid); // Вызываем функцию для отправки PATCH запроса
                console.log(meetingId);
    
                document.querySelector('.div-model2-container').style.display = 'flex'
            });
        });
    }
    

    // Функция для определения, является ли встреча в будущем
    function isFutureMeeting(meeting) {
        const meetingDate = new Date(meeting.date);
        const currentDate = new Date();
        return meetingDate > currentDate;
    }



    // Добавляем обработчик события для каждого элемента списка меню
    menuItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault(); // Отменяем стандартное действие ссылки

            // Удаляем класс 'active' у всех элементов списка меню
            menuItems.forEach(item => {
                item.classList.remove('active');
            });

            // Добавляем класс 'active' к элементу, на который было нажато
            item.classList.add('active');

            // Определяем, на какой пункт меню был сделан клик
            const menuItemId = item.id;

            // Если кликнули на пункт "Profile"
            if (menuItemId === 'profile') {
                // Создаем и отображаем форму профиля
                createProfileForm();
            } else {
                // Скрываем форму профиля, если кликнули на другой пункт меню
                profileFormContainer.innerHTML = ''; // Очищаем содержимое контейнера
            }

            // Если кликнули на пункт "Meets"
            if (menuItemId === 'meets') {
                // Отправляем AJAX запрос на URL для получения информации о встречах пользователя
                fetch('/meets/')
                    .then(response => {
                        // Проверяем статус ответа
                        if (!response.ok) {
                            throw new Error('Ошибка при загрузке данных о встречах');
                        }
                        return response.json();
                    })
                    .then(data => {
                        // Отображаем будущие встречи в новом контейнере
                        displayMeetings(data.future_meetings, newMeetingsContainer);
                        
                        // Отображаем прошлые встречи в основном контейнере
                        displayMeetings(data.past_meetings, content);
                    })
                    .catch(error => {
                        console.error('Ошибка при загрузке встреч:', error);
                    });
            }
        });
    });

    // Добавляем новый контейнер в DOM
    content.parentNode.insertBefore(newMeetingsContainer, content.nextSibling);

    // Функция для получения CSRF токена из куки
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});
