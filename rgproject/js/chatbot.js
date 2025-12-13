(function() {
    // ================= CONFIG =================
    const API_URL = 'https://marcoleung052-vieshow-backend.hf.space/api/chatbot/ask'; // 請確認您的後端網址
    const STORAGE_KEY = 'vieshow_chat_history';
    const STATE_KEY = 'vieshow_chat_open';
    // ==========================================

    // 1. 動態注入 HTML 結構 (包含 Tailwind class)
    const chatbotHTML = `
        <div id="chatbot-container" class="fixed bottom-6 right-6 z-50 font-sans" style="display:none;">
            <div id="chat-window" class="hidden flex-col bg-white w-80 h-96 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden mb-4 transition-all duration-300 transform origin-bottom-right scale-95 opacity-0">
                
                <div class="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
                    <div class="flex items-center">
                        <div class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                        <span class="font-bold tracking-wide">威秀 AI 小助手</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button id="clear-chat-btn" class="text-gray-400 hover:text-red-400 text-xs" title="清除紀錄">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                        <button id="close-chat-btn" class="text-gray-400 hover:text-white transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>

                <div id="chat-messages" class="flex-grow p-4 overflow-y-auto bg-gray-50 space-y-3 scroll-smooth">
                    </div>

                <div class="p-3 bg-white border-t border-gray-100 flex items-center">
                    <input type="text" id="chat-input" placeholder="輸入訊息..." 
                           class="flex-grow bg-gray-100 text-gray-700 text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition">
                    <button id="send-chat-btn" 
                            class="ml-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition shadow-md transform hover:scale-105 active:scale-95">
                        <svg class="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    </button>
                </div>
            </div>

            <button id="toggle-chat-btn" 
                    class="bg-red-600 hover:bg-red-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition transform hover:scale-110 active:scale-95 border-2 border-white">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </button>
        </div>
    `;

    // 將 HTML 插入 body
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    // 確保插入後顯示
    document.getElementById('chatbot-container').style.display = 'block';

    // ================= DOM 元素 =================
    const chatWindow = document.getElementById('chat-window');
    const messagesContainer = document.getElementById('chat-messages');
    const inputField = document.getElementById('chat-input');
    const toggleBtn = document.getElementById('toggle-chat-btn');
    const closeBtn = document.getElementById('close-chat-btn');
    const sendBtn = document.getElementById('send-chat-btn');
    const clearBtn = document.getElementById('clear-chat-btn');

    // ================= 核心邏輯 =================

    // 1. 初始化：從 sessionStorage 讀取紀錄
    function initChat() {
        const history = JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || [];
        const isOpen = sessionStorage.getItem(STATE_KEY) === 'true';

        // 渲染歷史訊息
        if (history.length === 0) {
            // 如果沒有紀錄，顯示預設歡迎語
            appendMessage('嗨！我是 AI 小助手 🤖<br>您可以問我：「最近有什麼電影？」或「查訂單」。', 'bot', false);
        } else {
            history.forEach(msg => appendMessage(msg.text, msg.sender, false));
        }

        // 恢復視窗狀態 (如果上一頁是開著的，這一頁也會開著)
        if (isOpen) {
            chatWindow.classList.remove('hidden', 'scale-95', 'opacity-0');
            chatWindow.classList.add('scale-100', 'opacity-100');
        }
    }

    // 2. 儲存訊息到 sessionStorage
    function saveHistory(text, sender) {
        const history = JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || [];
        history.push({ text, sender });
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    // 3. 顯示訊息 (UI)
    function appendMessage(text, sender, needSave = true) {
        const div = document.createElement('div');
        div.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`;
        
        const bubble = document.createElement('div');
        const userStyle = 'bg-red-600 text-white rounded-tr-none';
        const botStyle = 'bg-white border border-gray-200 text-gray-700 rounded-tl-none';
        
        bubble.className = `${sender === 'user' ? userStyle : botStyle} rounded-2xl py-2 px-3 text-sm shadow-sm max-w-[85%] break-words`;
        bubble.innerHTML = text.replace(/\n/g, '<br>'); // 處理換行

        div.appendChild(bubble);
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight; // 捲動到底部

        if (needSave) saveHistory(text, sender);
    }

    // 4. 發送訊息到後端
    async function sendMessage() {
        const text = inputField.value.trim();
        if (!text) return;

        // 顯示用戶訊息
        appendMessage(text, 'user');
        inputField.value = '';

        // 顯示 Loading
        const loadingId = showLoading();

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: text, 
                    memberId: user ? user.id : null 
                })
            });
            const data = await res.json();
            
            removeLoading(loadingId);
            appendMessage(data.reply, 'bot');

        } catch (e) {
            console.error(e);
            removeLoading(loadingId);
            appendMessage("連線錯誤，請檢查網路或稍後再試。", 'bot');
        }
    }

    // 5. Loading 動畫
    function showLoading() {
        const id = 'loading-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'flex justify-start';
        div.innerHTML = `
            <div class="bg-gray-100 text-gray-500 rounded-tl-none rounded-2xl py-2 px-4 text-sm shadow-sm flex items-center space-x-1">
                <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>`;
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return id;
    }

    function removeLoading(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // 6. 開關視窗
    function toggleChat(forceOpen = null) {
        const isHidden = chatWindow.classList.contains('hidden');
        const shouldOpen = forceOpen !== null ? forceOpen : isHidden;

        if (shouldOpen) {
            chatWindow.classList.remove('hidden');
            setTimeout(() => {
                chatWindow.classList.remove('scale-95', 'opacity-0');
                chatWindow.classList.add('scale-100', 'opacity-100');
            }, 10);
            inputField.focus();
            sessionStorage.setItem(STATE_KEY, 'true'); // 記住狀態
        } else {
            chatWindow.classList.remove('scale-100', 'opacity-100');
            chatWindow.classList.add('scale-95', 'opacity-0');
            setTimeout(() => chatWindow.classList.add('hidden'), 300);
            sessionStorage.setItem(STATE_KEY, 'false'); // 記住狀態
        }
    }

    // 7. 清除紀錄
    function clearChat() {
        if(confirm('確定要清除對話紀錄嗎？')) {
            sessionStorage.removeItem(STORAGE_KEY);
            messagesContainer.innerHTML = '';
            appendMessage('紀錄已清除。我是 AI 小助手 🤖', 'bot', false);
        }
    }

    // ================= 事件監聽 =================
    toggleBtn.addEventListener('click', () => toggleChat());
    closeBtn.addEventListener('click', () => toggleChat(false));
    sendBtn.addEventListener('click', sendMessage);
    clearBtn.addEventListener('click', clearChat);
    
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // 啟動！
    initChat();

})();
