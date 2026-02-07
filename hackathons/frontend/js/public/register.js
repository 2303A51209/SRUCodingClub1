/**
 * Hackathons Platform - Registration Page
 */
(function () {
    let hackathonInfo = null;
    let memberCount = 0;

    // DOM Elements
    const loading = document.getElementById('loading');
    const form = document.getElementById('registration-form');
    const registerForm = document.getElementById('register-form');
    const successState = document.getElementById('success-state');
    const closedState = document.getElementById('closed-state');
    const membersContainer = document.getElementById('members-container');
    const addMemberBtn = document.getElementById('add-member');
    const maxMembersSpan = document.getElementById('max-members');
    const formError = document.getElementById('form-error');
    const submitBtn = document.getElementById('submit-btn');
    const rulesSection = document.getElementById('rules-section');
    const rulesContent = document.getElementById('rules-content');

    async function init() {
        const urlParams = new URLSearchParams(window.location.search);
        const hackathonId = urlParams.get('hackathon');

        if (!hackathonId) {
            window.location.href = '/';
            return;
        }

        await loadRegistrationInfo(hackathonId);
        bindEvents();
    }

    async function loadRegistrationInfo(id) {
        try {
            const response = await publicApi.getRegistrationInfo(id);
            hackathonInfo = response.data;

            if (!hackathonInfo.registration_open) {
                showClosed();
                return;
            }

            // Update UI
            document.getElementById('hackathon-title').textContent = hackathonInfo.title;
            document.title = `Register for ${hackathonInfo.title} | SR Coding Club`;

            // Set max members (max_team_size - 1 for leader)
            const maxMembers = hackathonInfo.max_team_size - 1;
            maxMembersSpan.textContent = maxMembers;

            // Show rules if available
            if (hackathonInfo.rules) {
                rulesContent.textContent = hackathonInfo.rules;
                rulesSection.classList.remove('hidden');
            }

            loading.classList.add('hidden');
            form.classList.remove('hidden');
        } catch (error) {
            console.error('Failed to load registration info:', error);
            window.location.href = '/';
        }
    }

    function bindEvents() {
        addMemberBtn.addEventListener('click', addMember);
        registerForm.addEventListener('submit', handleSubmit);
    }

    function addMember() {
        const maxMembers = hackathonInfo.max_team_size - 1;
        if (memberCount >= maxMembers) {
            return;
        }

        memberCount++;
        const memberHtml = `
            <div class="member-input" data-member="${memberCount}">
                <div class="form-group">
                    <label class="form-label">Member ${memberCount} Name</label>
                    <input type="text" name="member_${memberCount}_name" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Member ${memberCount} Email</label>
                    <input type="email" name="member_${memberCount}_email" class="form-input" required>
                </div>
                <button type="button" class="member-input__remove" onclick="removeMember(${memberCount})">✕</button>
            </div>
        `;

        membersContainer.insertAdjacentHTML('beforeend', memberHtml);
        updateMemberCount();
    }

    window.removeMember = function (index) {
        const memberDiv = membersContainer.querySelector(`[data-member="${index}"]`);
        if (memberDiv) {
            memberDiv.remove();
            memberCount--;
            updateMemberCount();
        }
    };

    function updateMemberCount() {
        const maxMembers = hackathonInfo.max_team_size - 1;
        const remaining = maxMembers - memberCount;
        maxMembersSpan.textContent = remaining;

        if (memberCount >= maxMembers) {
            addMemberBtn.disabled = true;
            addMemberBtn.textContent = 'Max Members';
        } else {
            addMemberBtn.disabled = false;
            addMemberBtn.textContent = '+ Add Member';
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        // Clear previous errors
        formError.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';

        try {
            const formData = new FormData(registerForm);

            // Build registration data
            const data = {
                hackathon_id: hackathonInfo.id,
                team_name: formData.get('team_name'),
                leader: {
                    name: formData.get('leader_name'),
                    email: formData.get('leader_email'),
                    phone: formData.get('leader_phone') || null,
                },
                members: [],
            };

            // Collect member data
            for (let i = 1; i <= memberCount; i++) {
                const name = formData.get(`member_${i}_name`);
                const email = formData.get(`member_${i}_email`);
                if (name && email) {
                    data.members.push({ name, email });
                }
            }

            // Submit
            const response = await publicApi.register(data);

            // Show success
            document.getElementById('registered-team-name').textContent = data.team_name;
            form.classList.add('hidden');
            successState.classList.remove('hidden');
        } catch (error) {
            console.error('Registration failed:', error);
            formError.textContent = error.message || 'Registration failed. Please try again.';
            formError.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register Team';
        }
    }

    function showClosed() {
        loading.classList.add('hidden');
        closedState.classList.remove('hidden');
    }

    document.addEventListener('DOMContentLoaded', init);
})();
