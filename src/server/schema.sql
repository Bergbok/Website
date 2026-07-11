DROP TABLE IF EXISTS Messages;
CREATE TABLE IF NOT EXISTS Messages (
	MessageID INTEGER PRIMARY KEY,
	Messager TEXT,
	MessageContent TEXT,
	MessagePending BOOLEAN,
	MessageDate TEXT NOT NULL DEFAULT (datetime('now'))
);
