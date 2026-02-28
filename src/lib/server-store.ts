import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'whatsapp-db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial DB structure
const INITIAL_DB = {
    conversas: [],
    mensagens: []
};

function getDb() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2));
        return INITIAL_DB;
    }
    try {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading DB:', error);
        return INITIAL_DB;
    }
}

function saveDb(data: any) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving DB:', error);
    }
}

export const ServerStore = {
    getConversations: () => {
        const db = getDb();
        return db.conversas || [];
    },

    getMessages: (conversationId?: string) => {
        const db = getDb();
        const msgs = db.mensagens || [];
        if (conversationId) {
            return msgs.filter((m: any) => m.conversationId === conversationId);
        }
        return msgs;
    },

    saveMessage: (message: any) => {
        const db = getDb();

        // Check if conversation exists, if not create/update it
        let conversation = db.conversas.find((c: any) => c.whatsappNumber === message.whatsappNumber);

        if (!conversation) {
            conversation = {
                _id: crypto.randomUUID(),
                whatsappNumber: message.whatsappNumber,
                status: 'Aberta',
                lastMessageTimestamp: new Date().toISOString(),
                lastMessagePreview: message.text || (message.type === 'text' ? message.text.body : `[${message.type}]`)
            };
            db.conversas.push(conversation);
        } else {
            conversation.lastMessageTimestamp = new Date().toISOString();
            conversation.lastMessagePreview = message.text || (message.type === 'text' ? message.text.body : `[${message.type}]`);
        }

        const newMessage = {
            _id: crypto.randomUUID(),
            conversationId: conversation._id,
            timestamp: new Date().toISOString(),
            ...message
        };

        db.mensagens.push(newMessage);
        saveDb(db);
        return newMessage;
    },

    updateConversation: (id: string, updates: any) => {
        const db = getDb();
        const index = db.conversas.findIndex((c: any) => c._id === id);
        if (index !== -1) {
            db.conversas[index] = { ...db.conversas[index], ...updates };
            saveDb(db);
            return db.conversas[index];
        }
        return null;
    }
};
