function waitForGlobals() {
    return new Promise((resolve) => {
        function check() {
            let profileUrl = window.g_rgProfileData?.url;
            let sessionId = window.g_sessionID;

            // Fallback: Try to get sessionid from hidden input
            if (!sessionId) {
                const sessionInput = document.querySelector('input[name="sessionid"]');
                if (sessionInput) sessionId = sessionInput.value;
            }
            console.log('Found sessionId:', sessionId);

            // Fallback: Extract only USERNAME or STEAMID from window.location.href, removing any trailing # or query
            if (!profileUrl) {
                const cleanHref = window.location.href.split(/[?#]/)[0];
                const match = cleanHref.match(/\/(id|profiles)\/([^\/]+)\/?/);
                if (match) {
                    // Only assign USERNAME or STEAMID
                    profileUrl = match[2];
                }
            }
            console.log('Found profileUrl:', profileUrl);

            if (profileUrl && sessionId) {
                resolve({ profileUrl, sessionId });
            } else {
                setTimeout(check, 100);
            }
        }
        check();
    });
}

export async function ShowModal() {
    // Prevent duplicate modals
    if (document.getElementById('nickname-steam-modal')) return;

    // Modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'nickname-steam-modal';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';

    // Modal HTML
    overlay.innerHTML = `
        <div class="newmodal" style="position: relative; z-index: 1000; max-width: 500px;">
            <div class="modal_top_bar"></div>
            <div class="newmodal_header_border">
                <div class="newmodal_header">
                    <div class="newmodal_close" tabindex="0" style="cursor:pointer;"></div>
                    <div class="title_text">Add Nickname</div>
                </div>
            </div>
            <div class="newmodal_content_border">
                <div class="newmodal_content">
                    <form id="nickname-form">
                        <div class="newmodal_prompt_description">
                            Add a persistent nickname to this player to keep track of who they are.
                        </div>
                        <div class="newmodal_prompt_input gray_bevel for_text_input fullwidth">
                            <input type="text" id="nickname-input" class="" style="width:100%;">
                        </div>
                        <div class="newmodal_buttons" style="margin-top:16px; display:flex; gap:8px;">
                            <button type="submit" class="btn_green_white_innerfade btn_medium">
                                <span>Add Nickname</span>
                            </button>
                            <div class="btn_grey_steamui btn_medium" id="nickname-cancel" tabindex="0" style="cursor:pointer;">
                                <span>Cancel</span>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Close modal on close button or cancel
    overlay.querySelector('.newmodal_close').onclick = () => overlay.remove();
    overlay.querySelector('#nickname-cancel').onclick = () => overlay.remove();

    // Handle form submit
    overlay.querySelector('#nickname-form').onsubmit = async (e) => {
        e.preventDefault();
        const nickname = overlay.querySelector('#nickname-input').value.trim(); // <-- Add this line
        const { profileUrl, sessionId } = await waitForGlobals();

        if (!profileUrl || !sessionId) {
            showAlert('Could not find profile URL or session ID.');
            return;
        }

        // Reconstruct the full profile URL
        let fullProfileUrl;
        if (window.location.href.includes('/id/')) {
            fullProfileUrl = `https://steamcommunity.com/id/${profileUrl}/ajaxsetnickname/`;
        } else if (window.location.href.includes('/profiles/')) {
            fullProfileUrl = `https://steamcommunity.com/profiles/${profileUrl}/ajaxsetnickname/`;
        } else {
            showAlert('Could not determine profile URL type.');
            return;
        }

        try {
            const response = await fetch(fullProfileUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                body: new URLSearchParams({
                    nickname: nickname,
                    sessionid: sessionId
                })
            });
            const data = await response.json();

            if (data.nickname && data.nickname.length > 0) {
                // Find or create the nickname element
                let target = document.querySelector('.persona_name .nickname');
                if (!target) {
                    const personaName = document.querySelector('.persona_name');
                    const nameHistoryLink = document.querySelector('.namehistory_link');
                    if (personaName) {
                        target = document.createElement('span');
                        target.className = 'nickname';
                        if (nameHistoryLink && nameHistoryLink.parentNode === personaName) {
                            personaName.insertBefore(target, nameHistoryLink);
                        } else {
                            personaName.appendChild(target);
                        }
                    }
                }
                if (target) {
                    target.textContent = `(${data.nickname}) `;
                    target.style.display = '';
                }
            } else {
                const target = document.querySelector('.persona_name .nickname');
                if (target) target.style.display = 'none';
            }
        } catch (err) {
            console.error('Error processing your request. Please try again.: ' + err.message);
        }

        overlay.remove();
    };

    // Simple alert dialog
    function showAlert(message) {
        alert(message);
    }
}