// App de Windows do apts: uma janela que mostra o site estático (pasta out/).
// Não tem lógica própria — tudo roda no mesmo código web do projeto.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o apts");
}
