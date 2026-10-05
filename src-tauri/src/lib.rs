use tauri::Manager;

#[tauri::command]
fn is_smoke_mode() -> bool {
    std::env::var_os("ORBIT_SMOKE_REPORT").is_some()
}

#[tauri::command]
fn smoke_report(app: tauri::AppHandle, result: serde_json::Value) -> Result<(), String> {
    let path = std::env::var("ORBIT_SMOKE_REPORT").map_err(|_| "Smoke mode is disabled")?;
    let storage = app.path().app_data_dir().map_err(|e| e.to_string())?.join("orbit.json");
    let mut report = result;
    report["nativeStoreExists"] = serde_json::json!(storage.exists());
    report["platform"] = serde_json::json!(std::env::consts::OS);
    report["version"] = serde_json::json!(app.package_info().version.to_string());
    std::fs::write(path, serde_json::to_vec_pretty(&report).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    app.exit(0);
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![is_smoke_mode, smoke_report])
        .run(tauri::generate_context!())
        .expect("Could not start Orbit");
}
