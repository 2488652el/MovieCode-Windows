mod commands;
mod media;
mod nas;
mod playback;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化日志
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .init();
    
    log::info!("Starting MovieCode application...");
    
    // 初始化数据库
    playback::init_db();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::scan_media_library,
            commands::get_media_file_url,
            commands::test_nas_connection,
            commands::browse_directory,
            commands::get_local_drives,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
