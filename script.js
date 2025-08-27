// Premium Notes App - Main JavaScript File

class PremiumNotesApp {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('premium-notes') || '[]');
        this.currentNote = null;
        this.currentView = 'all-notes';
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        
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

    deleteNote(id) {
        if (confirm("Bu notu silmek istediğinizden emin misiniz?")) {
            this.notes = this.notes.filter(note => note.id !== id);
            localStorage.setItem("premium-notes", JSON.stringify(this.notes));
            this.renderNotes();
            this.showNotification("Not başarıyla silindi!", "success");
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
                this.showView(e.target.closest('[data-view]').dataset.view);
                this.setActiveNavItem(e.target.closest('[data-view]'));
            });
        });

        // Note actions
        document.getElementById("new-note-btn").addEventListener("click", () => this.createNewNote());
        document.getElementById("back-btn").addEventListener("click", () => this.showView("all-notes"));
        document.getElementById("save-note-btn").addEventListener("click", () => this.saveCurrentNote());
        
        // Event delegation for delete buttons
        document.getElementById("notes-grid").addEventListener("click", (e) => {
            if (e.target.closest(".delete-note-btn")) {
                const id = parseInt(e.target.closest(".delete-note-btn").dataset.id);
                this.deleteNote(id);
            }
        });
        
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
                "app-title": "Premium Notes",
                "all-notes": "Tüm Notlar",
                "favorites": "Favoriler",
                "recent": "Son Kullanılan",
                "tasks": "Görevler",
                "reminders": "Hatırlatmalar",
                "tags": "Etiketler",
                "voice-notes": "Sesli Notlar",
                "countries": "Gelişmiş Ülkeler",
                "countries-title": "En Gelişmiş 10 Ülke",
                "new-note": "Yeni Not",
                "save": "Kaydet",
                "search": "Ara",
                "settings": "Ayarlar",
                "note-title-placeholder": "Not başlığı...",
                "note-editor-placeholder": "Notunuzu buraya yazın...",
                "note-tags-placeholder": "Etiket ekle (virgülle ayır)",
                "search-placeholder": "Notlarda ara...",
                "dark-theme": "Koyu Tema",
                "light-theme": "Açık Tema",
                "auto-theme": "Otomatik",
                "turkish": "Türkçe",
                "english": "English",
                "empty-notes-message": "Henüz not bulunmuyor",
                "create-first-note": "İlk Notunuzu Oluşturun"
            },
            en: {
                "app-title": "Premium Notes",
                "all-notes": "All Notes",
                "favorites": "Favorites",
                "recent": "Recent",
                "tasks": "Tasks",
                "reminders": "Reminders",
                "tags": "Tags",
                "voice-notes": "Voice Notes",
                "countries": "Developed Countries",
                "countries-title": "Top 10 Developed Countries",
                "new-note": "New Note",
                "save": "Save",
                "search": "Search",
                "settings": "Settings",
                "note-title-placeholder": "Note title...",
                "note-editor-placeholder": "Write your note here...",
                "note-tags-placeholder": "Add tags (comma separated)",
                "search-placeholder": "Search in notes...",
                "dark-theme": "Dark Theme",
                "light-theme": "Light Theme",
                "auto-theme": "Auto",
                "turkish": "Turkish",
                "english": "English",
                "empty-notes-message": "No notes yet",
                "create-first-note": "Create Your First Note"
            }
        };
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
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show selected view
        const targetView = document.getElementById(`${viewName}-view`) || document.getElementById('notes-view');
        targetView.classList.add('active');
        
        this.currentView = viewName;
        
        // Load view-specific content
        switch(viewName) {
            case 'countries':
                this.renderCountries();
                break;
            case 'all-notes':
            case 'favorites':
            case 'recent':
                this.renderNotes();
                break;
        }
    }

    setActiveNavItem(activeItem) {
        document.querySelectorAll('.sidebar-menu a').forEach(item => {
            item.classList.remove('active');
        });
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
        
        this.showNoteEditor();
    }

    showNoteEditor(note = null) {
        if (note) {
            this.currentNote = note;
        }
        
        this.showView('editor');
        
        // Populate editor
        document.getElementById('note-title').value = this.currentNote.title || '';
        document.getElementById('note-editor').innerHTML = this.currentNote.content || '';
        document.getElementById('note-tags').value = this.currentNote.tags ? this.currentNote.tags.join(', ') : '';
        
        if (this.currentNote.reminder) {
            const reminderDate = new Date(this.currentNote.reminder);
            document.getElementById('note-reminder').value = reminderDate.toISOString().slice(0, 16);
        }
        
        // Focus on title if new note
        if (!this.currentNote.title) {
            document.getElementById('note-title').focus();
        }
    }

    saveCurrentNote(autoSave = false) {
        if (!this.currentNote) return;
        
        const title = document.getElementById('note-title').value.trim();
        const content = document.getElementById('note-editor').innerHTML.trim();
        const tags = document.getElementById('note-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const reminder = document.getElementById('note-reminder').value;
        
        if (!title && !content) {
            if (!autoSave) {
                this.showNotification('Not başlığı veya içerik boş olamaz!', 'error');
            }
            return;
        }
        
        this.currentNote.title = title || 'Başlıksız Not';
        this.currentNote.content = content;
        this.currentNote.tags = tags;
        this.currentNote.reminder = reminder || null;
        this.currentNote.updatedAt = new Date().toISOString();
        
        // Add or update note
        const existingIndex = this.notes.findIndex(note => note.id === this.currentNote.id);
        if (existingIndex >= 0) {
            this.notes[existingIndex] = this.currentNote;
        } else {
            this.notes.push(this.currentNote);
        }
        
        // Save to localStorage
        localStorage.setItem('premium-notes', JSON.stringify(this.notes));
        
        // Set reminder if specified
        if (this.currentNote.reminder) {
            this.setReminder(this.currentNote);
        }
        
        if (!autoSave) {
            this.showNotification('Not başarıyla kaydedildi!', 'success');
        }
    }

    renderNotes() {
        const notesGrid = document.getElementById('notes-grid');
        notesGrid.innerHTML = '';
        
        let filteredNotes = [...this.notes];
        
        // Filter based on current view
        switch(this.currentView) {
            case 'favorites':
                filteredNotes = filteredNotes.filter(note => note.isFavorite);
                break;
            case 'recent':
                filteredNotes = filteredNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 10);
                break;
        }
        
        if (filteredNotes.length === 0) {
            notesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-sticky-note" style="font-size: 4rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-muted); font-size: 1.1rem;">Henüz not bulunmuyor</p>
                    <button class="primary-btn" onclick="app.createNewNote()" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> İlk Notunuzu Oluşturun
                    </button>
                </div>
            `;
            return;
        }
        
        filteredNotes.forEach(note => {
            const noteCard = document.createElement('div');
            noteCard.className = 'note-card';
            noteCard.onclick = () => this.showNoteEditor(note);
            
            const preview = this.stripHtml(note.content).substring(0, 150) + (note.content.length > 150 ? '...' : '');
            const formattedDate = new Date(note.updatedAt).toLocaleDateString('tr-TR');
            
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
                    ${note.tags.map(tag => `<span class="note-tag">${tag}</span>`).join("")}
                </div>
                ${note.reminder ? `<div class="note-reminder"><i class="fas fa-bell"></i> ${new Date(note.reminder).toLocaleString("tr-TR")}</div>` : ""}
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

    executeCommand(command) {
        document.execCommand(command, false, null);
        document.getElementById('note-editor').focus();
    }

    async toggleVoiceRecording() {
        const btn = document.getElementById('voice-record-btn');
        
        if (!this.isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];
                
                this.mediaRecorder.ondataavailable = (event) => {
                    this.audioChunks.push(event.data);
                };
                
                this.mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    this.insertAudioIntoNote(audioUrl);
                };
                
                this.mediaRecorder.start();
                this.isRecording = true;
                btn.innerHTML = '<i class="fas fa-stop"></i>';
                btn.style.backgroundColor = 'var(--error)';
                
                this.showNotification('Ses kaydı başladı...', 'info');
            } catch (error) {
                this.showNotification('Mikrofon erişimi reddedildi!', 'error');
            }
        } else {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
            btn.innerHTML = '<i class="fas fa-microphone"></i>';
            btn.style.backgroundColor = '';
            
            this.showNotification('Ses kaydı tamamlandı!', 'success');
        }
    }

    insertAudioIntoNote(audioUrl) {
        const editor = document.getElementById('note-editor');
        const audioElement = `<div class="audio-note"><audio controls src="${audioUrl}"></audio></div>`;
        editor.innerHTML += audioElement;
    }

    uploadImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = `<div class="image-note"><img src="${e.target.result}" style="max-width: 100%; border-radius: 8px; margin: 10px 0;"></div>`;
                    document.getElementById('note-editor').innerHTML += img;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    setReminder(note) {
        const reminderTime = new Date(note.reminder).getTime();
        const now = Date.now();
        
        if (reminderTime > now) {
            const timeout = reminderTime - now;
            setTimeout(() => {
                this.showNotification(`Hatırlatma: ${note.title}`, 'info');
                
                // Browser notification if permission granted
                if (Notification.permission === 'granted') {
                    new Notification('Premium Notes Hatırlatma', {
                        body: note.title,
                        icon: '/favicon.ico'
                    });
                }
            }, timeout);
        }
    }

    openSearchModal() {
        document.getElementById('search-modal').classList.add('active');
        document.getElementById('search-input').focus();
    }

    closeSearchModal() {
        document.getElementById('search-modal').classList.remove('active');
        document.getElementById('search-input').value = '';
        document.getElementById('search-results').innerHTML = '';
    }

    searchNotes(query) {
        const results = document.getElementById('search-results');
        results.innerHTML = '';
        
        if (!query.trim()) return;
        
        const filteredNotes = this.notes.filter(note => 
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            this.stripHtml(note.content).toLowerCase().includes(query.toLowerCase()) ||
            note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
        
        filteredNotes.forEach(note => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.onclick = () => {
                this.closeSearchModal();
                this.showNoteEditor(note);
            };
            
            const preview = this.stripHtml(note.content).substring(0, 100) + '...';
            
            resultItem.innerHTML = `
                <div class="search-result-title">${note.title}</div>
                <div class="search-result-preview">${preview}</div>
            `;
            
            results.appendChild(resultItem);
        });
        
        if (filteredNotes.length === 0) {
            results.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Sonuç bulunamadı</div>';
        }
    }

    changeTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else if (theme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            // Auto theme based on system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.documentElement.removeAttribute('data-theme');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
            }
        }
        
        localStorage.setItem('theme-preference', theme);
    }

    changeLanguage(lang) {
        localStorage.setItem("language-preference", lang);
        this.updateUIForLanguage(lang);
        this.showNotification("Dil başarıyla değiştirildi!", "success");
    }

    updateUIForLanguage(lang) {
        // Update header
        document.querySelector(".app-title").textContent = this.translations[lang]["app-title"];
        document.getElementById("new-note-btn").querySelector("span").textContent = this.translations[lang]["new-note"];
        document.getElementById("save-note-btn").querySelector("span").textContent = this.translations[lang]["save"];

        // Update sidebar
        document.querySelector("[data-view=\"all-notes\"]").textContent = this.translations[lang]["all-notes"];
        document.querySelector("[data-view=\"favorites\"]").textContent = this.translations[lang]["favorites"];
        document.querySelector("[data-view=\"recent\"]").textContent = this.translations[lang]["recent"];
        document.querySelector("[data-view=\"tasks\"]").textContent = this.translations[lang]["tasks"];
        document.querySelector("[data-view=\"reminders\"]").textContent = this.translations[lang]["reminders"];
        document.querySelector("[data-view=\"tags\"]").textContent = this.translations[lang]["tags"];
        document.querySelector("[data-view=\"voice-notes\"]").textContent = this.translations[lang]["voice-notes"];
        document.querySelector("[data-view=\"countries\"]").textContent = this.translations[lang]["countries"];

        // Update view headers
        document.querySelector("#notes-view h2").textContent = this.translations[lang]["all-notes"];
        document.querySelector("#countries-view h2").textContent = this.translations[lang]["countries-title"];
        document.querySelector("#settings-view h2").textContent = this.translations[lang]["settings"];

        // Update placeholders
        document.getElementById("note-title").placeholder = this.translations[lang]["note-title-placeholder"];
        document.getElementById("note-editor").placeholder = this.translations[lang]["note-editor-placeholder"];
        document.getElementById("note-tags").placeholder = this.translations[lang]["note-tags-placeholder"];
        document.getElementById("search-input").placeholder = this.translations[lang]["search-placeholder"];

        // Update settings labels
        document.querySelector("#theme-select option[value=\"dark\"]").textContent = this.translations[lang]["dark-theme"];
        document.querySelector("#theme-select option[value=\"light\"]").textContent = this.translations[lang]["light-theme"];
        document.querySelector("#theme-select option[value=\"auto\"]").textContent = this.translations[lang]["auto-theme"];
        document.querySelector("#language-select option[value=\"tr\"]").textContent = this.translations[lang]["turkish"];
        document.querySelector("#language-select option[value=\"en\"]").textContent = this.translations[lang]["english"];

        // Update empty state message
        const emptyState = document.querySelector("#notes-view .empty-state p");
        if (emptyState) {
            emptyState.textContent = this.translations[lang]["empty-notes-message"];
            document.querySelector("#notes-view .empty-state button").querySelector("span").textContent = this.translations[lang]["create-first-note"];
        }

        // Re-render notes and countries to update their content if needed
        this.renderNotes();
        this.renderCountries();
    }

    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-primary);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        if (type === 'error') {
            notification.style.background = 'var(--error)';
        } else if (type === 'success') {
            notification.style.background = 'var(--success)';
        } else if (type === 'warning') {
            notification.style.background = 'var(--warning)';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
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
    const savedLang = localStorage.getItem("language-preference") || "tr";
    document.getElementById("language-select").value = savedLang;
    window.app.updateUIForLanguage(savedLang);
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



