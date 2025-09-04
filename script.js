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
        this.

    setActiveNavItem(activeItem) {
        document.querySelectorAll('.sidebar-menu a').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    }


    // --- Simple AES-GCM encryption helpers ---
    async getCryptoKey() {
        const pass = localStorage.getItem('encryption-passphrase') || 'premium-notes-default-pass';
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw', enc.encode(pass), {name: 'PBKDF2'}, false, ['deriveKey']
        );
        const salt = enc.encode('pn-salt-v1'); // fixed salt for demo
        return await window.crypto.subtle.deriveKey(
            {name:'PBKDF2', salt, iterations: 100000, hash: 'SHA-256'},
            keyMaterial,
            {name:'AES-GCM', length: 256},
            false,
            ['encrypt','decrypt']
        );
    }

    async encryptText(plainText) {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const key = await this.getCryptoKey();
        const enc = new TextEncoder();
        const cipher = await window.crypto.subtle.encrypt({name:'AES-GCM', iv}, key, enc.encode(plainText));
        const buff = new Uint8Array(iv.byteLength + cipher.byteLength);
        buff.set(iv,0); buff.set(new Uint8Array(cipher), iv.byteLength);
        // base64 encode
        let binary = ''; buff.forEach(b => binary += String.fromCharCode(b));
        return btoa(binary);
    }

    async decryptText(b64) {
        try {
            const data = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
            const iv = data.slice(0,12);
            const cipher = data.slice(12);
            const key = await this.getCryptoKey();
            const plain = await window.crypto.subtle.decrypt({name:'AES-GCM', iv}, key, cipher);
            return new TextDecoder().decode(plain);
        } catch (e) {
            return ''; // decryption failed
        }
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

    async showNoteEditor(note = null) {
        if (note) {
            this.currentNote = note;
        }
        
        this.showView('editor');
        
        // Populate editor
        document.getElementById('note-title').value = this.currentNote.title || '';
        let contentToShow = this.currentNote.content || '';
        if (this.currentNote.isEncrypted && contentToShow) {
            contentToShow = await this.decryptText(contentToShow);
        }
        document.getElementById('note-editor').innerHTML = contentToShow;
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

    async saveCurrentNote(autoSave = false) {
        if (!this.currentNote) return;
        
        const title = document.getElementById('note-title').value.trim();
        let content = document.getElementById('note-editor').innerHTML.trim();
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
        
        // Encrypt if enabled
        const encryptionEnabled = document.getElementById('encryption-btn')?.classList.contains('active');
        if (encryptionEnabled && content) {
            content = await this.encryptText(content);
            this.currentNote.isEncrypted = true;
        } else {
            this.currentNote.isEncrypted = false;
        }

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
            
            const preview = note.isEncrypted ? (this.translations[this.currentLang]['encrypted-note']) : (this.stripHtml(note.content).substring(0, 150) + (this.stripHtml(note.content).length > 150 ? '...' : ''));
            const formattedDate = new Date(note.updatedAt).toLocaleDateString(this.getLocale());
            
            noteCard.innerHTML = `
                <div class="note-card-header">
                    <h3 class="note-title">${note.title}</h3>
                    <span class="note-date">${formattedDate}</span>
                </div>
                <div class="note-preview">${preview}</div>
                <div class="note-tags">
                    ${note.tags.map(tag => `<span class="note-tag">${tag}</span>`).join('')}
                </div>
                ${note.reminder ? `<div class="note-reminder"><i class="fas fa-bell"></i> ${new Date(note.reminder).toLocaleString('tr-TR')}</div>` : ''}
            `;
            
            notesGrid.appendChild(noteCard);
        });
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

    async changeLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('language-preference', lang);
        this.applyTranslations();
        this.renderNotes();
        this.showNotification(lang === 'tr' ? 'Dil Türkçe olarak ayarlandı' : 'Language set to English', 'success');
    }

    getLocale() {
        return (this.currentLang === 'tr') ? 'tr-TR' : 'en-US';
    }

    applyTranslations() {
        const dict = this.translations[this.currentLang] || {};
        // text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
        });
        // placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dict[key]) el.setAttribute('placeholder', dict[key]);
        });
        // editor pseudo-placeholder
        const editor = document.getElementById('note-editor');
        if (editor && dict['note-placeholder']) {
            editor.setAttribute('placeholder', dict['note-placeholder']);
        }
        // document lang
        document.documentElement.setAttribute('lang', this.currentLang);
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
