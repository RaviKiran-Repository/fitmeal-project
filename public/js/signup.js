document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');

  signupForm?.addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    if (errorMessage?.style?.display) {
      errorMessage.style.display = 'none';
    }

    if (successMessage?.style?.display) {
      successMessage.style.display = 'none';
    }

    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (successMessage) {
        successMessage.innerText = data.message;
        successMessage.classList.add('show-success');
        signupForm.reset();
      }
    } catch (error) {
      if (errorMessage) {
        errorMessage.innerText = error.message;
        errorMessage.classList.add('show-error');
      }
    }
  });
});
