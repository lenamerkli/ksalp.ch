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
    banned TEXT NOT NULL,
    search TEXT NOT NULL,
    class TEXT NOT NULL,
    grade TEXT NOT NULL
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
    auto_check INTEGER NOT NULL,
);
