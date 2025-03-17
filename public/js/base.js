document.addEventListener('DOMContentLoaded', async () => {
  const logoutButton = document.getElementById('logout-button');

  logoutButton?.addEventListener('click', async function (event) {
    event.preventDefault();
    localStorage.removeItem('token');
    try {
      // Call the /logout route on the server to clear the cookie
      const response = await fetch('/logout', { method: 'GET' });

      // Redirect the user to the home page (or login page)
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  });
});
