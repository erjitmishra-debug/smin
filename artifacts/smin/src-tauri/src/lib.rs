use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::{
    fs::{self, File},
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
    sync::Mutex,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{Manager, State};
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
enum SminError {
    #[error("database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("filesystem error: {0}")]
    Filesystem(#[from] std::io::Error),
    #[error("invalid project name or path")]
    InvalidProjectPath,
    #[error("project metadata is missing or corrupt")]
    InvalidMetadata,
    #[error("project is not open")]
    ProjectNotOpen,
    #[error("project already exists")]
    ProjectAlreadyExists,
    #[error("invalid CSV: {0}")]
    InvalidCsv(String),
}

impl Serialize for SminError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[derive(Default)]
struct AppState {
    db: Mutex<Option<Connection>>,
    project_dir: Mutex<Option<PathBuf>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ProjectInput {
    name: String,
    commodity: String,
    epsg: i32,
    description: String,
    folder: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ProjectRecord {
    id: String,
    name: String,
    commodity: String,
    epsg: i32,
    folder: String,
}

#[derive(Debug, Serialize)]
struct CommandResponse<T> {
    ok: bool,
    data: T,
    message: String,
}

#[derive(Debug, Serialize)]
struct ImportSummary {
    rows: usize,
    errors: usize,
    source: String,
}

#[derive(Debug, Serialize)]
struct AuditEntry {
    id: String,
    action: String,
    details: String,
    created_at: String,
}

fn success<T>(data: T, message: impl Into<String>) -> CommandResponse<T> {
    CommandResponse { ok: true, data, message: message.into() }
}

fn now() -> String {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs().to_string()
}

fn validate_folder_name(name: &str) -> Result<(), SminError> {
    if name.trim().is_empty()
        || name == "."
        || name == ".."
        || name.chars().any(|character| matches!(character, '/' | '\\' | ':'))
        || name.chars().any(|c| c.is_control())
    {
        return Err(SminError::InvalidProjectPath);
    }
    Ok(())
}

fn project_folders(project: &Path) -> [&'static str; 15] {
    [
        "data/collars", "data/surveys", "data/geology", "data/assays",
        "data/density", "imports", "boundaries", "gis", "surfaces",
        "models", "reports", "logs", "backups", "temp", "",
    ]
}

fn create_project_folders_impl(project: &Path) -> Result<(), SminError> {
    for child in project_folders(project) {
        fs::create_dir_all(project.join(child))?;
    }
    Ok(())
}

fn initialize_project_database_impl(path: &Path) -> Result<Connection, SminError> {
    let conn = Connection::open(path)?;
    conn.execute_batch(
        "PRAGMA foreign_keys = ON;
         PRAGMA journal_mode = WAL;
         CREATE TABLE IF NOT EXISTS projects (
           id TEXT PRIMARY KEY, name TEXT NOT NULL, commodity TEXT NOT NULL,
           epsg INTEGER NOT NULL, description TEXT NOT NULL DEFAULT '',
           folder TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS imports (
           id TEXT PRIMARY KEY, project_id TEXT NOT NULL, source_name TEXT NOT NULL,
           mapping_json TEXT NOT NULL, row_count INTEGER NOT NULL, error_count INTEGER NOT NULL,
           created_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS audit_log (
           id TEXT PRIMARY KEY, project_id TEXT NOT NULL, action TEXT NOT NULL,
           details TEXT NOT NULL, created_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS processing_log (
           id TEXT PRIMARY KEY, project_id TEXT NOT NULL, job_type TEXT NOT NULL,
           status TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL
         );",
    )?;
    Ok(conn)
}

fn read_metadata(path: &Path) -> Result<ProjectRecord, SminError> {
    let file = File::open(path.join("project.smin")).map_err(|_| SminError::InvalidMetadata)?;
    serde_json::from_reader(file).map_err(|_| SminError::InvalidMetadata)
}

fn write_metadata(path: &Path, record: &ProjectRecord) -> Result<(), SminError> {
    let file = File::create(path.join("project.smin"))?;
    serde_json::to_writer_pretty(file, record).map_err(|_| SminError::InvalidMetadata)
}

fn open_state(state: &State<'_, AppState>, path: PathBuf, record: ProjectRecord, conn: Connection) {
    *state.db.lock().unwrap() = Some(conn);
    *state.project_dir.lock().unwrap() = Some(path);
    let _ = record;
}

#[tauri::command]
fn create_project_folders(root: String, folder: String) -> Result<CommandResponse<String>, SminError> {
    validate_folder_name(&folder)?;
    let project = Path::new(&root).join(&folder);
    if project.exists() {
        return Err(SminError::ProjectAlreadyExists);
    }
    create_project_folders_impl(&project)?;
    Ok(success(project.to_string_lossy().to_string(), "Project folders created"))
}

#[tauri::command]
fn initialize_project_database(project_path: String) -> Result<CommandResponse<String>, SminError> {
    let path = Path::new(&project_path);
    create_project_folders_impl(path)?;
    let _ = initialize_project_database_impl(&path.join("project.db"))?;
    Ok(success(path.join("project.db").to_string_lossy().to_string(), "Project database initialized"))
}

#[tauri::command]
fn create_project(
    state: State<'_, AppState>,
    root: String,
    input: ProjectInput,
) -> Result<CommandResponse<ProjectRecord>, SminError> {
    validate_folder_name(&input.folder)?;
    if input.epsg <= 0 || input.name.trim().is_empty() {
        return Err(SminError::InvalidMetadata);
    }
    let project = Path::new(&root).join(&input.folder);
    if project.exists() {
        return Err(SminError::ProjectAlreadyExists);
    }
    create_project_folders_impl(&project)?;
    let conn = initialize_project_database_impl(&project.join("project.db"))?;
    let record = ProjectRecord {
        id: Uuid::new_v4().to_string(),
        name: input.name,
        commodity: input.commodity,
        epsg: input.epsg,
        folder: project.to_string_lossy().to_string(),
    };
    let timestamp = now();
    conn.execute(
        "INSERT INTO projects (id,name,commodity,epsg,description,folder,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)",
        params![&record.id, &record.name, &record.commodity, record.epsg, &input.description, &record.folder, &timestamp, &timestamp],
    )?;
    write_metadata(&project, &record)?;
    open_state(&state, project, record.clone(), conn);
    Ok(success(record, "Project created and database initialized"))
}

#[tauri::command]
fn open_project(
    state: State<'_, AppState>,
    project_path: String,
) -> Result<CommandResponse<ProjectRecord>, SminError> {
    let path = PathBuf::from(project_path);
    let record = read_metadata(&path)?;
    let conn = initialize_project_database_impl(&path.join("project.db"))?;
    open_state(&state, path, record.clone(), conn);
    Ok(success(record, "Project opened"))
}

#[tauri::command]
fn save_project(state: State<'_, AppState>) -> Result<CommandResponse<bool>, SminError> {
    let db = state.db.lock().unwrap();
    let conn = db.as_ref().ok_or(SminError::ProjectNotOpen)?;
    conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);")?;
    Ok(success(true, "Project saved"))
}

#[tauri::command]
fn close_project(state: State<'_, AppState>) -> Result<CommandResponse<bool>, SminError> {
    let mut db = state.db.lock().unwrap();
    if let Some(conn) = db.as_ref() {
        conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);")?;
    }
    *db = None;
    *state.project_dir.lock().unwrap() = None;
    Ok(success(true, "Project closed"))
}

#[tauri::command]
fn read_project_metadata(project_path: String) -> Result<CommandResponse<ProjectRecord>, SminError> {
    Ok(success(read_metadata(Path::new(&project_path))?, "Metadata read"))
}

#[tauri::command]
fn write_project_metadata(
    state: State<'_, AppState>,
    record: ProjectRecord,
) -> Result<CommandResponse<ProjectRecord>, SminError> {
    let path = state.project_dir.lock().unwrap().clone().ok_or(SminError::ProjectNotOpen)?;
    write_metadata(&path, &record)?;
    Ok(success(record, "Metadata written"))
}

#[tauri::command]
fn import_drillhole_csv(
    state: State<'_, AppState>,
    source_path: String,
    mapping_json: String,
) -> Result<CommandResponse<ImportSummary>, SminError> {
    let project_id = state.project_dir.lock().unwrap().clone().ok_or(SminError::ProjectNotOpen)?;
    let file = File::open(&source_path)?;
    let mut lines = BufReader::new(file).lines();
    let header = lines.next().ok_or_else(|| SminError::InvalidCsv("missing header".into()))?
        .map_err(|_| SminError::InvalidCsv("unreadable header".into()))?;
    if header.trim().is_empty() {
        return Err(SminError::InvalidCsv("empty header".into()));
    }
    let mut rows = 0;
    let mut errors = 0;
    for line in lines {
        rows += 1;
        if line.map_err(|_| SminError::InvalidCsv("unreadable row".into()))?.trim().is_empty() {
            errors += 1;
        }
    }
    let db = state.db.lock().unwrap();
    let conn = db.as_ref().ok_or(SminError::ProjectNotOpen)?;
    let project = read_metadata(&project_id)?;
    conn.execute(
        "INSERT INTO imports (id,project_id,source_name,mapping_json,row_count,error_count,created_at) VALUES (?,?,?,?,?,?,?)",
        params![Uuid::new_v4().to_string(), project.id, source_path, mapping_json, rows, errors, now()],
    )?;
    Ok(success(ImportSummary { rows, errors, source: source_path }, "Drillhole CSV recorded"))
}

#[tauri::command]
fn read_audit_log(state: State<'_, AppState>) -> Result<CommandResponse<Vec<AuditEntry>>, SminError> {
    let db = state.db.lock().unwrap();
    let conn = db.as_ref().ok_or(SminError::ProjectNotOpen)?;
    let mut query = conn.prepare("SELECT id,action,details,created_at FROM audit_log ORDER BY created_at DESC")?;
    let entries = query.query_map([], |row| Ok(AuditEntry {
        id: row.get(0)?, action: row.get(1)?, details: row.get(2)?, created_at: row.get(3)?,
    }))?.collect::<Result<Vec<_>, _>>()?;
    Ok(success(entries, "Audit log read"))
}

#[tauri::command]
fn write_audit_event(
    state: State<'_, AppState>,
    action: String,
    details: String,
) -> Result<CommandResponse<bool>, SminError> {
    let db = state.db.lock().unwrap();
    let conn = db.as_ref().ok_or(SminError::ProjectNotOpen)?;
    let project = state.project_dir.lock().unwrap().clone().ok_or(SminError::ProjectNotOpen)?;
    let record = read_metadata(&project)?;
    conn.execute(
        "INSERT INTO audit_log (id,project_id,action,details,created_at) VALUES (?,?,?,?,?)",
        params![Uuid::new_v4().to_string(), record.id, action, details, now()],
    )?;
    Ok(success(true, "Audit event written"))
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .setup(|app| {
            let app_data = app.path().app_data_dir()?;
            fs::create_dir_all(&app_data)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_project, open_project, save_project, close_project,
            create_project_folders, initialize_project_database,
            read_project_metadata, write_project_metadata, import_drillhole_csv,
            read_audit_log, write_audit_event
        ])
        .run(tauri::generate_context!())
        .expect("error while running SMIN");
}