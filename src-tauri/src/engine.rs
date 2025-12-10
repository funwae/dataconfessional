// Engine module for Ollama integration
// Handles health checks, model pack installation, and chat/report generation

use crate::engine_config::{self, EngineConfig, ModelPack};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;
use tauri::Window;
use futures_util::StreamExt;

const OLLAMA_TIMEOUT: Duration = Duration::from_secs(5);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineHealth {
    pub ollama_available: bool,
    pub engine_configured: bool,
    pub active_pack_id: Option<String>,
    pub missing_models: Vec<String>,
    pub gpu_summary: Option<GpuSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuSummary {
    pub vendor: String,
    pub vram_gb: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineChatRequest {
    pub role: String, // "analysis" | "gossip"
    pub question: String,
    pub context_summary: String,
    pub project_meta: ProjectMeta,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMeta {
    pub name: String,
    pub audience: String, // "self" | "team" | "exec"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineReportRequest {
    pub template_type: String,
    pub audience: String,
    pub data_summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineReportResponse {
    pub markdown: String,
    pub model_name: String,
}

// Check if Ollama is available
async fn check_ollama_available(base_url: &str) -> bool {
    let client = reqwest::Client::builder()
        .timeout(OLLAMA_TIMEOUT)
        .build();

    match client {
        Ok(c) => {
            match c.get(format!("{}/api/tags", base_url)).send().await {
                Ok(resp) => resp.status().is_success(),
                Err(_) => false,
            }
        }
        Err(_) => false,
    }
}

// Get list of installed models from Ollama
async fn get_installed_models(base_url: &str) -> Result<Vec<String>, String> {
    let client = reqwest::Client::builder()
        .timeout(OLLAMA_TIMEOUT)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .get(format!("{}/api/tags", base_url))
        .send()
        .await
        .map_err(|e| format!("Failed to connect to Ollama: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Ollama returned status: {}", response.status()));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

    let models = json
        .get("models")
        .and_then(|m| m.as_array())
        .ok_or("Invalid response format from Ollama")?;

    let model_names: Vec<String> = models
        .iter()
        .filter_map(|m| {
            m.get("name").and_then(|n| n.as_str()).map(|s| s.to_string())
        })
        .collect();

    Ok(model_names)
}

// Check which models are missing from a pack
fn check_missing_models(pack: &ModelPack, installed: &[String]) -> Vec<String> {
    let mut missing = Vec::new();

    let required = vec![
        pack.analysis_model.clone(),
        pack.report_model.clone(),
        pack.embedding_model.clone(),
    ];

    for model in required {
        if !installed.contains(&model) {
            missing.push(model);
        }
    }

    missing
}

#[tauri::command]
pub async fn engine_health() -> Result<EngineHealth, String> {
    let config = engine_config::load_config()?;
    let base_url = &config.base_url;

    let ollama_available = check_ollama_available(base_url).await;

    let mut engine_configured = false;
    let mut missing_models = Vec::new();

    if ollama_available {
        let installed = get_installed_models(base_url).await.unwrap_or_default();

        if let Some(pack_id) = &config.active_pack_id {
            if let Some(pack) = engine_config::get_active_pack(&config) {
                missing_models = check_missing_models(pack, &installed);
                engine_configured = missing_models.is_empty();
            }
        }
    }

    // Basic GPU detection (simplified - can be enhanced later)
    let gpu_summary = Some(GpuSummary {
        vendor: "unknown".to_string(),
        vram_gb: None,
    });

    Ok(EngineHealth {
        ollama_available,
        engine_configured,
        active_pack_id: config.active_pack_id.clone(),
        missing_models,
        gpu_summary,
    })
}

#[tauri::command]
pub async fn engine_install_pack(pack_id: String) -> Result<EngineHealth, String> {
    let mut config = engine_config::load_config()?;
    let base_url = &config.base_url;

    // Check if Ollama is available
    if !check_ollama_available(base_url).await {
        return Err("Ollama is not available. Please install and start Ollama first.".to_string());
    }

    // Get the pack
    let pack = config.packs.get(&pack_id)
        .ok_or(format!("Pack '{}' not found", pack_id))?;

    // Install each model
    let models_to_install = vec![
        pack.analysis_model.clone(),
        pack.report_model.clone(),
        pack.embedding_model.clone(),
    ];

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(300)) // 5 minutes for model downloads
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    for model in models_to_install {
        // Use Ollama's pull API
        let pull_url = format!("{}/api/pull", base_url);
        let pull_body = serde_json::json!({
            "name": model,
            "stream": false
        });

        let response = client
            .post(&pull_url)
            .json(&pull_body)
            .send()
            .await
            .map_err(|e| format!("Failed to pull model {}: {}", model, e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to pull model {}: {}", model, response.status()));
        }
    }

    // Update active pack
    config.active_pack_id = Some(pack_id);
    engine_config::save_config(&config)?;

    // Return updated health
    engine_health().await
}

#[tauri::command]
pub async fn engine_chat(
    request: EngineChatRequest,
    window: Window,
) -> Result<String, String> {
    let config = engine_config::load_config()?;
    let base_url = &config.base_url;

    // Get active pack
    let pack = engine_config::get_active_pack(&config)
        .ok_or("No active engine pack configured".to_string())?;

    // Select model based on role
    let model = match request.role.as_str() {
        "analysis" | "gossip" => &pack.analysis_model,
        _ => &pack.analysis_model,
    };

    // Build system prompt
    let system_prompt = build_system_prompt(&request.role, &request.project_meta.audience);

    // Build user prompt
    let user_prompt = build_user_prompt(
        &request.question,
        &request.context_summary,
        &request.project_meta,
    );

    // Call Ollama
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(90))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let chat_url = format!("{}/v1/chat/completions", base_url);
    let chat_body = serde_json::json!({
        "model": model,
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": user_prompt }
        ],
        "stream": true,
        "temperature": 0.8,
        "top_p": 0.6,
        "top_k": 2,
    });

    let mut response = client
        .post(&chat_url)
        .json(&chat_body)
        .send()
        .await
        .map_err(|e| format!("Failed to call Ollama: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Ollama error: {}", error_text));
    }

    // Stream response
    let mut full_content = String::new();
    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream error: {}", e))?;
        let text = String::from_utf8_lossy(&chunk);

        // Parse SSE format
        for line in text.lines() {
            if line.starts_with("data: ") {
                let data = &line[6..];
                if data == "[DONE]" {
                    continue;
                }

                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(choices) = json.get("choices").and_then(|c| c.as_array()) {
                        if let Some(choice) = choices.get(0) {
                            if let Some(delta) = choice.get("delta") {
                                if let Some(content) = delta.get("content").and_then(|c| c.as_str()) {
                                    full_content.push_str(content);

                                    // Emit chunk event
                                    window.emit("engine_chat_chunk", content)
                                        .map_err(|e| format!("Failed to emit chunk: {}", e))?;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Emit done event
    window.emit("engine_chat_done", ())
        .map_err(|e| format!("Failed to emit done: {}", e))?;

    Ok(full_content)
}

#[tauri::command]
pub async fn engine_generate_report(
    request: EngineReportRequest,
) -> Result<EngineReportResponse, String> {
    let config = engine_config::load_config()?;
    let base_url = &config.base_url;

    // Get active pack
    let pack = engine_config::get_active_pack(&config)
        .ok_or("No active engine pack configured".to_string())?;

    let model = &pack.report_model;

    // Build prompt
    let prompt = build_report_prompt(&request.template_type, &request.audience, &request.data_summary);

    // Call Ollama
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(120))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let chat_url = format!("{}/v1/chat/completions", base_url);
    let chat_body = serde_json::json!({
        "model": model,
        "messages": [
            { "role": "user", "content": prompt }
        ],
        "stream": false,
        "temperature": 0.7,
        "top_p": 0.8,
    });

    let response = client
        .post(&chat_url)
        .json(&chat_body)
        .send()
        .await
        .map_err(|e| format!("Failed to call Ollama: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Ollama error: {}", error_text));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let content = json
        .get("choices")
        .and_then(|c| c.as_array())
        .and_then(|c| c.get(0))
        .and_then(|c| c.get("message"))
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
        .ok_or("Invalid response format")?;

    Ok(EngineReportResponse {
        markdown: content.to_string(),
        model_name: model.clone(),
    })
}

// Helper functions for prompt building

fn build_system_prompt(role: &str, audience: &str) -> String {
    let base = "You are the analysis engine inside a desktop app called Data Confessional.
The app helps business users turn raw data into honest summaries, dashboards, and reports.

You always:
- Focus only on the data and context provided.
- Separate what the data clearly shows from what is speculative.
- Mention gaps or missing information explicitly.
- Use concise, plain language.

When asked to answer questions about data, use this structure:

CONFESSION: A direct, one-paragraph answer.
EVIDENCE: Bullet points with exact numbers and references to tables or charts.
CAVEATS: Any uncertainties, missing segments, or data limitations.";

    if role == "gossip" {
        format!("{}\n\nSTYLE:\n- Keep the same structure (CONFESSION / EVIDENCE / CAVEATS).\n- In CONFESSION, you may use more playful, \"data gossip\" style phrasing.\n- EVIDENCE and CAVEATS must stay serious and precise.", base)
    } else {
        base.to_string()
    }
}

fn build_user_prompt(question: &str, context_summary: &str, project_meta: &ProjectMeta) -> String {
    format!(
        "CONTEXT:
- Project name: {}
- Intended audience: {}
- Data summary:

{}

TASK:

Answer the user's question about this project using ONLY the context above.
Use the output structure:

CONFESSION:

...

EVIDENCE:

- ...

CAVEATS:

- ...

QUESTION:

{}",
        project_meta.name, project_meta.audience, context_summary, question
    )
}

fn build_report_prompt(template_type: &str, audience: &str, data_summary: &str) -> String {
    format!(
        "You are drafting a report for Data Confessional.

PROJECT DATA:

{}

REPORT TEMPLATE:

- Type: {}
- Audience: {}  (one of: self, team, exec)

Write a markdown report following this structure:

# Title

## Executive Summary

- 3–5 bullets describing the main truths the data reveals.

## Key Findings

- Short paragraphs for each major insight.
- Include concrete numbers where possible.

## Supporting Evidence

- Bullet lists tying findings to specific metrics, tables, or charts.

## Risks and Questions

- 3–5 bullets.

## Next Steps

- 3–5 recommended actions.

Constraints:

- Do not invent data you do not see in PROJECT DATA.
- Call out missing or incomplete data under \"Risks and Questions\".",
        data_summary, template_type, audience
    )
}

