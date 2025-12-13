// 等待網頁內容完全載入後才執行
document.addEventListener('DOMContentLoaded', function() {

    (function() {
        // ================= 設定區 =================
        const API_URL = 'https://marcoleung052-vieshow-backend.hf.space/api/chatbot/ask'; 
        const STORAGE_KEY = 'vieshow_chat_history';
        const STATE_KEY = 'vieshow_chat_open';
     
        // ================= 1. 定義 HTML 結構 =================
        const chatbotHTML = `
            <div id="chatbot-widget-container" class="fixed bottom-6 right-6 z-[9999] font-sans flex flex-col items-end">
                
                <div id="chat-window" class="hidden flex flex-col bg-white w-80 h-[480px] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden mb-4 transition-all duration-300 origin-bottom-right transform scale-95 opacity-0">
                    
                    <div class="bg-gray-800 p-4 flex justify-between items-center shadow-md shrink-0 z-10">
                        <div class="flex items-center space-x-2">
                            <div class="relative">
                                <div class="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                                <div class="absolute top-0 left-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75"></div>
                            </div>
                            <div>
                                <h3 class="text-white font-bold text-sm tracking-wide">威秀 AI 小助手</h3>
                                <p class="text-gray-400 text-xs">線上服務中</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-1">
                            <button id="clear-chat-btn" class="text-gray-400 hover:text-red-400 p-1 transition" title="清除紀錄">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                            <button id="close-chat-btn" class="text-gray-400 hover:text-white p-1 transition">
                                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
    
                    <div id="chat-messages" class="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4 scroll-smooth min-h-0">
                        </div>
    
                    <div class="p-3 bg-white border-t border-gray-100 shrink-0 z-10">
                        <div class="relative flex items-center">
                            <input type="text" id="chat-input" placeholder="輸入訊息..." 
                                   class="w-full bg-gray-100 text-gray-800 text-sm rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#e50914] transition-all placeholder-gray-400">
                            <button id="send-chat-btn" 
                                    class="absolute right-1.5 bg-[#e50914] hover:bg-red-700 text-white p-2 rounded-full shadow-md transition-transform active:scale-90 flex items-center justify-center">
                                <svg class="w-4 h-4 transform rotate-90 translate-x-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                            </button>
                        </div>
                        <div class="text-center mt-1">
                            <span class="text-[10px] text-gray-300">Powered by Groq AI</span>
                        </div>
                    </div>
                </div>
    
                <button id="toggle-chat-btn" 
                        class="bg-[#e50914] hover:bg-red-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-red-500/30 group">
                    <svg class="w-7 h-7 group-hover:hidden transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                    <svg class="w-7 h-7 hidden group-hover:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        `;
     
        // ================= 2. 注入頁面 =================
        if (!document.getElementById('chatbot-widget-container')) {
            document.body.insertAdjacentHTML('beforeend', chatbotHTML);
        }
     
        // ================= 3. 取得 DOM 元素 =================
        const chatWindow = document.getElementById('chat-window');
        const messagesContainer = document.getElementById('chat-messages');
        const inputField = document.getElementById('chat-input');
        const toggleBtn = document.getElementById('toggle-chat-btn');
        const closeBtn = document.getElementById('close-chat-btn');
        const sendBtn = document.getElementById('send-chat-btn');
        const clearBtn = document.getElementById('clear-chat-btn');
     
        // ================= 4. 核心邏輯 =================

        // ★★★ 輔助函式：強制捲動到底部 (修正版) ★★★
        function scrollToBottom() {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 50);
        }
     
        function initChat() {
            const history = JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || [];
            const isOpen = sessionStorage.getItem(STATE_KEY) === 'true';
     
            messagesContainer.innerHTML = ''; 
     
            if (history.length === 0) {
                appendMessage('嗨！我是 AI 小客服 🤖<br>您可以問我：「最近有什麼電影？」或「幫我查訂單」。', 'bot', false);
            } else {
                history.forEach(msg => appendMessage(msg.text, msg.sender, false));
            }
     
            if (isOpen) {
                chatWindow.classList.remove('hidden');
                setTimeout(() => {
                    chatWindow.classList.remove('scale-95', 'opacity-0');
                    chatWindow.classList.add('scale-100', 'opacity-100');
                    scrollToBottom(); 
                }, 10);
            }
        }
     
        function saveHistory(text, sender) {
            const history = JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || [];
            history.push({ text, sender });
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        }
     
        // ★★★ 修正版 appendMessage：移除 flex-row-reverse，正確對齊 ★★★
        function appendMessage(text, sender, needSave = true) {
            const div = document.createElement('div');
            // user: justify-end (靠右)
            // bot: justify-start (靠左)
            div.className = sender === 'user' ? 'flex justify-end animate-fade-in mb-2' : 'flex justify-start animate-fade-in mb-2';
            
            // 根據發送者決定樣式
            const contentHTML = sender === 'user' 
                ? `
                   <div class="flex items-end gap-2 max-w-[85%]">
                     <div class="bg-gray-200 text-gray-800 px-4 py-2.5 rounded-2xl rounded-br-none shadow-sm text-sm leading-relaxed text-left">
                        ${text.replace(/\n/g, '<br>')}
                     </div>
                   </div>`
                : `
                   <div class="flex items-end gap-2 max-w-[85%]">
                     <div class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                        <span class="text-xs">🤖</span>
                     </div>
                     <div class="bg-white border border-gray-100 text-gray-700 px-4 py-2.5 rounded-2xl rounded-bl-none shadow-sm text-sm leading-relaxed">
                        ${text.replace(/\n/g, '<br>')}
                     </div>
                   </div>`;
     
            div.innerHTML = contentHTML;
            messagesContainer.appendChild(div);
            
            scrollToBottom();
     
            if (needSave) saveHistory(text, sender);
        }
     
        function showLoading() {
            const id = 'loading-' + Date.now();
            const div = document.createElement('div');
            div.id = id;
            div.className = 'flex justify-start animate-fade-in mb-2';
            div.innerHTML = `
                <div class="flex items-end gap-2 max-w-[85%]">
                    <div class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                        <span class="text-xs">🤖</span>
                     </div>
                    <div class="bg-white px-4 py-3 rounded-2xl rounded-bl-none flex space-x-1 items-center shadow-sm border border-gray-100">
                        <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                        <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                </div>`;
            messagesContainer.appendChild(div);
            
            scrollToBottom();
            return id;
        }
     
        function removeLoading(id) {
            const el = document.getElementById(id);
            if (el) el.remove();
        }
     
        async function sendMessage() {
            const text = inputField.value.trim();
            if (!text) return;
     
            appendMessage(text, 'user');
            inputField.value = '';
            const loadingId = showLoading();
     
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, memberId: user ? user.id : null })
                });
                const data = await res.json();
                removeLoading(loadingId);
                appendMessage(data.reply, 'bot');
            } catch (e) {
                console.error(e);
                removeLoading(loadingId);
                appendMessage("連線錯誤，請檢查網路。", 'bot');
            }
        }
     
        function toggleChat(forceOpen = null) {
            const isHidden = chatWindow.classList.contains('hidden');
            const shouldOpen = forceOpen !== null ? forceOpen : isHidden;
     
            if (shouldOpen) {
                chatWindow.classList.remove('hidden');
                setTimeout(() => {
                    chatWindow.classList.remove('scale-95', 'opacity-0');
                    chatWindow.classList.add('scale-100', 'opacity-100');
                    scrollToBottom();
                    inputField.focus();
                }, 10);
                sessionStorage.setItem(STATE_KEY, 'true');
            } else {
                chatWindow.classList.remove('scale-100', 'opacity-100');
                chatWindow.classList.add('scale-95', 'opacity-0');
                setTimeout(() => chatWindow.classList.add('hidden'), 300);
                sessionStorage.setItem(STATE_KEY, 'false');
            }
        }
     
        function clearChat() {
            if(confirm('確定要清除對話紀錄嗎？')) {
                sessionStorage.removeItem(STORAGE_KEY);
                messagesContainer.innerHTML = '';
                appendMessage('紀錄已清除。您可以重新開始提問！', 'bot', false);
            }
        }
     
        // ================= 5. 綁定事件 =================
        toggleBtn.addEventListener('click', () => toggleChat());
        closeBtn.addEventListener('click', () => toggleChat(false));
        clearBtn.addEventListener('click', clearChat);
        sendBtn.addEventListener('click', sendMessage);
        
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
     
        // 加入 CSS 動畫
        if (!document.getElementById('chatbot-style')) {
            const style = document.createElement('style');
            style.id = 'chatbot-style';
            style.innerHTML = `
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
            `;
            document.head.appendChild(style);
        }
     
        // 啟動
        initChat();
     
    })();

});
