import { invoke } from "@tauri-apps/api/core";

export type NativeProjectInput = {
  name: string;
  commodity: string;
  epsg: number;
  description: string;
  folder: string;
};

export type NativeProjectRecord = {
  id: string;
  name: string;
  commodity: string;
  epsg: number;
  folder: string;
};

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function nativeCreateProject(root: string, input: NativeProjectInput) {
  if (!isTauriRuntime()) return null;
  const response = await invoke<{ data: NativeProjectRecord }>("create_project", { root, input });
  return response.data;
}

export async function nativeOpenProject(projectPath: string) {
  if (!isTauriRuntime()) return null;
  const response = await invoke<{ data: NativeProjectRecord }>("open_project", { projectPath });
  return response.data;
}

export async function nativeSaveProject() {
  if (!isTauriRuntime()) return null;
  return invoke("save_project");
}

export async function nativeCloseProject() {
  if (!isTauriRuntime()) return null;
  return invoke("close_project");
}