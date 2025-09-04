// Premium Notes App - Main JavaScript File

class PremiumNotesApp {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('premium-notes') || '[]');
        this.currentNote = null;
        this.currentView = 'all-notes';
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.currentLanguage = localStorage.getItem('language-preference') || 'tr';

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTranslations();
        this.showLoadingScreen();
        this.loadCountriesData();

        // Simulate loading time
        setTimeout(() => {
            this.hideLoadingScreen();
            this.renderNotes();
            this.applyTranslations(); // ilk açılışta dili uygula
        }, 2000);
    }

    showLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('main-app').classList.add('hidden');
    }

    hideLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('main-app').classList.remove('hidden');
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('menu-btn').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('search-btn').addEventListener('click', () => this.openSearchModal());
        document.getElementById('settings-btn').addEventListener('click', () => this.showView('settings'));

        // Sidebar navigation
        document.querySelectorAll('[data-view]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showView(e.target.closest('[data-view]').dataset.view);
                this.setActiveNavItem(e.target.closest('[data-view]'));
            });
        });

        // Note actions
        document.getElementById('new-note-btn').addEventListener('click', () => this.createNewNote());
        document.getElementById('back-btn').addEventListener('click', () => this.showView('all-notes'));
        document.getElementById('save-note-btn').addEventListener('click', () => this.saveCurrentNote());

        // Editor toolbar
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.executeCommand(e.target.dataset.command));
        });

        document.getElementById('font-size').addEventListener('change', (e) => {
            document.execCommand('fontSize', false, '7');
            const fontElements = document.querySelectorAll('font[size="7"]');
            fontElements.forEach(el => {
                el.removeAttribute('size');
                el.style.fontSize = e.target.value;
            });
        });

        // Voice recording
        document.getElementById('voice-record-btn').addEventListener('click', () => this.toggleVoiceRecording());

        // Image upload
        document.getElementById('image-upload-btn').addEventListener('click', () => this.uploadImage());

        // Settings
        document.getElementById('theme-select').addEventListener('change', (e) => this.changeTheme(e.target.value));
        document.getElementById('language-select').addEventListener('change', (e) => this.changeLanguage(e.target.value));

        // Toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => btn.classList.toggle('active'));
        });

        // Modal
        document.querySelector('.close-modal').addEventListener('click', () => this.closeSearchModal());
        document.getElementById('search-input').addEventListener('input', (e) => this.searchNotes(e.target.value));

        // Click outside sidebar to close
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const menuBtn = document.getElementById('menu-btn');
            if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });

        // Auto-save
        setInterval(() => {
            if (this.currentNote && document.getElementById('editor-view').classList.contains('active')) {
                this.saveCurrentNote(true);
            }
        }, 30000); // Auto-save every 30 seconds
    }

    loadTranslations() {
        this.translations = {
            tr: {
                'all-notes': 'Tüm Notlar',
                'favorites': 'Favoriler',
                'recent': 'Son Kullanılan',
                'tasks': 'Görevler',
                'reminders': 'Hatırlatmalar',
                'tags': 'Etiketler',
                'voice-notes': 'Sesli Notlar',
                'countries': 'Gelişmiş Ülkeler',
                'new-note': 'Yeni Not',
                'save': 'Kaydet',
                'search': 'Ara',
                'settings': 'Ayarlar'
            },
            en: {
                'all-notes': 'All Notes',
                'favorites': 'Favorites',
                'recent': 'Recent',
                'tasks': 'Tasks',
                'reminders': 'Reminders',
                'tags': 'Tags',
                'voice-notes': 'Voice Notes',
                'countries': 'Developed Countries',
                'new-note': 'New Note',
                'save': 'Save',
                'search': 'Search',
                'settings': 'Settings'
            }
        };
    }

    applyTranslations() {
        const texts = this.translations[this.currentLanguage];
        if (!texts) return;

        // Menüdeki öğeler için
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (texts[key]) {
                el.textContent = texts[key];
            }
        });
    }

    changeLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('language-preference', lang);
        this.applyTranslations();
        this.showNotification(lang === 'tr' ? 'Dil Türkçe olarak değiştirildi' : 'Language changed to English', 'success');
    }

    // ... (senin kalan tüm kodun aynı kalacak)
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PremiumNotesApp();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    // Load saved theme
    const savedTheme = localStorage.getItem('theme-preference') || 'dark';
    document.getElementById('theme-select').value = savedTheme;
    window.app.changeTheme(savedTheme);

    // Load saved language
    const savedLang = localStorage.getItem('language-preference') || 'tr';
    document.getElementById('language-select').value = savedLang;
    window.app.changeLanguage(savedLang);
});

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .empty-state {
        text-align: center;
        padding: 60px 20px;
        grid-column: 1 / -1;
    }
    
    .audio-note {
        margin: 10px 0;
        padding: 10px;
        background: var(--bg-tertiary);
        border-radius: 8px;
    }
    
    .image-note {
        margin: 10px 0;
    }
    
    .note-reminder {
        margin-top: 10px;
        padding: 8px;
        background: var(--accent-primary);
        color: white;
        border-radius: 4px;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        gap: 5px;
    }
`;
document.head.appendChild(style);
