// --- Inline Script Block 1 ---
document.addEventListener("DOMContentLoaded", function () {
            // --- Chart.js Radar Initialization ---
            const ctx = document.getElementById('skillsRadarChart').getContext('2d');
            new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ['Embedded', 'Java', 'Python', 'Arduino', 'Web Dev'],
                    datasets: [{
                        label: 'Skill Level',
                        data: [75, 85, 50, 50, 75],
                        backgroundColor: 'rgba(0, 255, 204, 0.2)',
                        borderColor: '#00ffcc',
                        pointBackgroundColor: '#ffcc00',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#ffcc00',
                        borderWidth: 1.5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            pointLabels: {
                                color: '#8892b0',
                                font: { family: 'Courier New', size: 11 }
                            },
                            ticks: { display: false },
                            min: 0,
                            max: 100
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });

            // --- Mobile Drawer Navigation Menu ---
            const menuToggle = document.getElementById('menuToggle');
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            const navLinks = document.querySelectorAll('.nav-menu a');

            function toggleMenu() {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
            }

            if (menuToggle) {
                menuToggle.addEventListener('click', toggleMenu);
            }
            if (overlay) {
                overlay.addEventListener('click', toggleMenu);
            }

            // Close sidebar drawer on nav link click (mobile viewport)
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 1024) {
                        sidebar.classList.remove('open');
                        overlay.classList.remove('active');
                    }
                });
            });

            // --- ScrollSpy Active Highlight Implementation ---
            const sections = document.querySelectorAll('main section');

            function scrollSpy() {
                let current = '';
                sections.forEach(section => {
                    const sectionTop = section.offsetTop;
                    const sectionHeight = section.clientHeight;
                    // Check if current scroll position matches this section (offset slightly for navigation headers)
                    if (window.scrollY >= sectionTop - 180) {
                        current = section.getAttribute('id');
                    }
                });

                navLinks.forEach(link => {
                    link.classList.remove('active');
                    const targetId = link.getAttribute('href').substring(1);
                    if (targetId === current) {
                        link.classList.add('active');
                    }
                });
            }

            window.addEventListener('scroll', scrollSpy);
            scrollSpy(); // Initial call

            // --- Resume Download ---
            const downloadResume = () => {
                showToast("Downloading Aathithyan K Resume PDF...");

                const link = document.createElement('a');
                link.href = 'assets/723723106002_AATHITHYAN K (1).pdf';
                link.download = 'Aathithyan_K_Resume.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            const downloadBtn = document.getElementById('downloadResumeBtn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', downloadResume);
            }

            const heroDownloadBtn = document.getElementById('heroDownloadBtn');
            if (heroDownloadBtn) {
                heroDownloadBtn.addEventListener('click', downloadResume);
            }

            // --- Contact Form Client-Side Validation ---
            const contactForm = document.getElementById('contactForm');
            if (contactForm) {
                contactForm.addEventListener('submit', function (e) {
                    e.preventDefault();

                    const name = document.getElementById('contactName').value.trim();
                    const mobile = document.getElementById('contactMobile').value.trim();
                    const email = document.getElementById('contactEmail').value.trim();
                    const message = document.getElementById('contactMessage').value.trim();

                    if (!name || !mobile || !email || !message) {
                        showToast('Please fill in all fields before submitting.');
                        return;
                    }

                    if (name.length < 2) {
                        showToast('Please enter a valid name (at least 2 characters).');
                        return;
                    }

                    const mobileRegex = /^\+?[\d\s-]{10,}$/;
                    if (!mobileRegex.test(mobile)) {
                        showToast('Please enter a valid mobile number.');
                        return;
                    }

                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                        showToast('Please enter a valid email address.');
                        return;
                    }

                    const btn = document.getElementById('contactSubmitBtn');
                    const originalBtnContent = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SENDING...';

                    fetch(contactForm.action, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            name: name,
                            mobile: mobile,
                            email: email,
                            message: message,
                            _subject: "New message from Portfolio Contact Form",
                            _captcha: "false"
                        })
                    })
                        .then(response => {
                            if (response.ok) {
                                showToast('Thanks for reaching out! I will get back to you soon.');
                                contactForm.reset();
                            } else {
                                showToast('Oops! There was a problem submitting your form.');
                            }
                        })
                        .catch(error => {
                            showToast('Oops! There was a problem submitting your form.');
                        })
                        .finally(() => {
                            btn.disabled = false;
                            btn.innerHTML = originalBtnContent;
                        });
                });
            }

            // Custom Toast Message Function
            function showToast(message) {
                // Remove existing toast if it is still lingering
                const existingToast = document.querySelector('.toast-notification');
                if (existingToast) {
                    existingToast.remove();
                }

                const toast = document.createElement('div');
                toast.className = 'toast-notification';
                toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
                document.body.appendChild(toast);

                // Allow style thread to register initial state then slide up
                setTimeout(() => {
                    toast.classList.add('show');
                }, 50);

                // Auto slide-down and remove
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => {
                        toast.remove();
                    }, 300);
                }, 3000);
            }
        });

