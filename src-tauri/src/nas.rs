use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::net::TcpStream;
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NasConfig {
    pub id: String,
    pub name: String,
    pub nas_type: String,
    pub host: Option<String>,
    pub port: Option<u16>,
    pub share: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub base_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NasConnectionResult {
    pub success: bool,
    pub message: String,
    pub connection_id: String,
}

pub fn test_smb_connection(host: &str, port: u16) -> Result<bool, String> {
    let address = format!("{}:{}", host, port);
    match TcpStream::connect_timeout(
        &address.parse().map_err(|e| format!("Invalid address: {}", e))?,
        Duration::from_secs(5)
    ) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Connection failed: {}", e)),
    }
}

pub fn test_webdav_connection(url: &str, username: &str, password: &str) -> Result<bool, String> {
    let client = reqwest::blocking::Client::new();
    let response = client
        .request(reqwest::Method::from_bytes(b"PROPFIND").unwrap(), url)
        .basic_auth(username, Some(password))
        .header("Depth", "0")
        .timeout(Duration::from_secs(10))
        .send();

    match response {
        Ok(resp) => {
            if resp.status().is_success() || resp.status().as_u16() == 207 {
                Ok(true)
            } else {
                Err(format!("HTTP {}", resp.status()))
            }
        }
        Err(e) => Err(format!("Request failed: {}", e)),
    }
}

pub fn test_local_path(path: &str) -> Result<bool, String> {
    let p = Path::new(path);
    if p.exists() && p.is_dir() {
        Ok(true)
    } else {
        Err(format!("Path does not exist or is not a directory: {}", path))
    }
}

pub fn list_directory(path: &str) -> Result<Vec<FileInfo>, String> {
    let p = Path::new(path);
    if !p.exists() {
        return Err("Path does not exist".to_string());
    }
    
    let mut files: Vec<FileInfo> = Vec::new();
    
    match fs::read_dir(p) {
        Ok(entries) => {
            for entry in entries.filter_map(|e| e.ok()) {
                let file_path = entry.path();
                let metadata = entry.metadata().ok();
                
                files.push(FileInfo {
                    name: entry.file_name().to_string_lossy().to_string(),
                    path: file_path.to_string_lossy().to_string(),
                    is_directory: file_path.is_dir(),
                    size: metadata.as_ref().map(|m| m.len()).unwrap_or(0),
                    modified: metadata
                        .and_then(|m| m.modified().ok())
                        .map(|t| {
                            let datetime: chrono::DateTime<chrono::Utc> = t.into();
                            datetime.to_rfc3339()
                        }),
                });
            }
        }
        Err(e) => return Err(format!("Failed to read directory: {}", e)),
    }
    
    files.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.cmp(&b.name),
        }
    });
    
    Ok(files)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub size: u64,
    pub modified: Option<String>,
}

pub fn get_available_drives() -> Vec<DriveInfo> {
    let mut drives = Vec::new();
    
    #[cfg(target_os = "windows")]
    {
        for letter in b'A'..=b'Z' {
            let drive_path = format!("{}:\\", letter as char);
            let path = Path::new(&drive_path);
            if path.exists() {
                drives.push(DriveInfo {
                    letter: format!("{}:", letter as char),
                    path: drive_path,
                    drive_type: "Fixed".to_string(),
                });
            }
        }
    }
    
    drives
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DriveInfo {
    pub letter: String,
    pub path: String,
    pub drive_type: String,
}
