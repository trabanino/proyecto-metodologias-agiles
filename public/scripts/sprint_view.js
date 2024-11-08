document.addEventListener("DOMContentLoaded", () => {
    const stories = [
        {
            id: 1,
            title: "Historia de usuario 1",
            description: "Como administrador me gustaría poder crear proyectos.",
            status: "completed",
        },
        {
            id: 2,
            title: "Historia de usuario 2",
            description: "Como administrador me gustaría poder añadir miembros.",
            status: "incomplete",
        },
    ];

    const storyContainer = document.querySelector(".user-stories");
    const addStoryButton = document.querySelector(".add-story-btn");
    const searchBar = document.getElementById("search-bar");

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
                <button class="story-status ${story.status === "completed" ? "completed" : "incomplete"}">
                    ${story.status === "completed" ? "completed" : "Not started"}
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
        const modal = document.createElement("div");
        modal.classList.add("modal");
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Editar Historia</h2>
                <label for="story-title">Título:</label>
                <input type="text" id="story-title" value="${story.title}" />
                <label for="story-description">Descripción:</label>
                <textarea id="story-description">${story.description}</textarea>
                <label for="story-status">Estado:</label>
                <select id="story-status">
                    <option value="completed" ${story.status === "completed" ? "selected" : ""}>Completed</option>
                    <option value="incomplete" ${story.status === "incomplete" ? "selected" : ""}>Not started</option>
                </select>
                <button class="save-btn">Guardar</button>
            </div>
        `;

        // Close modal
        modal.querySelector(".close").addEventListener("click", () => {
            modal.remove();
        });

        // Save changes
        modal.querySelector(".save-btn").addEventListener("click", () => {
            const title = modal.querySelector("#story-title").value;
            const description = modal.querySelector("#story-description").value;
            const status = modal.querySelector("#story-status").value;

            story.title = title;
            story.description = description;
            story.status = status;

            modal.remove();
            renderStories(searchBar.value);
        });

        document.body.appendChild(modal);
    };

    // Add new story
    addStoryButton.addEventListener("click", () => {
        const newStory = {
            id: stories.length + 1,
            title: `Nueva Historia ${stories.length + 1}`,
            description: "Descripción de la nueva historia.",
            status: "incomplete",
        };
        stories.push(newStory);
        renderStories(searchBar.value);
    });

    // Search functionality
    searchBar.addEventListener("input", (e) => {
        renderStories(e.target.value);
    });

    // Initial render
    renderStories();
});
