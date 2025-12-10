// Engine configuration management
// Handles reading/writing engine-config.json and model pack definitions

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::api::path::app_data_dir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelPack {
    pub label: String,
    pub analysis_model: String,
    pub report_model: String,
    pub embedding_model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineConfig {
    pub provider: String,
    pub base_url: String,
    pub active_pack_id: Option<String>,
    pub packs: std::collections::HashMap<String, ModelPack>,
}

impl Default for EngineConfig {
    fn default() -> Self {
        let mut packs = std::collections::HashMap::new();

        // Light Fast pack
        packs.insert(
            "light_fast".to_string(),
            ModelPack {
                label: "Fast & Light".to_string(),
                analysis_model: "qwen3:4b".to_string(),
                report_model: "qwen3:4b".to_string(),
                embedding_model: "qwen3-embedding:4b".to_string(),
            },
        );

        // Analyst Fast pack (recommended)
        packs.insert(
            "analyst_fast".to_string(),
            ModelPack {
                label: "Analyst Pack (Recommended)".to_string(),
                analysis_model: "gurubot/glm-4.6v-flash-gguf:q4_k_m".to_string(),
                report_model: "gurubot/glm-4.6v-flash-gguf:q4_k_m".to_string(),
                embedding_model: "qwen3-embedding:4b".to_string(),
            },
        );

        Self {
            provider: "ollama".to_string(),
            base_url: "http://127.0.0.1:11434".to_string(),
            active_pack_id: Some("analyst_fast".to_string()),
            packs,
        }
    }
}

pub fn get_config_path() -> Result<PathBuf, String> {
    // Use a simpler approach - store in app data directory
    // We'll get the path from Tauri's app data dir helper
    let app_data = std::env::var("APPDATA")
        .or_else(|_| std::env::var("LOCALAPPDATA"))
        .map_err(|_| "Failed to get app data directory".to_string())?;

    let engine_dir = PathBuf::from(app_data).join("DataConfessional").join("engine");

    // Create engine directory if it doesn't exist
    if !engine_dir.exists() {
        fs::create_dir_all(&engine_dir)
            .map_err(|e| format!("Failed to create engine directory: {}", e))?;
    }

    Ok(engine_dir.join("engine-config.json"))
}

pub fn load_config() -> Result<EngineConfig, String> {
    let config_path = get_config_path()?;

    if !config_path.exists() {
        // Return default config if file doesn't exist
        let default_config = EngineConfig::default();
        save_config(&default_config)?;
        return Ok(default_config);
    }

    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config file: {}", e))?;

    let config: EngineConfig = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse config: {}", e))?;

    Ok(config)
}

pub fn save_config(config: &EngineConfig) -> Result<(), String> {
    let config_path = get_config_path()?;

    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config file: {}", e))?;

    Ok(())
}

pub fn get_active_pack(config: &EngineConfig) -> Option<&ModelPack> {
    config.active_pack_id.as_ref()
        .and_then(|id| config.packs.get(id))
}

