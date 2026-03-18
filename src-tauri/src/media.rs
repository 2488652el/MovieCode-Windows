use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;
use regex::Regex;
use chrono::Utc;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MediaFile {
    pub id: String,
    pub title: String,
    pub original_title: Option<String>,
    pub media_type: String, // movie, tv, anime
    pub year: Option<i32>,
    pub season: Option<i32>,
    pub episode: Option<i32>,
    pub file_path: String,
    pub file_name: String,
    pub file_size: u64,
    pub extension: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanResult {
    pub total_files: usize,
    pub movies: Vec<MediaFile>,
    pub tv_shows: Vec<MediaFile>,
    pub anime: Vec<MediaFile>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NasConnection {
    pub id: String,
    pub name: String,
    pub connection_type: String, // smb, nfs, webdav, local
    pub host: Option<String>,
    pub port: Option<u16>,
    pub share: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub base_path: String,
}

pub fn parse_media_filename(filename: &str) -> MediaFile {
    let path = Path::new(filename);
    let file_name = path.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_string();
    let extension = path.extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();

    // 媒体文件扩展名
    let media_extensions = ["mkv", "mp4", "avi", "mov", "wmv", "flv", "webm", "m4v", "ts"];
    
    if !media_extensions.contains(&extension.as_str()) {
        return MediaFile {
            id: Uuid::new_v4().to_string(),
            title: file_name.clone(),
            original_title: None,
            media_type: "unknown".to_string(),
            year: None,
            season: None,
            episode: None,
            file_path: filename.to_string(),
            file_name,
            file_size: 0,
            extension,
            created_at: Utc::now().to_rfc3339(),
            updated_at: Utc::now().to_rfc3339(),
        };
    }

    // 电影匹配模式
    let movie_patterns = [
        // Pattern: Title.YEAR.Quality.Ext
        r"^(.+?)[.\s](\d{4})[.\s]",
        // Pattern: Title (YEAR).Ext
        r"^(.+?)\s*\((\d{4})\)\s*",
        // Pattern: Title-YEAR-Quality.Ext
        r"^(.+?)[.\s-](\d{4})[.\s-]",
    ];

    // 剧集匹配模式
    let tv_patterns = [
        // Pattern: Title.S01E01.Ext or Title.S01.E01.Ext
        r"^(.+?)[.\s]S(\d{2})E(\d{2})",
        r"^(.+?)[.\s](\d{1,2})x(\d{2})",
        // Pattern: Title - 01x01 - Episode Title
        r"^(.+?)\s*-\s*(\d{1,2})x(\d{2})\s*-",
        // Pattern: Title 01 01 Quality
        r"^(.+?)[.\s](\d{2})[.\s](\d{2})[.\s]",
    ];

    let file_path = filename.to_string();
    let mut media_type = "movie".to_string();
    let mut title = file_name.clone();
    let mut year: Option<i32> = None;
    let mut season: Option<i32> = None;
    let mut episode: Option<i32> = None;

    // 尝试匹配剧集模式
    for pattern in tv_patterns.iter() {
        if let Ok(re) = Regex::new(pattern) {
            if let Some(caps) = re.captures(&file_name) {
                title = caps.get(1)
                    .map(|m| m.as_str().trim().replace('.', " ").replace('_', " "))
                    .unwrap_or_else(|| file_name.clone());
                
                if let Some(s) = caps.get(2) {
                    season = s.as_str().parse().ok();
                }
                if let Some(e) = caps.get(3) {
                    episode = e.as_str().parse().ok();
                }
                
                media_type = "tv".to_string();
                break;
            }
        }
    }

    // 如果没匹配到剧集，尝试匹配电影
    if media_type == "movie" {
        for pattern in movie_patterns.iter() {
            if let Ok(re) = Regex::new(pattern) {
                if let Some(caps) = re.captures(&file_name) {
                    title = caps.get(1)
                        .map(|m| m.as_str().trim().replace('.', " ").replace('_', " "))
                        .unwrap_or_else(|| file_name.clone());
                    
                    if let Some(y) = caps.get(2) {
                        year = y.as_str().parse().ok();
                    }
                    break;
                }
            }
        }
    }

    // 检测动漫关键词
    let anime_keywords = ["anime", "动漫", "韩剧", "korean drama", "bd", "ass", "chs", "cht", "jpn"];
    for keyword in anime_keywords.iter() {
        if file_name.to_lowercase().contains(keyword) {
            if media_type == "tv" {
                media_type = "anime".to_string();
            }
            break;
        }
    }

    // 获取文件大小
    let file_size = fs::metadata(&file_path)
        .map(|m| m.len())
        .unwrap_or(0);

    MediaFile {
        id: Uuid::new_v4().to_string(),
        title,
        original_title: None,
        media_type,
        year,
        season,
        episode,
        file_path,
        file_name,
        file_size,
        extension,
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
    }
}

pub fn scan_directory(path: &str, exclude_patterns: &[String]) -> ScanResult {
    let mut movies: Vec<MediaFile> = Vec::new();
    let mut tv_shows: Vec<MediaFile> = Vec::new();
    let mut anime: Vec<MediaFile> = Vec::new();
    let mut total_files = 0;

    let walker = WalkDir::new(path)
        .follow_links(true)
        .into_iter()
        .filter_entry(|entry| {
            let path_str = entry.path().to_string_lossy().to_lowercase();
            // 排除隐藏目录和系统目录
            !path_str.contains("$")
                && !path_str.contains("@ea_dir")
                && !path_str.contains(".thumb")
        });

    for entry in walker.filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            let file_path = entry.path().to_string_lossy().to_string();
            
            // 跳过排除的模式
            let should_exclude = exclude_patterns.iter().any(|pattern| {
                file_path.to_lowercase().contains(&pattern.to_lowercase())
            });
            
            if should_exclude {
                continue;
            }

            let media = parse_media_filename(&file_path);
            
            if media.media_type == "movie" {
                movies.push(media);
            } else if media.media_type == "tv" {
                tv_shows.push(media);
            } else if media.media_type == "anime" {
                anime.push(media);
            }
            
            total_files += 1;
        }
    }

    ScanResult {
        total_files,
        movies,
        tv_shows,
        anime,
    }
}

pub fn get_file_url(path: &str) -> String {
    // 将本地路径转换为file:// URL
    let encoded = path.replace('\\', "/");
    format!("file:///{}", encoded)
}
