document.addEventListener('DOMContentLoaded', function() {
    const menuItems = document.querySelectorAll('.menu ul li');
    const menu = document.getElementById('menu');
    const content = document.querySelector('.content');
    const profileForm = document.getElementById('profile-form');
    const useridElement = document.getElementById('userid');
    const userid = useridElement.dataset.userid;
    const profileFormContainer = document.createElement('div'); // Создаем контейнер для формы профиля
    
    const newMeetingsContainer = document.createElement('div');
    newMeetingsContainer.classList.add('new-meetings-container'); 
    // Находите кнопку по id
    
    // const createPairsBtn = document.createElement('button');
    const createPairsBtn = document.getElementById('createPairsBtn');
    // createPairsBtn.setAttribute('id', 'createPairsBtn');
    // createPairsBtn.textContent = 'Создать пары';

    var is_staff = false

    // Запрашиваем данные о пользователе с сервера
    fetch(`/api/get_user_info/?id=${userid}`)
    .then(response => response.json())
    .then(data => {
        is_staff = data.is_staff;
    })
    .catch(error => console.error('Error fetching user data:', error));

    console.log(is_staff);

    if (is_staff) {
        document.getElementById("createPairsBtn").style.display = "block";
    } else {
        document.getElementById("createPairsBtn").style.display = "none";
    }

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
            <div class="form-group">
                <label for="gender">Gender:</label>
                <select id="gender" name="gender">
                    <option value="Man">Man</option>
                    <option value="Woman">Woman</option>
                </select>
            </div>
            <div class="form-group">
                <label for="meeting_start_point">Meeting Start Point:</label>
                <input type="datetime-local" id="meeting_start_point" name="meeting_start_point">
            </div>
            <div class="form-group">
                <label for="meeting_end_point">Meeting End Point:</label>
                <input type="datetime-local" id="meeting_end_point" name="meeting_end_point">
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
                    lastName: formData.get('last_name'),
                    gender: formData.get('gender'),
                    meeting_start_point: formData.get('meeting_start_point'),
                    meeting_end_point: formData.get('meeting_end_point'),

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
        // console.log("Meeting ID:", meetingId);
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
            // console.log(response);
            if (!response.ok) {
                throw new Error('Failed to update meeting');
            }
            // Увеличиваем значение поля skipEvent на 1
            // skipEvent++;
            // После успешного обновления встречи отправляем PATCH запрос на обновление поля ready у пользователя
            return fetch(`/api/user/${userId}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: false,  // Устанавливаем поле ready в false
                    // skipEvent: skipEvent
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
                    meetingsHTML += `<button class="skip-meeting-btn" data-meeting-id=${meeting.id}>×</button>`;
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

            // Если кликнули на пункт "Statistick"
            if (menuItemId === 'statistick') {
                // Очищаем содержимое контейнера
                content.innerHTML = '';


                // Создаем элемент <div> для обертки диаграммы
                const chartWrapper = document.createElement('div');
                chartWrapper.classList.add('Graph');
                // Создаем элемент <canvas> с установкой размеров через свойства width и height
                const canvas = document.createElement('canvas');
                canvas.width = 400; // Установка ширины
                canvas.height = 400; // Установка высоты
                canvas.id = 'myChart'; // Установка идентификатора
                const context = canvas.getContext('2d'); // Получение контекста рисования
                // Добавляем canvas в div обертку
                chartWrapper.appendChild(canvas);
                // Добавляем div обертку на страницу
                document.body.appendChild(chartWrapper);
                content.appendChild(chartWrapper);


                if (is_staff) {
                    // Создаем элемент <div> для обертки диаграммы
                    const chartWrapper_admin = document.createElement('div');
                    chartWrapper_admin.classList.add('Graph_admin');
                    // Создаем элемент <canvas> с установкой размеров через свойства width и height
                    const canvas_admin = document.createElement('canvas');
                    canvas_admin.width = 400; // Установка ширины
                    canvas_admin.height = 400; // Установка высоты
                    canvas_admin.id = 'myChart_admin'; // Установка идентификатора
                    const context_admin = canvas_admin.getContext('2d'); // Получение контекста рисования
                    // Добавляем canvas в div обертку
                    chartWrapper_admin.appendChild(canvas_admin);
                    // Добавляем div обертку на страницу
                    document.body.appendChild(chartWrapper_admin);
                    content.appendChild(chartWrapper_admin);
                }

                // Получение данных о пользователе с сервера
                fetch(`/api/get_all_data_user/?id=${userid}`)
                .then(response => response.json())
                .then(data => {
                    // Данные для круговой диаграммы
                    const chartData = {
                        labels: ['Total Meetings', 'Completed Meetings'],
                        datasets: [{
                            label: 'Meetings',
                            data: [data.total_meetings, data.completed_meetings],
                            backgroundColor: [
                                'rgba(248, 243, 43, 0.3)', // Цвет для "Total Meetings"
                                'rgba(0, 0, 0, 0.3)', // Цвет для "Completed Meetings"
                            ],
                            borderColor: [
                                'rgba(248, 243, 43, 1)',
                                'rgba(0, 0, 0, 1)',
                            ],
                            borderWidth: 1
                        }]
                    };

                    // Опции для круговой диаграммы
                    const chartOptions = {
                        responsive: true,
                        maintainAspectRatio: false,
                        legend: {
                            position: 'top',
                        },
                    };

                    // Отображение круговой диаграммы
                    const ctx = document.getElementById('myChart').getContext('2d');
                    const myChart = new Chart(ctx, {
                        type: 'doughnut',
                        data: chartData,
                        options: chartOptions
                    });
                })
                .catch(error => console.error('Error fetching data:', error));



                fetch(`/api/get_all_data_admin/?id=${userid}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch admin data');
                    }
                    return response.json();
                })
                .then(adminData => {
                    // Используйте данные администратора здесь
                    console.log(adminData);

                    // Создаем новый набор данных для административных данных
                    const adminChartData = {
                        labels: ['Total Users', 'Total Meetings', 'Meetings Happened'],
                        datasets: [{
                            label: 'Admin Data',
                            data: [adminData.total_users, adminData.total_meetings, adminData.meetings_happened],
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.3)', // Цвет для "Total Users"
                                'rgba(54, 162, 235, 0.3)', // Цвет для "Total Meetings"
                                'rgba(75, 192, 192, 0.3)', // Цвет для "Meetings Happened"
                            ],
                            borderColor: [
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(75, 192, 192, 1)',
                            ],
                            borderWidth: 1
                        }]
                    };

                    // Опции для круговой диаграммы
                    const chartOptions = {
                        responsive: true,
                        maintainAspectRatio: false,
                        legend: {
                            position: 'top',
                        },
                    };

                    // Отображение круговой диаграммы
                    const ctx = document.getElementById('myChart_admin').getContext('2d');
                    const myChart = new Chart(ctx, {
                        type: 'doughnut',
                        data: adminChartData,
                        options: chartOptions
                    });

                })
                .catch(error => {
                    console.error('Error fetching admin data:', error);
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



    // Добавьте обработчик события на кнопку
    createPairsBtn.addEventListener('click', function() {
        // Выполните AJAX запрос на метод find_users_by_meeting_details
        fetch('/create_meetings/')
        .then(response => {
            // Проверьте статус ответа
            if (!response.ok) {
                throw new Error('Failed to create pairs');
            }
            // Верните данные в формате JSON
            return response.json();
        })
        .then(data => {
            // Обработайте полученные данные здесь
            console.log(data);
            // Например, вы можете обновить DOM или выполнить другие действия
        })
        .catch(error => {
            // Обработайте ошибку здесь
            console.error('Error creating pairs:', error);
        });
    });
});
