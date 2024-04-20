from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login


def login_page(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, email=email, password=password)
        if user is not None:
            login(request, user)
            # Вход успешен, перенаправление на домашнюю страницу или куда-то еще
            return redirect('login')  # Замените 'home' на URL вашей домашней страницы
        else:
            # Неверные учетные данные, возвращаем обратно на страницу входа с сообщением об ошибке
            return render(request, 'base/login.html', {'error_message': 'Invalid email or password'})
    else:
        # Если это GET-запрос (открытие страницы входа), просто возвращаем страницу входа
        return render(request, 'base/login.html')