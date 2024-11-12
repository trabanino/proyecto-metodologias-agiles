document.addEventListener("DOMContentLoaded", () => {
    let stories = [];
    let projectId = null;
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
    }

    const urlParams = new URLSearchParams(window.location.search);
    projectId = urlParams.get('projectId');

    const storyContainer = document.querySelector(".user-stories");
    const addStoryButton = document.querySelector(".add-story-btn");
    const searchBar = document.getElementById("search-bar");

    // Fetch stories from server
    async function loadStories() {
        const response = await fetch(`/api/projects/${projectId}/stories`, {
            headers: {
                'Authorization': token
            }
        });

        if (response.ok) {
            stories = await response.json();
            renderStories();
        } else {
            alert('Error al cargar las historias de usuario');
        }
    }

    // Render stories
    const renderStories = (filter = "") => {
        storyContainer.innerHTML = "";

        const filteredStories = stories.filter((story) =>
            story.title.toLowerCase().includes(filter.toLowerCase())
        );

        filteredStories.forEach((story) => {
            const storyElement = document.createElement("div");
            storyElement.classList.add("story");
            storyElement.innerHTML = `
                <div class="story-icon">
                    <img src="img/icon_userstory.png" alt="icon" class="icon">
                </div>
                <div class="story-content">
                    <h3>${story.title}</h3>
                    <p>${story.description}</p>
                    <button class="add-member-btn">Añadir Miembro</button>
                    <button class="edit-story-btn">Editar</button>
                </div>
                <button class="story-status ${story.status}">
                    ${story.status.replace('_', ' ')}
                </button>
            `;

            // Add event listener for edit button
            storyElement.querySelector(".edit-story-btn").addEventListener("click", () => {
                openEditModal(story);
            });

            storyContainer.appendChild(storyElement);
        });
    };

    // Open edit modal
    const openEditModal = (story) => {
        const modal = document.getElementById("storyModal");
        modal.classList.remove('hidden');
        modal.querySelector("#story-title").value = story.title;
        modal.querySelector("#story-description").value = story.description;
        modal.querySelector("#story-status").value = story.status;

        // Close modal
        modal.querySelector(".close").addEventListener("click", () => {
            modal.classList.add('hidden');
        });

        // Save changes
        modal.querySelector(".save-btn").addEventListener("click", async () => {
            const title = modal.querySelector("#story-title").value;
            const description = modal.querySelector("#story-description").value;
            const status = modal.querySelector("#story-status").value;

            const updatedStory = { ...story, title, description, status };

            const response = await fetch(`/api/projects/${projectId}/stories/${story.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(updatedStory)
            });

            if (response.ok) {
                const index = stories.findIndex(s => s.id === story.id);
                stories[index] = updatedStory;
                modal.classList.add('hidden');
                renderStories(searchBar.value);
            } else {
                alert('Error al actualizar la historia');
            }
        });
    };

    // Add new story
    addStoryButton.addEventListener("click", () => {
        const modal = document.getElementById("storyModal");
        modal.classList.remove('hidden');
        modal.querySelector("#story-title").value = '';
        modal.querySelector("#story-description").value = '';
        modal.querySelector("#story-status").value = 'not_started';

        // Close modal
        modal.querySelector(".close").addEventListener("click", () => {
            modal.classList.add('hidden');
        });

        // Save new story
        modal.querySelector(".save-btn").addEventListener("click", async () => {
            const title = modal.querySelector("#story-title").value;
            const description = modal.querySelector("#story-description").value;
            const status = modal.querySelector("#story-status").value;

            const newStory = { title, description, status };

            const response = await fetch(`/api/projects/${projectId}/stories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(newStory)
            });

            if (response.ok) {
                const createdStory = await response.json();
                stories.push(createdStory);
                modal.classList.add('hidden');
                renderStories(searchBar.value);
            } else {
                alert('Error al crear la historia');
            }
        });
    });

    // Search functionality
    searchBar.addEventListener("input", (e) => {
        renderStories(e.target.value);
    });

    // Initial load
    loadStories();
});