// --- Inline Script Block 2 ---
function openImageModal(src) {
            const modal = document.getElementById('imageModal');
            const modalImage = document.getElementById('modalImage');
            modalImage.src = src;
            modal.classList.add('active');
        }

        function closeImageModal(event) {
            const modal = document.getElementById('imageModal');
            modal.classList.remove('active');
        }

        // Close modal when pressing Escape key
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                const modal = document.getElementById('imageModal');
                modal.classList.remove('active');
            }
        });

// --- Inline Script Block 3 ---
(function () {
            const chip = document.querySelector('.chip');
            const particleContainer = document.getElementById('holoParticles');
            let particleInterval = null;

            function spawnParticle() {
                const p = document.createElement('div');
                p.className = 'holo-particle';
                const left = Math.random() * 120 + 10;
                const duration = 1.5 + Math.random() * 1.5;
                const driftX = (Math.random() - 0.5) * 40;
                p.style.left = left + 'px';
                p.style.setProperty('--duration', duration + 's');
                p.style.setProperty('--drift-x', driftX + 'px');
                p.style.width = (2 + Math.random() * 2) + 'px';
                p.style.height = p.style.width;
                particleContainer.appendChild(p);
                setTimeout(() => p.remove(), duration * 1000);
            }

            chip.addEventListener('mouseenter', () => {
                particleInterval = setInterval(spawnParticle, 120);
            });

            chip.addEventListener('mouseleave', () => {
                clearInterval(particleInterval);
                particleInterval = null;
            });
        })();

// --- Inline Script Block 4 ---
document.querySelectorAll('.section-box').forEach(function (section) {
            ['tl', 'tr', 'bl', 'br'].forEach(function (pos) {
                var corner = document.createElement('span');
                corner.className = 'corner-edge corner-' + pos;
                section.appendChild(corner);
            });
        });

