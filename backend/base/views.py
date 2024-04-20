from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login


def login_page(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, email=email, password=password)
        if user is not None:
            login(request, user)
            return redirect('login')
        else:
            return render(request, 'base/login.html', {'error_message': 'Invalid email or password'})
        
    else:
        return render(request, 'base/login.html')