// ===== MAIN JAVASCRIPT ===== 

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initMobileNavigation();
    initDropdownAutohide();
    initTableOfContents();
    initScrollProgress();
    initSmoothScrolling();
    initAnimations();
    initThemeToggle();
});

// ===== MOBILE NAVIGATION =====
function initMobileNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            
            // Animate hamburger menu
            const bars = navToggle.querySelectorAll('.bar');
            bars.forEach((bar, index) => {
                if (navToggle.classList.contains('active')) {
                    if (index === 0) bar.style.transform = 'rotate(45deg) translate(var(--space-1), var(--space-1))';
                    if (index === 1) bar.style.opacity = '0';
                    if (index === 2) bar.style.transform = 'rotate(-45deg) translate(var(--space-2), calc(-1 * var(--space-2)))';
                } else {
                    bar.style.transform = 'none';
                    bar.style.opacity = '1';
                }
            });
        });
        
        // Close mobile menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                
                const bars = navToggle.querySelectorAll('.bar');
                bars.forEach(bar => {
                    bar.style.transform = 'none';
                    bar.style.opacity = '1';
                });
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                
                const bars = navToggle.querySelectorAll('.bar');
                bars.forEach(bar => {
                    bar.style.transform = 'none';
                    bar.style.opacity = '1';
                });
            }
        });
    }
}

// ===== DROPDOWN AUTOHIDE =====
function initDropdownAutohide() {
    const dropdown = document.querySelector('.nav-dropdown');
    const dropdownContent = document.querySelector('.dropdown-content');
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    
    if (dropdown && dropdownContent && dropdownToggle) {
        // Toggle dropdown on click
        dropdownToggle.addEventListener('click', function(event) {
            event.preventDefault();
            dropdownContent.classList.toggle('show');
            dropdownToggle.setAttribute('aria-expanded', dropdownContent.classList.contains('show'));
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!dropdown.contains(event.target)) {
                dropdownContent.classList.remove('show');
                dropdownToggle.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Show dropdown on hover
        dropdown.addEventListener('mouseenter', function() {
            dropdownContent.classList.add('show');
            dropdownToggle.setAttribute('aria-expanded', 'true');
        });
        
        // Hide dropdown when mouse leaves (with small delay for better UX)
        dropdown.addEventListener('mouseleave', function() {
            setTimeout(function() {
                if (!dropdown.matches(':hover')) {
                    dropdownContent.classList.remove('show');
                    dropdownToggle.setAttribute('aria-expanded', 'false');
                }
            }, 100);
        });
        
        // Close dropdown when clicking on a dropdown link
        const dropdownLinks = dropdownContent.querySelectorAll('a');
        dropdownLinks.forEach(link => {
            link.addEventListener('click', function() {
                dropdownContent.classList.remove('show');
                dropdownToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }
}

// ===== TABLE OF CONTENTS =====
function initTableOfContents() {
    const tocContainer = document.getElementById('toc');
    if (!tocContainer) return;
    
    const headings = document.querySelectorAll('.factor-article h1, .factor-article h2, .factor-article h3, .factor-article h4');
    if (headings.length === 0) return;
    
    const tocList = document.createElement('ul');
    let currentLevel = 1;
    let currentList = tocList;
    const listStack = [tocList];
    
    headings.forEach((heading, index) => {
        // Create ID for heading if it doesn't exist
        if (!heading.id) {
            heading.id = 'heading-' + index;
        }
        
        const level = parseInt(heading.tagName.charAt(1));
        const text = heading.textContent;
        
        // Adjust list nesting based on heading level
        if (level > currentLevel) {
            // Create nested list
            const nestedList = document.createElement('ul');
            const lastItem = currentList.lastElementChild;
            if (lastItem) {
                lastItem.appendChild(nestedList);
            }
            listStack.push(nestedList);
            currentList = nestedList;
        } else if (level < currentLevel) {
            // Go back to parent list
            for (let i = currentLevel; i > level; i--) {
                listStack.pop();
            }
            currentList = listStack[listStack.length - 1];
        }
        
        currentLevel = level;
        
        // Create list item
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#' + heading.id;
        link.textContent = text;
        link.className = 'toc-link';
        
        listItem.appendChild(link);
        currentList.appendChild(listItem);
    });
    
    tocContainer.appendChild(tocList);
    
    // Highlight current section in TOC
    initTocHighlighting();
}

function initTocHighlighting() {
    const tocLinks = document.querySelectorAll('.toc-link');
    const headings = document.querySelectorAll('.factor-article h1, .factor-article h2, .factor-article h3, .factor-article h4');
    
    if (tocLinks.length === 0 || headings.length === 0) return;
    
    function highlightTocLink() {
        let current = '';
        const scrollPosition = window.scrollY + 100; // Offset for better UX
        
        headings.forEach(heading => {
            const rect = heading.getBoundingClientRect();
            if (rect.top <= 100) {
                current = heading.id;
            }
        });
        
        tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', highlightTocLink);
    highlightTocLink(); // Initial call
}

// ===== SCROLL PROGRESS =====
function initScrollProgress() {
    const progressBar = document.getElementById('progress-bar');
    if (!progressBar) return;
    
    function updateProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        
        progressBar.style.width = Math.min(scrollPercent, 100) + '%';
    }
    
    window.addEventListener('scroll', updateProgress);
    updateProgress(); // Initial call
}

// ===== SMOOTH SCROLLING =====
function initSmoothScrolling() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                
                const offsetTop = target.getBoundingClientRect().top + window.scrollY - 80;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== THEME TOGGLE =====
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;
    
    if (!themeToggle || !themeIcon) return;
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        enableDarkMode();
    } else {
        enableLightMode();
    }
    
    // Toggle theme on button click
    themeToggle.addEventListener('click', function() {
        if (body.classList.contains('dark-mode')) {
            enableLightMode();
            localStorage.setItem('theme', 'light');
        } else {
            enableDarkMode();
            localStorage.setItem('theme', 'dark');
        }
    });
    
    function enableDarkMode() {
        body.classList.add('dark-mode');
        themeIcon.className = 'fas fa-sun';
        themeToggle.setAttribute('aria-label', 'Switch to light mode');
        themeToggle.setAttribute('title', 'Switch to light mode');
    }
    
    function enableLightMode() {
        body.classList.remove('dark-mode');
        themeIcon.className = 'fas fa-moon';
        themeToggle.setAttribute('aria-label', 'Switch to dark mode');
        themeToggle.setAttribute('title', 'Switch to dark mode');
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                enableDarkMode();
            } else {
                enableLightMode();
            }
        }
    });
}

// ===== ANIMATIONS =====
function initAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: `0px 0px -${getComputedStyle(document.documentElement).getPropertyValue('--space-12')} 0px`
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.factor-card, .factor-article h2, .factor-article h3');
    animateElements.forEach(el => {
        observer.observe(el);
    });
}

