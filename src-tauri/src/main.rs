// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod api_key;
mod engine;
mod engine_config;

use tauri::Manager;

#[tauri::command]
fn store_api_key(key: String) -> Result<(), String> {
    api_key::store_api_key(&key)
}

#[tauri::command]
fn get_api_key() -> Result<String, String> {
    api_key::get_api_key()
}

#[tauri::command]
fn has_api_key() -> bool {
    api_key::has_api_key()
}

#[tauri::command]
fn delete_api_key() -> Result<(), String> {
    api_key::delete_api_key()
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      store_api_key,
      get_api_key,
      has_api_key,
      delete_api_key,
      engine::engine_health,
      engine::engine_install_pack,
      engine::engine_chat,
      engine::engine_generate_report,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
