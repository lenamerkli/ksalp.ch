CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mail TEXT NOT NULL,
    salt TEXT NOT NULL,
    hash TEXT NOT NULL,
    newsletter INTEGER NOT NULL,
    created TEXT NOT NULL,
    theme TEXT NOT NULL,
    iframe INTEGER NOT NULL,
    payment TEXT NOT NULL,
    payment_lite TEXT NOT NULL,
    banned TEXT NOT NULL,
    search TEXT NOT NULL,
    class TEXT NOT NULL,
    grade TEXT NOT NULL,
    favorites TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    subject TEXT NOT NULL,
    posted TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS calendars (
    id TEXT PRIMARY KEY,
    owner TEXT NOT NULL,
    access TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    calendar TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    start TEXT NOT NULL,
    end TEXT NOT NULL,
    color TEXT NOT NULL,
    schulnetz TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS calendar_selections (
    id TEXT PRIMARY KEY,
    owner TEXT NOT NULL,
    calendar TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    class TEXT NOT NULL,
    grade TEXT NOT NULL,
    language TEXT NOT NULL,
    owner TEXT NOT NULL,
    edited TEXT NOT NULL,
    created TEXT NOT NULL,
    extension TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS learn_sets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    class TEXT NOT NULL,
    grade TEXT NOT NULL,
    language TEXT NOT NULL,
    owner TEXT NOT NULL,
    edited TEXT NOT NULL,
    created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS learn_exercises (
    id TEXT PRIMARY KEY,
    set_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    answers TEXT NOT NULL,
    frequency REAL NOT NULL,
    auto_check INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS learn_stats (
    id TEXT PRIMARY KEY,
    exercise_id TEXT NOT NULL,
    owner TEXT NOT NULL,
    correct INTEGER NOT NULL,
    wrong INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS login(
    id TEXT PRIMARY KEY,
    account TEXT NOT NULL,
    valid TEXT NOT NULL,
    browser TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS mail_check (
    id TEXT PRIMARY KEY,
    account TEXT NOT NULL,
    valid TEXT NOT NULL,
    code TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS used_ids (
    id TEXT PRIMARY KEY,
    created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ips (
    ip TEXT PRIMARY KEY,
    score INTEGER NOT NULL,
    description TEXT NOT NULL
);
