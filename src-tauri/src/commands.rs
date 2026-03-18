use tauri::command;
use crate::media::{self, ScanResult};
use crate::nas::{FileInfo, DriveInfo, NasConfig, NasConnectionResult, test_local_path, test_smb_connection, test_webdav_connection, list_directory, get_available_drives};

#[command]
pub fn scan_media_library(path: String, exclude_patterns: Vec<String>) -> ScanResult {
    log::info!("Scanning media library: {}", path);
    media::scan_directory(&path, &exclude_patterns)
}

#[command]
pub fn get_media_file_url(path: String) -> String {
    media::get_file_url(&path)
}

#[command]
pub fn test_nas_connection(config: NasConfig) -> NasConnectionResult {
    log::info!("Testing NAS connection: {} ({})", config.name, config.nas_type);
    
    let result = match config.nas_type.as_str() {
        "local" => {
            let base_path = config.base_path.as_deref().unwrap_or("C:\\");
            test_local_path(base_path)
        }
        "smb" => {
            let host = config.host.as_deref().unwrap_or("localhost");
            let port = config.port.unwrap_or(445);
            test_smb_connection(host, port)
        }
        "webdav" => {
            let base_path = config.base_path.as_deref().unwrap_or("");
            let url = if base_path.starts_with("http") {
                base_path.to_string()
            } else {
                format!("http://{}:{}/{}", 
                    config.host.unwrap_or_else(|| "localhost".to_string()),
                    config.port.unwrap_or(8080),
                    base_path
                )
            };
            test_webdav_connection(&url, 
                config.username.as_deref().unwrap_or(""),
                config.password.as_deref().unwrap_or("")
            )
        }
        _ => Err("Unsupported connection type".to_string()),
    };

    let (success, message) = match result {
        Ok(_) => (true, "Connection successful".to_string()),
        Err(e) => (false, e),
    };

    NasConnectionResult {
        success,
        message,
        connection_id: config.id,
    }
}

#[command]
pub fn browse_directory(path: String) -> Result<Vec<FileInfo>, String> {
    log::info!("Browsing directory: {}", path);
    list_directory(&path)
}

#[command]
pub fn get_local_drives() -> Vec<DriveInfo> {
    get_available_drives()
}
