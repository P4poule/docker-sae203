/* --------------------------------------------------*/
/*              Effet curseur                        */
/* --------------------------------------------------*/
const cursor = document.querySelector('.cursor');
let mouseX = 0, mouseY = 0;

// Au chargement, récupérer les dernières coordonnées connues
document.addEventListener('DOMContentLoaded', function() {
	// Récupérer les coordonnées stockées (ou utiliser le centre si aucune)
	const savedX = sessionStorage.getItem('mouseX');
	const savedY = sessionStorage.getItem('mouseY');
	
	if (savedX && savedY) {
		mouseX = parseInt(savedX);
		mouseY = parseInt(savedY);
		// Rendre visible et positionner immédiatement
		cursor.style.opacity = '1';
		cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
	}
});

// Stocker position avant navigation
document.querySelectorAll('a').forEach(link => {
	link.addEventListener('click', () => {
		sessionStorage.setItem('mouseX', mouseX);
		sessionStorage.setItem('mouseY', mouseY);
	});
});

// Masque le curseur custom quand on quitte la fenêtre
document.addEventListener('mouseout', (e) => {
	if (!e.relatedTarget) {
		cursor.style.opacity = '0';
	}
});

// Réaffiche quand on revient dans la fenêtre
document.addEventListener('mouseover', (e) => {
	cursor.style.opacity = '1';
});

// Suivi de la souris et création de trainée
document.addEventListener('mousemove', e => {
	mouseX = e.clientX;
	mouseY = e.clientY;
	
	// Sauvegarde des coordonnées pour navigation future
	sessionStorage.setItem('mouseX', mouseX);
	sessionStorage.setItem('mouseY', mouseY);

	// Création particule de trainée
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

/* --------------------------------------------------*/
/*      Code pour les boutons de copie de code       */
/* --------------------------------------------------*/
document.addEventListener('DOMContentLoaded', function () {
	const codeContainers = document.querySelectorAll('.code-container');

	codeContainers.forEach(container => {
		const codeBlock = container.querySelector('pre');
		const copyButton = document.createElement('button');
		copyButton.className = 'copy-btn';
		copyButton.innerHTML = '<i class="fas fa-copy"></i> Copier';
		container.appendChild(copyButton);

		copyButton.addEventListener('click', function () {
			const code = codeBlock.textContent;
			navigator.clipboard.writeText(code).then(() => {
				copyButton.classList.add('copy-success');
				copyButton.innerHTML = '<i class="fas fa-check"></i> Copié!';

				setTimeout(() => {
					copyButton.classList.remove('copy-success');
					copyButton.innerHTML = '<i class="fas fa-copy"></i> Copier';
				}, 2000);
			});
		});
	});
});

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