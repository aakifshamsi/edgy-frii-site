/**
 * Frii - Edgy URL Shortener
 * Link Shortening Logic
 * 
 * API: https://l.m-space.in/api
 */

// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
    API_BASE_URL: 'https://l.m-space.in/api',
    SITE_HANDLE: 'edgy',  // Site identifier for Frii
    DOMAIN: 'frii.site',
    ANIMATION_DURATION: 300
};

// ========================================
// DOM ELEMENTS
// ========================================
const elements = {
    form: document.getElementById('shortener-form'),
    urlInput: document.getElementById('url-input'),
    slugInput: document.getElementById('slug-input'),
    shortenBtn: document.getElementById('shorten-btn'),
    resultContainer: document.getElementById('result-container'),
    resultSuccess: document.getElementById('result-success'),
    resultError: document.getElementById('result-error'),
    shortUrl: document.getElementById('short-url'),
    copyBtn: document.getElementById('copy-btn'),
    errorMessage: document.getElementById('error-message'),
    adBanner: document.querySelector('.ad-banner'),
    adClose: document.querySelector('.ad-close'),
    mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
    navLinks: document.querySelector('.nav-links'),
    linksCount: document.getElementById('links-count')
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Debounce function for input events
 */
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

/**
 * Validate URL format
 */
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

/**
 * Validate custom slug format
 */
function isValidSlug(string) {
    // Allow letters, numbers, hyphens, and underscores
    // 1-50 characters
    const slugRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_]{0,49}$/;
    return slugRegex.test(string);
}

