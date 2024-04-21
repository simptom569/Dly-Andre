document.addEventListener('DOMContentLoaded', function() {
    // Находим кнопку "Profile"
    const profileButton = document.getElementById('profile-btn');
    
    // Назначаем обработчик события клика на кнопку "Profile"
    profileButton.addEventListener('click', function(event) {
        event.preventDefault(); // Предотвращаем стандартное действие ссылки
        
        // Создаем форму
        const form = document.createElement('form');
        form.id = 'updateForm';
        form.innerHTML = `
            {% csrf_token %}
            <label for="first_name">First Name:</label>
            <input type="text" id="first_name" name="first_name">
            <br>
            <label for="last_name">Last Name:</label>
            <input type="text" id="last_name" name="last_name">
            <br>
            <button type="submit">Update User</button>
        `;
        
        // Вставляем форму в контентную область
        const content = document.querySelector('.content');
        content.innerHTML = '';
        content.appendChild(form);
    });
});
