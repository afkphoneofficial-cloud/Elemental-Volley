/**
 * Google Client ID ใส่ในเกมได้ (นี่ไม่ใช่รหัสลับ)
 * Client Secret ห้ามใส่ในเว็บ — ใส่เฉพาะในหน้า Auth ของ Supabase
 *
 * เว็บจริง: https://evolley.dev
 * หลังสร้างโปรเจกต์ Supabase แล้ววาง Project URL กับ anon public key ตรงนี้
 * ห้ามใส่ service_role หรือ Google Client Secret
 * วางแล้วรีเฟรช เกมจะบังคับล็อกอิน Gmail ก่อนเล่น
 */
export const BACKEND = {
  googleClientId: "441173887104-aked2gdmq0co0fou4hlq3vsj0ra4q6ms.apps.googleusercontent.com",
  supabaseUrl: "",
  supabaseAnonKey: ""
};

export function backendReady() {
  return Boolean(BACKEND.supabaseUrl && BACKEND.supabaseAnonKey && BACKEND.googleClientId);
}
