const controls = document.querySelectorAll('.control');

controls.forEach((control) => {
  control.addEventListener('click', () => {
    controls.forEach((item) => item.classList.remove('active'));
    control.classList.add('active');
  });
});

const navLinks = document.querySelectorAll('.nav-links a');

navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
