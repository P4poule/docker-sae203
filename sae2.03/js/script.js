// Effet curseur
//Stock la référence du curseur en dehors du gestionnaire d'événements
const cursor = document.querySelector('.cursor');
let mouseX = 0, mouseY = 0;

// masque le curseur custom quand on quitte la fenêtre
document.addEventListener('mouseout', (e) => {
	// e.relatedTarget est null quand on sort du document
	if (!e.relatedTarget) {
		cursor.style.opacity = '0';
	}
});

// réaffiche quand on revient dans la fenêtre
document.addEventListener('mouseover', (e) => {
	cursor.style.opacity = '1';
});

// on se contente de capter la souris en permanence
document.addEventListener('mousemove', e => {
	mouseX = e.clientX;
	mouseY = e.clientY;
});

//trainée derrière le curseur

document.addEventListener('mousemove', e => {
	mouseX = e.clientX;
	mouseY = e.clientY;

	// particule
	const dot = document.createElement('div');
	dot.className = 'cursor-trail';
	dot.style.left = `${e.clientX}px`;
	dot.style.top = `${e.clientY}px`;
	document.body.appendChild(dot);
	setTimeout(() => dot.remove(), 600);
});


function updateCursor() {
	// on applique la position + le décalage centré
	cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)translate(-50%, -50%)`;
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