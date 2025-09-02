async function injectNicknameLink() {
    // Wait for the document to be fully loaded
    if (document.readyState !== "complete") {
        await new Promise(resolve => {
            window.addEventListener("load", resolve, { once: true });
        });
    }

    // Insert the <a> element into the target div only if not already present
    const targetDiv = document.querySelector('.popup_body.popup_menu.shadow_content');
    if (targetDiv) {
        // Check if the 'Add Nickname' link already exists
        const existingLink = Array.from(targetDiv.querySelectorAll('a.popup_menu_item'))
            .find(a => a.textContent.includes('Add Nickname'));
        if (!existingLink) {
            const link = document.createElement('a');
            link.className = 'popup_menu_item';
            link.href = '#';
            link.onclick = async function() {
                const { ShowModal } = await import('./modal.js');
                ShowModal();
                if (typeof HideMenu === 'function') {
                    HideMenu('profile_action_dropdown_link', 'profile_action_dropdown');
                }
                return false;
            };
            link.innerHTML = `
                <img src="https://community.akamai.steamstatic.com/public/images/skin_1/notification_icon_edit_bright.png">
                &nbsp; Add Nickname
            `;
            targetDiv.appendChild(link);
        }
    }
}

// Run automatically after page load
injectNicknameLink();