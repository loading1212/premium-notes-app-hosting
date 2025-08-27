// Premium Notes App - Main JavaScript File

class PremiumNotesApp {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('premium-notes') || '[]');
        this.currentNote = null;
        this.currentView = 'all-notes';
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.currentLang = localStorage.getItem('appLanguage') || 'tr';
        this.translations = {};

        this.init();
    }

    async init() {
        await this.loadTranslations();
        this.setupEventListeners();
        this.showLoadingScreen();
        this.loadCountriesData();
        this.changeLanguage(this.currentLang);

        // Simulate loading time
        setTimeout(() => {
            this.hideLoadingScreen();
            this.renderNotes();
        }, 1500);
    }

    showLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('main-app').classList.add('hidden');
    }

    hideLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('main-app').classList.remove('hidden');
    }

    deleteNote(id) {
        if (confirm(this.getTranslation("confirmDelete"))) {
            this.notes = this.notes.filter(note => note.id !== id);
            localStorage.setItem("premium-notes", JSON.stringify(this.notes));
            this.renderNotes();
            this.showNotification(this.getTranslation("noteDeletedSuccess"), "success");
        }
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
                const viewName = e.target.closest('[data-view]').dataset.view;
                this.showView(viewName);
                this.setActiveNavItem(e.target.closest('[data-view]'));
            });
        });

        // Note actions
        document.getElementById("new-note-btn").addEventListener("click", () => this.createNewNote());
        document.getElementById("back-btn").addEventListener("click", () => this.showView("all-notes"));
        document.getElementById("save-note-btn").addEventListener("click", () => this.saveCurrentNote());

        // Event delegation for delete buttons
        document.getElementById("notes-grid").addEventListener("click", (e) => {
            const deleteButton = e.target.closest(".delete-note-btn");
            if (deleteButton) {
                e.stopPropagation(); // Prevent note from opening
                const id = parseInt(deleteButton.dataset.id);
                this.deleteNote(id);
            }
        });

        // Settings
        document.getElementById('theme-select').addEventListener('change', (e) => this.changeTheme(e.target.value));
        document.getElementById('language-select').addEventListener('change', (e) => this.changeLanguage(e.target.value));

        // Modal
        document.querySelector('.close-modal').addEventListener('click', () => this.closeSearchModal());
        document.getElementById('search-input').addEventListener('input', (e) => this.searchNotes(e.target.value));

        // Click outside sidebar to close
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const menuBtn = document.getElementById('menu-btn');
            if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                this.toggleSidebar();
            }
        });
    }

    async loadTranslations() {
        try {
            const response = await fetch('translations.json');
            if (!response.ok) {
                throw new Error('Translations not found');
            }
            this.translations = await response.json();
        } catch (error) {
            console.error("Could not load translations:", error);
            // Fallback translations
            this.translations = {
                tr: {
                    "app-title": "Premium Notes", "all-notes": "Tüm Notlar", "favorites": "Favoriler", "recent": "Son Kullanılan", "tasks": "Görevler", "reminders": "Hatırlatmalar", "tags": "Etiketler", "voice-notes": "Sesli Notlar", "countries": "Gelişmiş Ülkeler", "countries-title": "En Gelişmiş 10 Ülke", "new-note": "Yeni Not", "save": "Kaydet", "search": "Ara", "settings": "Ayarlar", "note-title-placeholder": "Not başlığı...", "note-editor-placeholder": "Notunuzu buraya yazın...", "note-tags-placeholder": "Etiket ekle (virgülle ayır)", "search-placeholder": "Notlarda ara...", "dark-theme": "Koyu Tema", "light-theme": "Açık Tema", "auto-theme": "Otomatik", "turkish": "Türkçe", "english": "English", "empty-notes-message": "Henüz not bulunmuyor", "create-first-note": "İlk Notunuzu Oluşturun", "confirmDelete": "Bu notu silmek istediğinizden emin misiniz?", "noteDeletedSuccess": "Not başarıyla silindi!"
                },
                en: {
                    "app-title": "Premium Notes", "all-notes": "All Notes", "favorites": "Favorites", "recent": "Recent", "tasks": "Tasks", "reminders": "Reminders", "tags": "Tags", "voice-notes": "Voice Notes", "countries": "Developed Countries", "countries-title": "Top 10 Developed Countries", "new-note": "New Note", "save": "Save", "search": "Search", "settings": "Settings", "note-title-placeholder": "Note title...", "note-editor-placeholder": "Write your note here...", "note-tags-placeholder": "Add tags (comma separated)", "search-placeholder": "Search in notes...", "dark-theme": "Dark Theme", "light-theme": "Light Theme", "auto-theme": "Auto", "turkish": "Turkish", "english": "English", "empty-notes-message": "No notes yet", "create-first-note": "Create Your First Note", "confirmDelete": "Are you sure you want to delete this note?", "noteDeletedSuccess": "Note deleted successfully!"
                }
            };
        }
    }

    getTranslation(key) {
        return this.translations[this.currentLang]?.[key] || key;
    }

    changeLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('appLanguage', lang);

        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.dataset.translate;
            el.innerText = this.getTranslation(key);
        });

        document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
            const key = el.dataset.translatePlaceholder;
            el.placeholder = this.getTranslation(key);
        });

        // Update view-specific content that might not be visible
        this.renderNotes();
        this.renderCountries();
    }

    loadCountriesData() {
        this.countries = [
            { name: 'Norveç', flag: '🇳🇴', info: 'HDI: 0.957 | Başkent: Oslo' },
            { name: 'İsviçre', flag: '🇨🇭', info: 'HDI: 0.955 | Başkent: Bern' },
            { name: 'İrlanda', flag: '🇮🇪', info: 'HDI: 0.955 | Başkent: Dublin' },
            { name: 'Almanya', flag: '🇩🇪', info: 'HDI: 0.947 | Başkent: Berlin' },
            { name: 'Hong Kong', flag: '🇭🇰', info: 'HDI: 0.949 | Özel İdari Bölge' },
            { name: 'Avustralya', flag: '🇦🇺', info: 'HDI: 0.946 | Başkent: Canberra' },
            { name: 'İzlanda', flag: '🇮🇸', info: 'HDI: 0.949 | Başkent: Reykjavik' },
            { name: 'İsveç', flag: '🇸🇪', info: 'HDI: 0.945 | Başkent: Stockholm' },
            { name: 'Singapur', flag: '🇸🇬', info: 'HDI: 0.939 | Şehir Devleti' },
            { name: 'Hollanda', flag: '🇳🇱', info: 'HDI: 0.944 | Başkent: Amsterdam' }
        ];
    }

    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('active');
    }

    showView(viewName) {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
        }
        this.currentView = viewName;

        if (viewName === 'countries') {
            this.renderCountries();
        } else if (['all-notes', 'favorites', 'recent'].includes(viewName)) {
            this.renderNotes();
        }
    }

    setActiveNavItem(activeItem) {
        document.querySelectorAll('.sidebar-menu a').forEach(item => item.classList.remove('active'));
        activeItem.classList.add('active');
    }

    createNewNote() {
        this.currentNote = {
            id: Date.now(),
            title: '',
            content: '',
            tags: [],
            reminder: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isFavorite: false
        };
        this.showNoteEditor(this.currentNote);
    }

    showNoteEditor(note) {
        this.currentNote = note;
        this.showView('editor');
        document.getElementById('note-title').value = note.title || '';
        document.getElementById('note-editor').innerHTML = note.content || '';
        document.getElementById('note-tags').value = note.tags ? note.tags.join(', ') : '';
        if (note.reminder) {
            document.getElementById('note-reminder').value = new Date(note.reminder).toISOString().slice(0, 16);
        }
    }

    saveCurrentNote(autoSave = false) {
        if (!this.currentNote) return;

        const title = document.getElementById('note-title').value.trim();
        const content = document.getElementById('note-editor').innerHTML.trim();
        const tags = document.getElementById('note-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const reminder = document.getElementById('note-reminder').value;

        if (!title && !content && !autoSave) {
            this.showNotification(this.getTranslation('emptyNoteError'), 'error');
            return;
        }

        this.currentNote.title = title || this.getTranslation('untitledNote');
        this.currentNote.content = content;
        this.currentNote.tags = tags;
        this.currentNote.reminder = reminder || null;
        this.currentNote.updatedAt = new Date().toISOString();

        const existingIndex = this.notes.findIndex(note => note.id === this.currentNote.id);
        if (existingIndex >= 0) {
            this.notes[existingIndex] = this.currentNote;
        } else {
            this.notes.push(this.currentNote);
        }

        localStorage.setItem('premium-notes', JSON.stringify(this.notes));

        if (!autoSave) {
            this.showNotification(this.getTranslation('noteSavedSuccess'), 'success');
        }
    }

    renderNotes() {
        const notesGrid = document.getElementById('notes-grid');
        notesGrid.innerHTML = '';

        let filteredNotes = [...this.notes];
        // Sorting and filtering logic here...

        if (filteredNotes.length === 0) {
            notesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-sticky-note"></i>
                    <p data-translate="empty-notes-message">${this.getTranslation('empty-notes-message')}</p>
                    <button class="primary-btn" id="create-first-note-btn">
                        <i class="fas fa-plus"></i> <span data-translate="create-first-note">${this.getTranslation('create-first-note')}</span>
                    </button>
                </div>`;
            document.getElementById('create-first-note-btn').addEventListener('click', () => this.createNewNote());
            return;
        }

        filteredNotes.forEach(note => {
            const noteCard = document.createElement('div');
            noteCard.className = 'note-card';
            noteCard.addEventListener('click', () => this.showNoteEditor(note));

            const preview = this.stripHtml(note.content).substring(0, 150) + '...';
            const formattedDate = new Date(note.updatedAt).toLocaleDateString(this.currentLang);

            noteCard.innerHTML = `
                <div class="note-card-header">
                    <h3 class="note-title">${note.title}</h3>
                    <div class="note-actions">
                        <button class="icon-btn delete-note-btn" data-id="${note.id}"><i class="fas fa-trash"></i></button>
                        <span class="note-date">${formattedDate}</span>
                    </div>
                </div>
                <div class="note-preview">${preview}</div>
                <div class="note-tags">
                    ${note.tags.map(tag => `<span class="note-tag">${tag}</span>`).join('')}
                </div>
            `;
            notesGrid.appendChild(noteCard);
        });
    }

    renderCountries() {
        const countriesGrid = document.getElementById('countries-grid');
        countriesGrid.innerHTML = '';
        this.countries.forEach(country => {
            const countryCard = document.createElement('div');
            countryCard.className = 'country-card';
            countryCard.innerHTML = `
                <div class="country-flag">${country.flag}</div>
                <h3 class="country-name">${country.name}</h3>
                <p class="country-info">${country.info}</p>
            `;
            countriesGrid.appendChild(countryCard);
        });
    }

    stripHtml(html) {
        let doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // Other methods like openSearchModal, closeSearchModal, changeTheme etc.
    openSearchModal() { document.getElementById('search-modal').style.display = 'flex'; }
    closeSearchModal() { document.getElementById('search-modal').style.display = 'none'; }
    changeTheme(theme) { 
        document.body.className = theme === 'auto' ? '' : `${theme}-theme`;
        localStorage.setItem('appTheme', theme);
     }
}

const app = new PremiumNotesApp();

