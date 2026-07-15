(function () {
    var stateKey = "lawyersQuartersTemplate";
    var briefing = {
        AGC: {
            title: "Port Harcourt hosts the profession's flagship week",
            summary: "Track the theme, plenaries, SIG sessions and networking moments defining AGC 2026."
        },
        Exhibition: {
            title: "Legal commerce moves to the exhibition floor",
            summary: "Booths, legal technology, publishers and corporate partners meet the AGC delegate market."
        },
        Registration: {
            title: "Registration is built for quick confirmation",
            summary: "Delegates can follow the official payment, receipt and confirmation flow from the AGC site."
        },
        Culture: {
            title: "Unbarred and dinner events carry the social calendar",
            summary: "The AGC experience pairs formal sessions with culture, networking and community moments."
        }
    };

    function readState() {
        try {
            return JSON.parse(localStorage.getItem(stateKey)) || { saved: [], reacted: [], analytics: [] };
        } catch (error) {
            return { saved: [], reacted: [], analytics: [] };
        }
    }

    function writeState(nextState) {
        localStorage.setItem(stateKey, JSON.stringify(nextState));
    }

    function toast(message) {
        var node = document.getElementById("lq-toast");
        if (!node) return;
        node.textContent = message;
        node.classList.add("show");
        window.clearTimeout(toast.timer);
        toast.timer = window.setTimeout(function () {
            node.classList.remove("show");
        }, 2600);
    }

    function toggleInArray(list, id) {
        var index = list.indexOf(id);
        if (index >= 0) {
            list.splice(index, 1);
            return false;
        }
        list.push(id);
        return true;
    }

    function updatePressed(selector, values) {
        document.querySelectorAll(selector).forEach(function (button) {
            var active = values.indexOf(button.dataset.id) >= 0;
            button.setAttribute("aria-pressed", active ? "true" : "false");
        });
    }

    function setupDate() {
        var dateNode = document.getElementById("lq-date");
        if (!dateNode) return;
        dateNode.textContent = new Intl.DateTimeFormat("en-NG", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }).format(new Date());
    }

    function setupActions() {
        var state = readState();
        updatePressed(".js-save", state.saved);
        updatePressed(".js-react", state.reacted);

        document.querySelectorAll(".js-save").forEach(function (button) {
            button.addEventListener("click", function () {
                var nextState = readState();
                var added = toggleInArray(nextState.saved, button.dataset.id);
                writeState(nextState);
                updatePressed(".js-save", nextState.saved);
                toast(added ? "Saved to your reading list." : "Removed from your reading list.");
            });
        });

        document.querySelectorAll(".js-react").forEach(function (button) {
            button.addEventListener("click", function () {
                var nextState = readState();
                var added = toggleInArray(nextState.reacted, button.dataset.id);
                var count = button.querySelector("span");
                if (count && added) count.textContent = String(Number(count.textContent || "0") + 1);
                if (count && !added) count.textContent = String(Math.max(0, Number(count.textContent || "0") - 1));
                writeState(nextState);
                updatePressed(".js-react", nextState.reacted);
                toast(added ? "Reaction added." : "Reaction removed.");
            });
        });
    }

    function setupSearch() {
        var form = document.getElementById("lq-search-form");
        var input = document.getElementById("lq-search-input");
        var results = document.getElementById("lq-search-results");
        if (!form || !input || !results) return;

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            var query = input.value.trim().toLowerCase();
            var stories = Array.prototype.slice.call(document.querySelectorAll("[data-story]"));
            var matches = stories.filter(function (story) {
                var haystack = [story.dataset.title, story.dataset.category, story.textContent].join(" ").toLowerCase();
                return query && haystack.indexOf(query) >= 0;
            }).slice(0, 6);

            if (!query) {
                results.innerHTML = "<p>Type a keyword to search the Lawyers' Quarters desk.</p>";
                return;
            }

            if (!matches.length) {
                results.innerHTML = "<p>No matching stories found.</p>";
                return;
            }

            results.innerHTML = matches.map(function (story) {
                var title = story.dataset.title || story.querySelector("h1,h2,h3,h4,h5").textContent;
                var category = story.dataset.category || "News";
                return '<a href="#latest"><strong>' + title + '</strong><small class="d-block">' + category + '</small></a>';
            }).join("");
        });
    }

    function setupBriefing() {
        var topicNode = document.getElementById("briefing-topic");
        var titleNode = document.getElementById("briefing-title");
        var summaryNode = document.getElementById("briefing-summary");
        document.querySelectorAll(".lq-topic-pills button").forEach(function (button) {
            button.addEventListener("click", function () {
                document.querySelectorAll(".lq-topic-pills button").forEach(function (item) {
                    item.classList.remove("active");
                });
                button.classList.add("active");
                var selected = briefing[button.dataset.topic];
                if (!selected) return;
                topicNode.textContent = button.dataset.topic;
                titleNode.textContent = selected.title;
                summaryNode.textContent = selected.summary;
                toast(button.dataset.topic + " briefing selected.");
            });
        });
    }

    function setupForms() {
        document.querySelectorAll("#newsletter-form, .newsletter-mini-form").forEach(function (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var input = form.querySelector("input[type='email']");
                if (input && input.value.trim()) {
                    toast("You are subscribed to the Lawyers' Quarters briefing.");
                    input.value = "";
                }
            });
        });

        document.querySelectorAll(".js-push").forEach(function (button) {
            button.addEventListener("click", function () {
                toast("Push alerts are enabled for this browser preview.");
                button.textContent = "Alerts enabled";
            });
        });

        document.querySelectorAll(".js-sign-in").forEach(function (button) {
            button.addEventListener("click", function () {
                toast("Reader account preview saved on this device.");
            });
        });
    }

    function setupAccessibilityPolish() {
        var labelLightboxImage = function () {
            document.querySelectorAll("img.lb-image[alt='']").forEach(function (image) {
                image.setAttribute("alt", "Image preview");
            });
        };
        labelLightboxImage();
        window.setTimeout(labelLightboxImage, 500);
        if ("MutationObserver" in window) {
            new MutationObserver(labelLightboxImage).observe(document.body, { childList: true, subtree: true });
        }
    }

    function recordAnalytics() {
        var state = readState();
        state.analytics.push({ event: "page_view", at: new Date().toISOString(), page: "index.html" });
        state.analytics = state.analytics.slice(-20);
        writeState(state);
    }

    document.addEventListener("DOMContentLoaded", function () {
        setupDate();
        setupActions();
        setupSearch();
        setupBriefing();
        setupForms();
        setupAccessibilityPolish();
        recordAnalytics();
    });
})();
