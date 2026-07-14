DROP TABLE IF EXISTS Messages;
CREATE TABLE IF NOT EXISTS Messages (
	MessageID INTEGER PRIMARY KEY,
	Messager TEXT,
	MessageContent TEXT,
	MessagePending BOOLEAN,
	MessageDate TEXT NOT NULL DEFAULT (datetime('now'))
);
DROP TABLE IF EXISTS Visits;
CREATE TABLE IF NOT EXISTS Visits (VisitPath TEXT PRIMARY KEY, VisitCount TEXT);
