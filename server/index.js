const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Slack webhook URL from environment variable
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

// Database setup
const dbPath = path.join(__dirname, '../database/vret-wash.json');

let db = {
  users: [],
  washEntries: [],
  weeklyActions: [],
  nextId: { wash: 1, action: 1 }
};

// Load existing data
if (fs.existsSync(dbPath)) {
  try {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (err) {
    console.log('Creating new database');
  }
}

// Save database helper
const saveDb = () => {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

// API Routes
app.post('/api/login', (req, res) => {
  const { name, team } = req.body;
  
  try {
    let user = db.users.find(u => u.name === name && u.team === team);
    
    if (!user) {
      user = { name, team };
      db.users.push(user);
      saveDb();
    }
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/wash-entries', (req, res) => {
  res.json(db.washEntries);
});

app.get('/api/weekly-actions', (req, res) => {
  res.json(db.weeklyActions);
});

app.post('/api/lock-week', async (req, res) => {
  const weekData = req.body;
  
  try {
    await sendWeeklySlackNotification(weekData);
    res.json({ success: true, message: 'Week summary sent to Slack' });
  } catch (error) {
    console.error('Failed to send weekly summary:', error);
    res.status(500).json({ error: 'Failed to send Slack notification' });
  }
});

// Helper function to truncate text for Slack
function truncateText(text, maxLength = 500) {
  if (!text) return text;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '... (truncated)';
}

// Team name helper
const getTeamName = (teamId) => {
  const teams = {
    'A': 'Front Half Days',
    'B': 'Front Half Nights',
    'C': 'Back Half Days',
    'D': 'Back Half Nights'
  };
  return teams[teamId] || `Team ${teamId}`;
};

// Daily WASH notification
async function sendSlackNotification(entry) {
  if (!SLACK_WEBHOOK_URL || SLACK_WEBHOOK_URL === 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL') {
    console.log('Slack webhook not configured. Skipping notification.');
    return;
  }

  try {
    const date = new Date(entry.date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Format VRET metrics
    const vretMetrics = Object.entries(entry.vretMetrics || {}).map(([metric, data]) => {
      const pct = data.goal ? ((parseFloat(data.achieved) / parseFloat(data.goal)) * 100).toFixed(1) : 'N/A';
      const status = parseFloat(pct) >= 100 ? '✅' : '⚠️';
      const bridge = entry.vretBridges?.[metric] ? `\n   _Bridge: ${truncateText(entry.vretBridges[metric], 200)}_` : '';
      return `${status} *${metric}*: ${data.achieved}/${data.goal} (${pct}%)${bridge}`;
    }).join('\n');

    // Format safety info
    let safetySection = '';
    if (entry.wriIncidents && entry.wriIncidents.length > 0) {
      safetySection = `*🚨 Safety - ${entry.wriIncidents.length} WRI Incident(s) Reported*`;
      entry.wriIncidents.slice(0, 5).forEach((incident, idx) => {
        safetySection += `\n\n*Incident #${idx + 1}*\n${truncateText(incident.summary, 300)}`;
        if (incident.austinLink) {
          safetySection += `\n<${incident.austinLink}|View in Austin>`;
        }
      });
      if (entry.wriIncidents.length > 5) {
        safetySection += `\n\n_...and ${entry.wriIncidents.length - 5} more incident(s)_`;
      }
    } else {
      safetySection = '*✅ Safety*: No incidents reported';
    }

    // Format callouts
    let calloutsSection = '';
    if (entry.handoffNotes || entry.stationReadiness || entry.leadershipCallouts) {
      calloutsSection = '*📢 Shift Callouts*';
      if (entry.handoffNotes) {
        calloutsSection += `\n\n*Hand Off Notes:*\n${truncateText(entry.handoffNotes, 400)}`;
      }
      if (entry.stationReadiness) {
        calloutsSection += `\n\n*Station Readiness:*\n${truncateText(entry.stationReadiness, 400)}`;
      }
      if (entry.leadershipCallouts) {
        calloutsSection += `\n\n*Leadership Callouts:*\n${truncateText(entry.leadershipCallouts, 400)}`;
      }
    }

    const message = {
      text: `WASH Entry Completed - ${getTeamName(entry.team)}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `🔒 WASH Entry Locked - ${getTeamName(entry.team)}`,
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Date:* ${date}\n*Submitted by:* ${entry.author}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: safetySection
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*📊 VRETs*\n${vretMetrics}`
          }
        }
      ]
    };

    // Add callouts section if present
    if (calloutsSection) {
      message.blocks.push({
        type: "divider"
      });
      message.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: calloutsSection
        }
      });
    }

    await axios.post(SLACK_WEBHOOK_URL, message);
    console.log(`Slack notification sent for ${getTeamName(entry.team)} - ${date}`);
  } catch (error) {
    console.error('Failed to send Slack notification:', error.message);
  }
}

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('save-wash-entry', (entry) => {
    const existingIndex = db.washEntries.findIndex(e => 
      e.date === entry.date && e.team === entry.team
    );

    const wasLocked = existingIndex >= 0 ? db.washEntries[existingIndex].locked : false;
    const isNowLocked = entry.locked;

    if (existingIndex >= 0) {
      db.washEntries[existingIndex] = { ...entry, id: db.washEntries[existingIndex].id };
    } else {
      entry.id = db.nextId.wash++;
      db.washEntries.push(entry);
    }

    saveDb();
    io.emit('wash-entry-updated', entry);

    if (!wasLocked && isNowLocked) {
      sendSlackNotification(entry);
    }
  });

  socket.on('save-weekly-action', (action) => {
    if (action.id) {
      const index = db.weeklyActions.findIndex(a => a.id === action.id);
      if (index >= 0) {
        db.weeklyActions[index] = action;
      }
    } else {
      action.id = db.nextId.action++;
      action.createdAt = new Date().toISOString();
      db.weeklyActions.push(action);
    }

    saveDb();
    io.emit('weekly-action-updated', action);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`VRET WASH server running on port ${PORT}`);
});
