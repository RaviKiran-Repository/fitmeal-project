document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const errorMessage = document.getElementById('error-message');

  loginForm?.addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    if (errorMessage?.style?.display) {
      errorMessage.style.display = 'none';
    }
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const token = await response.json();
      if (!response.ok) {
        throw new Error(token.error || 'Something went wrong');
      }
      localStorage.setItem('token', token); // Store the token in localStorage
      window.location.href = '/dashboard'; // Redirect to the dashboard
    } catch (error) {
      if (errorMessage) {
        errorMessage.innerText = error.message;
        errorMessage.classList.add('show-error');
      }
    }
  });
});