/**
 * Animate counter
 */
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '💀' : 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
    `;
    
    // Add toast styles if not already in CSS
    if (!document.querySelector('#toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast {
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--bg-secondary);
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 15px 25px;
                border-radius: 50px;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 9999;
                animation: toastSlideUp 0.3s ease;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
            }
            .toast-success { border-color: var(--accent-green); }
            .toast-error { border-color: #ff6666; }
            .toast-info { border-color: var(--accent-cyan); }
            .toast-icon { font-size: 1.3rem; }
            .toast-message { color: var(--text-primary); font-weight: 500; }
            @keyframes toastSlideUp {
                from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'toastSlideUp 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========================================
// API FUNCTIONS
// ========================================

/**
 * Shorten a URL using the M-Space API
 */
async function shortenUrl(url, customSlug = null) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/links`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': getApiKey(),
                'X-Site-Handle': CONFIG.SITE_HANDLE
            },
            body: JSON.stringify({
                url: url,
                customSlug: customSlug || undefined
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to shorten URL');
        }

        return {
            success: true,
            data: data
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get API key from localStorage or use demo key
 */
function getApiKey() {
    // Check if user has an API key stored
    const storedKey = localStorage.getItem('frii_api_key');
    if (storedKey) {
        return storedKey;
    }
    
    // For demo purposes, return a placeholder
    // In production, this should be handled properly
    return 'demo-api-key';
}

// ========================================
// UI FUNCTIONS
// ========================================

/**
 * Show loading state on button
 */
function setLoading(isLoading) {
    if (isLoading) {
        elements.shortenBtn.classList.add('loading');
        elements.shortenBtn.disabled = true;
    } else {
        elements.shortenBtn.classList.remove('loading');
        elements.shortenBtn.disabled = false;
    }
}

/**
 * Show success result
 */
function showSuccess(shortUrl, fullUrl) {
    elements.resultSuccess.style.display = 'flex';
    elements.resultError.style.display = 'none';
    elements.shortUrl.href = fullUrl;
    elements.shortUrl.textContent = fullUrl;
    elements.resultContainer.classList.add('show');
}

/**
 * Show error result
 */
function showError(message) {
    elements.resultError.style.display = 'flex';
    elements.resultSuccess.style.display = 'none';
    elements.errorMessage.textContent = message;
    elements.resultContainer.classList.add('show');
}

/**
 * Hide result
 */
function hideResult() {
    elements.resultContainer.classList.remove('show');
    elements.resultSuccess.style.display = 'none';
    elements.resultError.style.display = 'none';
}

/**
 * Copy to clipboard
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        elements.copyBtn.classList.add('copied');
        showToast('Copied to clipboard! 📋', 'success');
        
        setTimeout(() => {
            elements.copyBtn.classList.remove('copied');
        }, 2000);
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            elements.copyBtn.classList.add('copied');
            showToast('Copied to clipboard! 📋', 'success');
            
            setTimeout(() => {
                elements.copyBtn.classList.remove('copied');
            }, 2000);
        } catch (fallbackErr) {
            showToast('Failed to copy. Try manually selecting and copying.', 'error');
        }
        
        document.body.removeChild(textArea);
    }
}

// ========================================
// EVENT HANDLERS
// ========================================

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const url = elements.urlInput.value.trim();
    const slug = elements.slugInput.value.trim();
    
    // Validate URL
    if (!url) {
        showError('Bruh, enter a URL first 😅');
        return;
    }
    
    if (!isValidUrl(url)) {
        showError('That URL looks sus... Make sure it starts with http:// or https://');
        return;
    }
    
    // Validate slug if provided
    if (slug && !isValidSlug(slug)) {
        showError('Slug can only have letters, numbers, hyphens, and underscores');
        return;
    }
    
    // Hide previous result
    hideResult();
    
    // Show loading state
    setLoading(true);
    
    // Make API request
    const result = await shortenUrl(url, slug);
    
    setLoading(false);
    
    if (result.success) {
        const shortUrl = `${CONFIG.DOMAIN}/${result.data.slug || result.data.shortCode}`;
        showSuccess(shortUrl, result.data.shortUrl || shortUrl);
        showToast('Link shortened successfully! ⚡', 'success');
        
        // Clear form
        elements.urlInput.value = '';
        elements.slugInput.value = '';
        
        // Focus back on URL input for convenience
        setTimeout(() => {
            elements.urlInput.focus();
        }, 100);
    } else {
        showError(result.error || 'Something went wrong. Try again later 💀');
    }
}

/**
 * Handle slug input validation
 */
function handleSlugInput() {
    const slug = elements.slugInput.value.trim();
    
    if (slug && !isValidSlug(slug)) {
        elements.slugInput.style.borderColor = '#ff6666';
    } else {
        elements.slugInput.style.borderColor = '';
    }
}

/**
 * Handle ad banner close
 */
function handleAdClose() {
    if (elements.adBanner) {
        elements.adBanner.style.display = 'none';
        // Remember user closed it
        localStorage.setItem('frii_ad_closed', 'true');
    }
}

/**
 * Handle mobile menu toggle
 */
function handleMobileMenu() {
    elements.navLinks.classList.toggle('active');
    elements.mobileMenuBtn.classList.toggle('active');
}

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize the application
 */
function init() {
    // Form submission
    elements.form.addEventListener('submit', handleFormSubmit);
    
    // Slug input validation
    const debouncedSlugValidation = debounce(handleSlugInput, 300);
    elements.slugInput.addEventListener('input', debouncedSlugValidation);
    
    // Copy button
    elements.copyBtn.addEventListener('click', () => {
        const url = elements.shortUrl.textContent;
        if (url) {
            copyToClipboard(url);
        }
    });
    
    // Ad banner close
    if (elements.adClose) {
        elements.adClose.addEventListener('click', handleAdClose);
        
        // Check if user previously closed it
        if (localStorage.getItem('frii_ad_closed') === 'true') {
            elements.adBanner.style.display = 'none';
        }
    }
    
    // Mobile menu
    if (elements.mobileMenuBtn) {
        elements.mobileMenuBtn.addEventListener('click', handleMobileMenu);
    }
    
    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            elements.navLinks.classList.remove('active');
            elements.mobileMenuBtn.classList.remove('active');
        });
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Animate hero stats counter on page load
    if (elements.linksCount) {
        setTimeout(() => {
            animateCounter(elements.linksCount, 2847293);
        }, 500);
    }
    
    // Focus on URL input on page load
    setTimeout(() => {
        elements.urlInput.focus();
    }, 1000);
    
    // Console easter egg
    console.log('%c⚡ FRII', 'font-size: 50px; font-weight: bold; color: #ff00ff;');
    console.log('%cShorten your links. Keep your dignity? Nah. 💀', 'font-size: 16px; color: #00ffff;');
    console.log('%cAPI: ' + CONFIG.API_BASE_URL, 'font-size: 12px; color: #666;');
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ========================================
// EXPORT FOR TESTING (if needed)
// ========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        shortenUrl,
        isValidUrl,
        isValidSlug,
        CONFIG
    };
}
