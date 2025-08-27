class PremiumNotesApp {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem("premium-notes") || "[]");
        this.currentNote = null;
        this.currentView = "all-notes";
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.currentLang = localStorage.getItem("app-language") || "tr"; // Dil ayarını kaydet
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTranslations();
        this.applyTranslations(); // Çevirileri uygula
        this.showLoadingScreen();
        this.loadCountriesData();
        
        // Simulate loading time
        setTimeout(() => {
            this.hideLoadingScreen();
            this.renderNotes();
        }, 2000);
    }

    showLoadingScreen() {
        document.getElementById("loading-screen").style.display = "flex";
        document.getElementById("main-app").classList.add("hidden");
    }

    hideLoadingScreen() {
        document.getElementById("loading-screen").style.display = "none";
        document.getElementById("main-app").classList.remove("hidden");
    }

    setupEventListeners() {
        // Navigation
        document.getElementById("menu-btn").addEventListener("click", () => this.toggleSidebar());
        document.getElementById("search-btn").addEventListener("click", () => this.openSearchModal());
        document.getElementById("settings-btn").addEventListener("click", () => this.showView("settings"));
        
        // Sidebar navigation
        document.querySelectorAll("[data-view]").forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                this.showView(e.target.closest("[data-view]").dataset.view);
                this.setActiveNavItem(e.target.closest("[data-view]"));
            });
        });

        // Note actions
        document.getElementById("new-note-btn").addEventListener("click", () => this.createNewNote());
        document.getElementById("back-btn").addEventListener("click", () => this.showView("all-notes"));
        document.getElementById("save-note-btn").addEventListener("click", () => this.saveCurrentNote());
        
        // Editor toolbar
        document.querySelectorAll(".toolbar-btn").forEach(btn => {
            btn.addEventListener("click", (e) => this.executeCommand(e.target.dataset.command));
        });
        
        document.getElementById("font-size").addEventListener("change", (e) => {
            document.execCommand("fontSize", false, "7");
            const fontElements = document.querySelectorAll("font[size=\"7\"]");
            fontElements.forEach(el => {
                el.removeAttribute("size");
                el.style.fontSize = e.target.value;
            });
        });

        // Voice recording
        document.getElementById("voice-record-btn").addEventListener("click", () => this.toggleVoiceRecording());
        
        // Image upload
        document.getElementById("image-upload-btn").addEventListener("click", () => this.uploadImage());

        // Settings
        document.getElementById("theme-select").addEventListener("change", (e) => this.changeTheme(e.target.value));
        document.getElementById("language-select").addEventListener("change", (e) => this.changeLanguage(e.target.value));
        
        // Toggle buttons
        document.querySelectorAll(".toggle-btn").forEach(btn => {
            btn.addEventListener("click", (e) => e.currentTarget.classList.toggle("active"));
        });

        // Modal
        document.querySelector(".close-modal").addEventListener("click", () => this.closeSearchModal());
        document.getElementById("search-input").addEventListener("input", (e) => this.searchNotes(e.target.value));

        // Click outside sidebar to close
        document.addEventListener("click", (e) => {
            const sidebar = document.getElementById("sidebar");
            const menuBtn = document.getElementById("menu-btn");
            if (!sidebar.contains(e.target) && !menuBtn.contains(e.target) && sidebar.classList.contains("active")) {
                sidebar.classList.remove("active");
            }
        });

        // Auto-save
        setInterval(() => {
            if (this.currentNote && document.getElementById("editor-view").classList.contains("active")) {
                this.saveCurrentNote(true);
            }
        }, 30000); // Auto-save every 30 seconds
    }

    loadTranslations() {
        this.translations = {
            tr: {
                "app-title": "Premium Notlar",
                "all-notes": "Tüm Notlar",
                "favorites": "Favoriler",
                "recent": "Son Kullanılan",
                "tasks": "Görevler",
                "reminders": "Hatırlatmalar",
                "tags": "Etiketler",
                "voice-notes": "Sesli Notlar",
                "countries": "Gelişmiş Ülkeler",
                "new-note": "Yeni Not",
                "save": "Kaydet",
                "search": "Ara",
                "settings": "Ayarlar",
                "theme": "Tema",
                "dark-theme": "Koyu Tema",
                "light-theme": "Açık Tema",
                "auto-theme": "Otomatik",
                "language": "Dil",
                "cloud-sync": "Bulut Senkronizasyonu",
                "encryption": "Şifreleme",
                "notifications": "Hatırlatma Bildirimleri",
                "note-title-placeholder": "Not başlığı...",
                "note-editor-placeholder": "Notunuzu buraya yazın...",
                "add-tag-placeholder": "Etiket ekle (virgülle ayır)",
                "search-notes-placeholder": "Notlarda ara...",
                "no-notes-yet": "Henüz not bulunmuyor",
                "create-first-note": "İlk Notunuzu Oluşturun",
                "notes-section": "Notlar",
                "organization-section": "Organizasyon",
                "other-section": "Diğer",
                "view-header-all-notes": "Tüm Notlar",
                "view-header-countries": "En Gelişmiş 10 Ülke",
                "view-header-settings": "Ayarlar",
                "appearance-settings": "Görünüm",
                "sync-settings": "Senkronizasyon",
                "notification-settings": "Bildirimler",
                "back-button": "Geri",
                "voice-record-button": "Ses Kaydı",
                "image-upload-button": "Resim Yükle",
                "delete-note-button": "Notu Sil"
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
                "new-note": "New Note",
                "save": "Save",
                "search": "Search",
                "settings": "Settings",
                "theme": "Theme",
                "dark-theme": "Dark Theme",
                "light-theme": "Light Theme",
                "auto-theme": "Auto",
                "language": "Language",
                "cloud-sync": "Cloud Synchronization",
                "encryption": "Encryption",
                "notifications": "Reminder Notifications",
                "note-title-placeholder": "Note title...",
                "note-editor-placeholder": "Write your note here...",
                "add-tag-placeholder": "Add tags (comma separated)",
                "search-notes-placeholder": "Search in notes...",
                "no-notes-yet": "No notes yet",
                "create-first-note": "Create Your First Note",
                "notes-section": "Notes",
                "organization-section": "Organization",
                "other-section": "Other",
                "view-header-all-notes": "All Notes",
                "view-header-countries": "Top 10 Developed Countries",
                "view-header-settings": "Settings",
                "appearance-settings": "Appearance",
                "sync-settings": "Synchronization",
                "notification-settings": "Notifications",
                "back-button": "Back",
                "voice-record-button": "Voice Record",
                "image-upload-button": "Image Upload",
                "delete-note-button": "Delete Note"
            }
        };
    }

    applyTranslations() {
        const lang = this.currentLang;
        const t = this.translations[lang];

        // Update static texts
        document.querySelector(".app-title").textContent = t["app-title"];
        document.querySelector("#new-note-btn").querySelector("span").textContent = t["new-note"];
        document.querySelector("#save-note-btn").querySelector("span").textContent = t["save"];
        document.querySelector("#search-input").placeholder = t["search-notes-placeholder"];
        document.querySelector("#note-title").placeholder = t["note-title-placeholder"];
        document.querySelector("#note-editor").placeholder = t["note-editor-placeholder"];
        document.querySelector("#note-tags").placeholder = t["add-tag-placeholder"];

        // Update sidebar links
        document.querySelector("[data-view='all-notes']").querySelector("span").textContent = t["all-notes"];
        document.querySelector("[data-view='favorites']").querySelector("span").textContent = t["favorites"];
        document.querySelector("[data-view='recent']").querySelector("span").textContent = t["recent"];
        document.querySelector("[data-view='tasks']").querySelector("span").textContent = t["tasks"];
        document.querySelector("[data-view='reminders']").querySelector("span").textContent = t["reminders"];
        document.querySelector("[data-view='tags']").querySelector("span").textContent = t["tags"];
        document.querySelector("[data-view='voice-notes']").querySelector("span").textContent = t["voice-notes"];
        document.querySelector("[data-view='countries']").querySelector("span").textContent = t["countries"];

        // Update settings view
        document.querySelector("#theme-select option[value='dark']").textContent = t["dark-theme"];
        document.querySelector("#theme-select option[value='light']").textContent = t["light-theme"];
        document.querySelector("#theme-select option[value='auto']").textContent = t["auto-theme"];
        document.querySelector("#language-select option[value='tr']").textContent = "Türkçe"; // Keep Turkish as is
        document.querySelector("#language-select option[value='en']").textContent = "English"; // Keep English as is

        // Update section titles
        document.querySelector(".sidebar-section h3:nth-of-type(1)").textContent = t["notes-section"];
        document.querySelector(".sidebar-section h3:nth-of-type(2)").textContent = t["organization-section"];
        document.querySelector(".sidebar-section h3:nth-of-type(3)").textContent = t["other-section"];
        document.querySelector("#notes-view .view-header h2").textContent = t["view-header-all-notes"];
        document.querySelector("#countries-view .view-header h2").textContent = t["view-header-countries"];
        document.querySelector("#settings-view .view-header h2").textContent = t["view-header-settings"];
        document.querySelector("#settings-view h3:nth-of-type(1)").textContent = t["appearance-settings"];
        document.querySelector("#settings-view h3:nth-of-type(2)").textContent = t["sync-settings"];
        document.querySelector("#settings-view h3:nth-of-type(3)").textContent = t["notification-settings"];

        // Update specific labels
        document.querySelector("label[for='theme-select']").textContent = t["theme"];
        document.querySelector("label[for='language-select']").textContent = t["language"];
        document.querySelector("label[for='cloud-sync-btn']").textContent = t["cloud-sync"];
        document.querySelector("label[for='encryption-btn']").textContent = t["encryption"];
        document.querySelector("label[for='notifications-btn']").textContent = t["notifications"];
        document.querySelector("label[for='note-tags']").textContent = t["tags"];
        document.querySelector("label[for='note-reminder']").textContent = t["reminders"];

        // Update buttons in editor view
        document.querySelector("#back-btn").title = t["back-button"];
        document.querySelector("#voice-record-btn").title = t["voice-record-button"];
        document.querySelector("#image-upload-btn").title = t["image-upload-button"];
        document.querySelector("#save-note-btn").title = t["save"];

        // Update search modal
        document.querySelector("#search-modal h3").textContent = t["search"];

        // Update initial note creation message
        const noNotesMessage = document.querySelector("#notes-grid");
        if (noNotesMessage && noNotesMessage.children.length === 0) {
            noNotesMessage.innerHTML = `
                <div class="no-notes-message">
                    <i class="fas fa-sticky-note"></i>
                    <p>${t["no-notes-yet"]}</p>
                    <button class="primary-btn" id="create-first-note-btn">
                        <i class="fas fa-plus"></i> ${t["create-first-note"]}
                    </button>
                </div>
            `;
            document.getElementById("create-first-note-btn").addEventListener("click", () => this.createNewNote());
        }
    }

    changeLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem("app-language", lang);
        this.applyTranslations();
    }

    loadCountriesData() {
        this.countries = [
            { name: "Norveç", flag: "🇳🇴", info: "HDI: 0.957 | Başkent: Oslo" },
            { name: "İsviçre", flag: "🇨🇭", info: "HDI: 0.955 | Başkent: Bern" },
            { name: "İrlanda", flag: "🇮🇪", info: "HDI: 0.955 | Başkent: Dublin" },
            { name: "Almanya", flag: "🇩🇪", info: "HDI: 0.947 | Başkent: Berlin" },
            { name: "Hong Kong", flag: "🇭🇰", info: "HDI: 0.949 | Özel İdari Bölge" },
            { name: "Avustralya", flag: "🇦🇺", info: "HDI: 0.946 | Başkent: Canberra" },
            { name: "İzlanda", flag: "🇮🇸", info: "HDI: 0.949 | Başkent: Reykjavik" },
            { name: "İsveç", flag: "🇸🇪", info: "HDI: 0.945 | Başkent: Stockholm" },
            { name: "Singapur", flag: "🇸🇬", info: "HDI: 0.939 | Şehir Devleti" },
            { name: "Hollanda", flag: "🇳🇱", info: "HDI: 0.944 | Başkent: Amsterdam" }
        ];
    }

    toggleSidebar() {
        document.getElementById("sidebar").classList.toggle("active");
    }

    showView(viewName) {
        // Hide all views
        document.querySelectorAll(".view").forEach(view => {
            view.classList.remove("active");
        });
        
        // Show selected view
        const targetView = document.getElementById(`${viewName}-view`) || document.getElementById("notes-view");
        targetView.classList.add("active");
        
        this.currentView = viewName;
        
        // Load view-specific content
        switch(viewName) {
            case "countries":
                this.renderCountries();
                break;
            case "all-notes":
            case "favorites":
            case "recent":
                this.renderNotes();
                break;
            case "settings":
                // Set language select to current language
                document.getElementById("language-select").value = this.currentLang;
                break;
        }
    }

    setActiveNavItem(activeItem) {
        document.querySelectorAll(".sidebar-menu a").forEach(item => {
            item.classList.remove("active");
        });
        activeItem.classList.add("active");
    }

    createNewNote() {
        this.currentNote = {
            id: Date.now(),
            title: "",
            content: "",
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
         
(Content truncated due to size limit. Use page ranges or line ranges to read remaining content)

