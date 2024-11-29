document.getElementById('user-icon').addEventListener('click', function(event) {
    event.preventDefault();
    fetch('/auth/check')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                window.location.href = '/profile';
            } else {
                window.location.href = '/login';
            }
        })
        .catch(error => {
            console.error('Error al verificar la autenticación:', error);//hola
        });
});