// ===== UTILITY FUNCTIONS =====

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}



// ===== CODE SYNTAX HIGHLIGHTING =====
function initCodeHighlighting() {
    // Add copy button to code blocks
    const codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach(codeBlock => {
        const pre = codeBlock.parentElement;
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = 'Copy code';
        
        copyButton.addEventListener('click', function() {
            navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                copyButton.innerHTML = '<i class="fas fa-check"></i>';
                copyButton.style.color = 'var(--secondary-color)';
                
                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                    copyButton.style.color = '';
                }, 2000);
            });
        });
        
        pre.style.position = 'relative';
        pre.appendChild(copyButton);
    });
}

// ===== SEARCH FUNCTIONALITY (Optional) =====
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchResults) return;
    
    const debouncedSearch = debounce(performSearch, 300);
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length > 2) {
            debouncedSearch(query);
        } else {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
        }
    });
    
    function performSearch(query) {
        // Simple client-side search implementation
        const factors = [
            { title: 'Factor 1: Codebase', url: '/factor-01-codebase', description: 'One codebase tracked in revision control, many deploys' },
            { title: 'Factor 2: Dependencies', url: '/factor-02-dependencies', description: 'Explicitly declare and isolate dependencies' },
            // Add more factors as needed
        ];
        
        const results = factors.filter(factor => 
            factor.title.toLowerCase().includes(query.toLowerCase()) ||
            factor.description.toLowerCase().includes(query.toLowerCase())
        );
        
        displaySearchResults(results);
    }
    
    function displaySearchResults(results) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
        } else {
            searchResults.innerHTML = results.map(result => `
                <a href="${result.url}" class="search-result">
                    <div class="search-result-title">${result.title}</div>
                    <div class="search-result-description">${result.description}</div>
                </a>
            `).join('');
        }
        
        searchResults.style.display = 'block';
    }
}

// ===== PERFORMANCE OPTIMIZATIONS =====

// Optimize scroll events
const optimizedScrollHandler = throttle(() => {
    // Combine all scroll-related functions
    if (typeof updateProgress === 'function') updateProgress();
    if (typeof highlightTocLink === 'function') highlightTocLink();
}, 16); // ~60fps

// Replace individual scroll listeners with optimized one
window.addEventListener('scroll', optimizedScrollHandler);

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    // Could send error to analytics service
});

// ===== ACCESSIBILITY ENHANCEMENTS =====
function initAccessibility() {
    // Skip to main content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Keyboard navigation for dropdowns
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
    
    // Focus management for mobile menu
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
                
                // Focus first menu item when opening
                if (navMenu.classList.contains('active')) {
                    const firstLink = navMenu.querySelector('.nav-link');
                    if (firstLink) firstLink.focus();
                }
            }
        });
    }
}

// Initialize accessibility features
document.addEventListener('DOMContentLoaded', initAccessibility);

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initMobileNavigation,
        initTableOfContents,
        initScrollProgress,
        initSmoothScrolling,
        initAnimations,
        debounce,
        throttle
    };
}