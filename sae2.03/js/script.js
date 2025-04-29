// Effet curseur
//Stock la référence du curseur en dehors du gestionnaire d'événements
const cursor = document.querySelector('.cursor');
let mouseX = 0, mouseY = 0;

// on se contente de capter la souris en permanence
document.addEventListener('mousemove', e => {
	mouseX = e.clientX;
	mouseY = e.clientY;
});

function updateCursor() {
	cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
	requestAnimationFrame(updateCursor);
}

requestAnimationFrame(updateCursor);

// Chargement dynamique du contenu
document.addEventListener('DOMContentLoaded', () => {
	// Animation au défilement
	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.style.opacity = 1;
				entry.target.style.transform = 'translateY(0)';
			}
		});
	}, { threshold: 0.1 });

	document.querySelectorAll('.tech-card').forEach(card => {
		observer.observe(card);
	});
});