// --- Inline Script Block 5 ---
document.addEventListener("DOMContentLoaded", () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+';
            const speed = 30; // ms per frame

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        if (element.dataset.animating === "true") return;
                        element.dataset.animating = "true";

                        const originalText = element.dataset.originalText || element.innerText;
                        element.dataset.originalText = originalText;
                        const length = originalText.length;
                        let currentIteration = 0;

                        const interval = setInterval(() => {
                            element.innerText = originalText.split('').map((char, index) => {
                                if (char === ' ') return ' ';
                                if (index < Math.floor(currentIteration)) {
                                    return char;
                                }
                                return chars[Math.floor(Math.random() * chars.length)];
                            }).join('');

                            if (currentIteration >= length) {
                                clearInterval(interval);
                                element.innerText = originalText;
                                element.dataset.animating = "false";
                            }

                            currentIteration += 1 / 3;
                        }, speed);
                    }
                });
            }, { threshold: 0.1 });

            // Apply decrypt effect setup to section titles
            document.querySelectorAll('.section-title').forEach(el => {
                const text = el.textContent.trim();
                const words = text.split(' ');
                el.innerHTML = '';
                words.forEach((word, index) => {
                    const span = document.createElement('span');
                    span.textContent = word;
                    // Alternating green and gold colors
                    if (index % 2 === 0) {
                        span.className = 'green decrypt-text';
                    } else {
                        span.className = 'gold decrypt-text';
                    }
                    el.appendChild(span);

                    if (index < words.length - 1) {
                        el.appendChild(document.createTextNode(' '));
                    }
                });
            });

            document.querySelectorAll('.decrypt-text').forEach(el => {
                el.dataset.originalText = el.innerText;
                observer.observe(el);
            });

            // Toggle sidebar visibility depending on scroll position - active for all sections except Home (Hero)
            const handleSidebarVisibility = () => {
                if (window.innerWidth > 1024) {
                    const aboutSection = document.getElementById('about');
                    if (aboutSection) {
                        const top = aboutSection.offsetTop;
                        // Hide sidebar on Home section, show for all other sections
                        if (window.scrollY < top - 180) {
                            document.body.classList.add('sidebar-hidden');
                        } else {
                            document.body.classList.remove('sidebar-hidden');
                        }
                    } else {
                        // Fallback scroll threshold if about section is missing
                        if (window.scrollY < 120) {
                            document.body.classList.add('sidebar-hidden');
                        } else {
                            document.body.classList.remove('sidebar-hidden');
                        }
                    }
                } else {
                    document.body.classList.remove('sidebar-hidden');
                }
            };
            window.addEventListener('scroll', handleSidebarVisibility);
            window.addEventListener('resize', handleSidebarVisibility);
            handleSidebarVisibility(); // Initial check

            // --- Page Scroll Progress Bar ---
            const progressBar = document.getElementById('scrollProgressBar');
            const updateScrollProgress = () => {
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (docHeight > 0) {
                    const scrollPercent = scrollTop / docHeight;
                    progressBar.style.transform = `scaleX(${scrollPercent})`;
                } else {
                    progressBar.style.transform = 'scaleX(0)';
                }
            };
            window.addEventListener('scroll', updateScrollProgress, { passive: true });
            updateScrollProgress(); // Initial check

            // --- Scroll Reveal Intersection Observer ---
            const revealOptions = {
                root: null,
                rootMargin: '0px 0px -12% 0px', // trigger slightly before entering viewport
                threshold: 0.05 // trigger when 5% visible
            };

            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        
                        // Trigger stagger animation for child elements
                        const children = entry.target.querySelectorAll(
                            '.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-3d'
                        );
                        children.forEach(child => {
                            child.classList.add('animate-in');
                        });
                        
                        // Stop observing once animated in to preserve performance
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, revealOptions);

            // Observe all section boxes
            document.querySelectorAll('.section-box').forEach(section => {
                revealObserver.observe(section);
            });
        });

// --- Inline Script Block 6 ---
document.addEventListener("DOMContentLoaded", () => {
            new SideRays(document.body, {
                speed: 2.5,
                rayColor1: '#00ffcc',
                rayColor2: '#5227FF',
                intensity: 2,
                spread: 2,
                origin: 'top-right',
                tilt: 0,
                saturation: 1.5,
                blend: 0.75,
                falloff: 1.6,
                opacity: 0.8
            });

            new ShapeGrid(document.body, {
                direction: 'diagonal',
                speed: 0.5,
                borderColor: 'rgba(0, 255, 204, 0.03)',
                squareSize: 45,
                hoverFillColor: 'rgba(0, 255, 204, 0.12)',
                shape: 'square',
                hoverTrailAmount: 4
            });
        });