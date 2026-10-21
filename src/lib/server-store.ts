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
        return structuredClone(INITIAL_DB);
    }
    try {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading DB:', error);
        throw new Error('Não foi possível ler o histórico de mensagens.');
    }
}

function saveDb(data: any) {
    try {
        const temporary = `${DB_FILE}.${crypto.randomUUID()}.tmp`;
        try {
            fs.writeFileSync(temporary, JSON.stringify(data, null, 2));
            fs.renameSync(temporary, DB_FILE);
        } finally {
            if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
        }
    } catch (error) {
        throw new Error('Não foi possível salvar o histórico de mensagens.');
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

        if (message.wamid) {
            const previous = db.mensagens.find((m: any) => m.wamid === message.wamid);
            if (previous) return previous;
        }
        const preview = typeof message.text === 'string' ? message.text : message.text?.body || `[${message.type || 'mensagem'}]`;

        // Check if conversation exists, if not create/update it
        let conversation = db.conversas.find((c: any) => c.whatsappNumber === message.whatsappNumber);

        if (!conversation) {
            conversation = {
                _id: crypto.randomUUID(),
                whatsappNumber: message.whatsappNumber,
                status: 'Aberta',
                lastMessageTimestamp: new Date().toISOString(),
                lastMessagePreview: preview
            };
            db.conversas.push(conversation);
        } else {
            conversation.lastMessageTimestamp = new Date().toISOString();
            conversation.lastMessagePreview = preview;
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
