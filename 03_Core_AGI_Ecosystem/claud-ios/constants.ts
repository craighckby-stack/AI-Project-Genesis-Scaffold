export const CODE_FILES: Record<string, string> = {

  "claudiosinit.c": `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/mount.h>
#include <sys/wait.h>
#include <sys/reboot.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <errno.h>
#include <signal.h>
#include <sys/types.h>

#define LOG_FILE "/var/log/claudiosinit.log"
#define SUPERVISOR "/usr/local/bin/claudiossupervisor"
#define MAX_RETRIES 5

static FILE *logfp = NULL;

void log_msg(const char *msg) {
    if (logfp) { fprintf(logfp, "[INIT][%d] %s\\n", getpid(), msg); fflush(logfp); }
    printf("[INIT] %s\\n", msg);
}

void die(const char *msg) {
    log_msg(msg);
    sync();
    reboot(RB_HALT_SYSTEM);
}

int mount_fs(const char *src, const char *target, const char *type, unsigned long flags, const char *data) {
    if (mount(src, target, type, flags, data) < 0) {
        char err_buf[256];
        snprintf(err_buf, sizeof(err_buf), "Mount failed: %s to %s (%s)", src, target, strerror(errno));
        log_msg(err_buf);
        return -1;
    }
    return 0;
}

void setup_environment(void) {
    if (mkdir("/var/log", 0755) < 0 && errno != EEXIST) die("Failed to create log dir");
    logfp = fopen(LOG_FILE, "a+");
    if (!logfp) perror("Failed to open log file");
    
    if (mount_fs("proc", "/proc", "proc", 0, NULL) < 0) die("proc");
    if (mount_fs("sysfs", "/sys", "sysfs", 0, NULL) < 0) die("sysfs");
    if (mount_fs("devtmpfs", "/dev", "devtmpfs", 0, NULL) < 0) die("dev");
    if (mount_fs("tmpfs", "/run", "tmpfs", 0, "size=128m,mode=755") < 0) die("run");
    
    sethostname("claudiosos", 10);
}

pid_t spawn_process(const char *path, char *const argv[]) {
    pid_t pid = fork();
    if (pid < 0) return -1;
    if (pid == 0) {
        execv(path, argv);
        _exit(127);
    }
    return pid;
}

int main(void) {
    setup_environment();
    log_msg("ClaudIOS init sequence initialized.");
    
    char *sup_argv[] = { SUPERVISOR, NULL };
    pid_t sup_pid = -1;
    int retries = 0;

    while (1) {
        if (sup_pid <= 0) {
            if (retries++ > MAX_RETRIES) die("Supervisor failed to start repeatedly");
            sup_pid = spawn_process(SUPERVISOR, sup_argv);
            log_msg("Supervisor process spawned.");
        }

        int status;
        pid_t dead = waitpid(-1, &status, 0);
        if (dead == sup_pid) {
            log_msg("Supervisor terminated. Restarting...");
            sup_pid = -1;
        }
    }
    return 0;
}`,

  "supervisor.c": `#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>
#include <time.h>
#include <signal.h>
#include <errno.h>
#include <string.h>

#define AI_DAEMON    "/usr/local/bin/claudiosd"
#define PID_FILE     "/run/claudiosd.pid"
#define LOG_FILE     "/var/log/supervisor.log"
#define MAX_RESTARTS 10
#define RESTART_WINDOW 60
#define RESTART_DELAY  3

static FILE *logfp = NULL;
static volatile sig_atomic_t shutdown_requested = 0;

void log_msg(const char *msg) {
    time_t t = time(NULL);
    char ts[32];
    strftime(ts, sizeof(ts), "%Y-%m-%d %H:%M:%S", localtime(&t));
    if (logfp) { fprintf(logfp, "[%s][SUPERVISOR] %s\\n", ts, msg); fflush(logfp); }
    printf("[SUPERVISOR] %s\\n", msg);
}

void handle_signal(int sig) { shutdown_requested = 1; }

int write_pid(pid_t pid) {
    FILE *pf = fopen(PID_FILE, "w");
    if (!pf) return -1;
    fprintf(pf, "%d\\n", pid);
    fclose(pf);
    return 0;
}

pid_t launch_daemon(void) {
    pid_t pid = fork();
    if (pid < 0) return -1;
    if (pid == 0) {
        char *argv[] = { AI_DAEMON, NULL };
        execv(AI_DAEMON, argv);
        _exit(1);
    }
    write_pid(pid);
    return pid;
}

int main(void) {
    logfp = fopen(LOG_FILE, "a");
    struct sigaction sa;
    memset(&sa, 0, sizeof(sa));
    sa.sa_handler = handle_signal;
    sigaction(SIGTERM, &sa, NULL);
    sigaction(SIGINT, &sa, NULL);

    int restart_count = 0;
    time_t window_start = time(NULL);
    pid_t daemon_pid = launch_daemon();
    
    log_msg("Supervisor operational.");

    while (!shutdown_requested) {
        int status;
        pid_t dead = waitpid(daemon_pid, &status, WNOHANG);
        
        if (dead == daemon_pid) {
            time_t now = time(NULL);
            if (now - window_start > RESTART_WINDOW) {
                restart_count = 0;
                window_start = now;
            }
            
            if (++restart_count >= MAX_RESTARTS) {
                log_msg("Critical failure: Restart threshold exceeded.");
                break;
            }
            
            log_msg("Daemon crashed. Restarting...");
            sleep(RESTART_DELAY);
            daemon_pid = launch_daemon();
        }
        usleep(500000);
    }

    if (daemon_pid > 0) {
        kill(daemon_pid, SIGTERM);
        waitpid(daemon_pid, NULL, 0);
    }
    log_msg("Shutdown sequence complete.");
    return 0;
}`,

  "memory.py": `import sqlite3, uuid, time, os, logging
from pathlib import Path
from typing import List, Dict, Optional, Any

DB_PATH = '/var/lib/claudiosos/memory.db'
SCHEMA_VERSION = 1

class MemoryManager:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = Path(db_path)
        self._ensure_dir()
        self.conn = self._connect()
        self.session_id = str(uuid.uuid4())
        self._initialize_db()

    def _ensure_dir(self):
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _initialize_db(self):
        with self.conn:
            self.conn.executescript("""
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp INTEGER DEFAULT (unixepoch()),
                    role TEXT, content TEXT, session_id TEXT
                );
                CREATE TABLE IF NOT EXISTS facts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fact TEXT UNIQUE, confidence REAL DEFAULT 1.0
                );
            """)
            self._set_meta("version", str(SCHEMA_VERSION))

    def _set_meta(self, key: str, value: str):
        self.conn.execute("INSERT OR REPLACE INTO meta VALUES (?, ?)", (key, value))

    def log_interaction(self, role: str, content: str):
        try:
            self.conn.execute(
                "INSERT INTO conversations (role, content, session_id) VALUES (?, ?, ?)",
                (role, content, self.session_id)
            )
            self.conn.commit()
        except sqlite3.Error as e:
            logging.error(f"Database write error: {e}")

    def get_recent_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        cursor = self.conn.execute(
            "SELECT * FROM conversations ORDER BY id DESC LIMIT ?", (limit,)
        )
        return [dict(row) for row in cursor.fetchall()]

    def close(self):
        self.conn.close()`
};















