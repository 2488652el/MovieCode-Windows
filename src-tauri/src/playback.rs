use rusqlite::{Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::sync::Mutex;
use tauri::command;
use chrono::Utc;
use once_cell::sync::Lazy;

// 全局数据库连接
static DB_PATH: Lazy<Mutex<Option<Connection>>> = Lazy::new(|| Mutex::new(None));

// 字幕文件信息
#[derive(Debug, Serialize, Deserialize)]
pub struct SubtitleFile {
    pub path: String,
    pub name: String,
}

// 播放进度信息
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlaybackProgress {
    pub media_id: String,
    pub file_path: String,
    pub current_time: f64,
    pub duration: f64,
    pub last_watched: String,
}

// 初始化数据库
pub fn init_db() {
    let app_data_dir = dirs_next::data_local_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("MovieCode");
    
    fs::create_dir_all(&app_data_dir).ok();
    
    let db_file = app_data_dir.join("playback.db");
    log::info!("Initializing playback database at: {:?}", db_file);
    
    match Connection::open(&db_file) {
        Ok(conn) => {
            // 创建播放进度表
            conn.execute(
                "CREATE TABLE IF NOT EXISTS playback_progress (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    media_id TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    current_time REAL NOT NULL,
                    duration REAL NOT NULL,
                    last_watched TEXT NOT NULL,
                    UNIQUE(media_id, file_path)
                )",
                [],
            ).ok();
            
            // 创建字幕历史表
            conn.execute(
                "CREATE TABLE IF NOT EXISTS subtitle_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    video_path TEXT NOT NULL,
                    subtitle_path TEXT NOT NULL,
                    last_used TEXT NOT NULL,
                    UNIQUE(video_path, subtitle_path)
                )",
                [],
            ).ok();
            
            *DB_PATH.lock().unwrap() = Some(conn);
            log::info!("Playback database initialized successfully");
        }
        Err(e) => {
            log::error!("Failed to initialize database: {}", e);
        }
    }
}

// 获取数据库连接
fn get_db() -> Option<Connection> {
    DB_PATH.lock().unwrap().take()
}

// 搜索字幕文件
pub fn search_subtitle_files_impl(video_path: &str) -> Vec<SubtitleFile> {
    let path = Path::new(video_path);
    let parent = path.parent().unwrap_or(Path::new(""));
    let video_stem = path.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("");
    
    let mut subtitles = Vec::new();
    
    // 字幕扩展名
    let subtitle_extensions = ["srt", "ass", "ssa", "vtt", "sub", "sbu", "scr"];
    
    // 可能的字幕目录
    let subtitle_dirs = [
        parent.to_path_buf(),
        parent.join("Subs"),
        parent.join("字幕"),
        parent.join("subtitles"),
        parent.join("Subs"),
        parent.join(".."),
    ];
    
    for dir in &subtitle_dirs {
        if !dir.exists() || !dir.is_dir() {
            continue;
        }
        
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.filter_map(|e| e.ok()) {
                let entry_path = entry.path();
                
                // 检查是否是文件
                if !entry_path.is_file() {
                    continue;
                }
                
                // 检查扩展名
                let ext = entry_path.extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("")
                    .to_lowercase();
                
                if !subtitle_extensions.contains(&ext.as_str()) {
                    continue;
                }
                
                let file_name = entry_path.file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("")
                    .to_string();
                
                // 检查是否与视频同名
                let subtitle_stem = entry_path.file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("");
                
                if subtitle_stem.to_lowercase().contains(&video_stem.to_lowercase()) 
                    || video_stem.to_lowercase().contains(&subtitle_stem.to_lowercase())
                {
                    subtitles.push(SubtitleFile {
                        path: entry_path.to_string_lossy().to_string(),
                        name: file_name,
                    });
                }
            }
        }
    }
    
    subtitles
}

// 保存播放进度
pub fn save_progress_impl(media_id: &str, file_path: &str, current_time: f64, duration: f64) -> SqliteResult<()> {
    if let Some(conn) = get_db() {
        let now = Utc::now().to_rfc3339();
        
        conn.execute(
            "INSERT OR REPLACE INTO playback_progress (media_id, file_path, current_time, duration, last_watched)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![media_id, file_path, current_time, duration, now],
        )?;
        
        log::info!("Saved playback progress for {}: {} / {}", media_id, current_time, duration);
    }
    Ok(())
}

// 获取播放进度
pub fn get_progress_impl(media_id: &str, file_path: &str) -> Option<PlaybackProgress> {
    if let Some(conn) = get_db() {
        let mut stmt = conn.prepare(
            "SELECT media_id, file_path, current_time, duration, last_watched 
             FROM playback_progress 
             WHERE media_id = ?1 AND file_path = ?2"
        ).ok()?;
        
        let progress = stmt.query_row(
            rusqlite::params![media_id, file_path],
            |row| {
                Ok(PlaybackProgress {
                    media_id: row.get(0)?,
                    file_path: row.get(1)?,
                    current_time: row.get(2)?,
                    duration: row.get(3)?,
                    last_watched: row.get(4)?,
                })
            },
        );
        
        return progress.ok();
    }
    None
}

// Tauri 命令：搜索字幕文件
#[command]
pub fn search_subtitle_files(video_path: String) -> Vec<SubtitleFile> {
    log::info!("Searching subtitle files for: {}", video_path);
    search_subtitle_files_impl(&video_path)
}

// Tauri 命令：打开字幕文件对话框
#[command]
pub fn open_subtitle_file_dialog() -> Option<String> {
    use tauri_plugin_dialog::DialogExt;
    
    // 注意：这里需要通过前端调用对话框
    // 返回 None 让前端处理
    None
}

// Tauri 命令：保存播放进度
#[command]
pub fn save_playback_progress(media_id: String, file_path: String, current_time: f64, duration: f64) -> Result<(), String> {
    log::info!("Saving playback progress for media_id: {}", media_id);
    save_progress_impl(&media_id, &file_path, current_time, duration)
        .map_err(|e| e.to_string())
}

// Tauri 命令：获取播放进度
#[command]
pub fn get_playback_progress(media_id: String, file_path: String) -> Option<PlaybackProgress> {
    log::info!("Getting playback progress for media_id: {}", media_id);
    get_progress_impl(&media_id, &file_path)
}
