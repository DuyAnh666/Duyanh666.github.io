/*
 * Cau hinh dong bo dam may (Firebase Realtime Database hoac Supabase).
 *
 * HUONG DAN KET NOI NHANH (Chon 1 trong 2 cach):
 *
 * CACH 1: FIREBASE REALTIME DATABASE (Khuyen dung - Don gian nhat, chi can 1 link URL)
 * 1. Truy cap https://console.firebase.google.com/ -> Bam "Add project" (Tao project moi).
 * 2. Vao menu "Build" -> "Realtime Database" -> Bam "Create Database".
 * 3. Chon khu vuc (Singapore / asia-southeast1) -> Chon "Start in test mode" -> Enable.
 * 4. Copy duong dan URL (vi du: "https://ten-project-default-rtdb.asia-southeast1.firebasedatabase.app")
 *    va dan vao truong firebaseDatabaseURL ben duoi.
 *
 * CACH 2: SUPABASE
 * 1. Truy cap https://supabase.com/ -> Tao project moi.
 * 2. Vao SQL Editor chay lenh tao bang `kv_store`:
 *    create table if not exists kv_store (key text primary key, value jsonb, updated_at timestamptz default now());
 *    alter table kv_store enable row level security;
 *    create policy "Public access" on kv_store for all using (true) with check (true);
 * 3. Vao Project Settings -> API -> Copy "Project URL" va "anon public key" dan vao ben duoi.
 *
 * Luu y: Neu de trong ca 2, he thong van hoat dong 100% binh thuong bang bo nho trinh duyet (localStorage)
 * va se tu dong dong bo len dam may ngay khi ban dien URL vao file nay.
 */
window.CLOUD_CONFIG = {
    // Dien link Firebase Realtime Database cua ban vao day (vi du: 'https://hnue-quiz-default-rtdb.asia-southeast1.firebasedatabase.app')
    firebaseDatabaseURL: '',

    // Hoac dien thong tin Supabase vao day:
    supabaseUrl: '',
    supabaseAnonKey: ''
};
