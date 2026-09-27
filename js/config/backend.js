/**
 * Google Client ID ใส่ในเกมได้ (ไม่ใช่ความลับ)
 * Client Secret ห้ามใส่ในเว็บ — ใส่เฉพาะในหน้า Auth ของ Supabase
 *
 * หลังสร้างโปรเจกต์ Supabase แล้ว วาง URL กับ anon key ตรงนี้
 */
export const BACKEND = {
  googleClientId: "441173887104-aked2gdmq0co0fou4hlq3vsj0ra4q6ms.apps.googleusercontent.com",
  supabaseUrl: "",
  supabaseAnonKey: ""
};

export function backendReady() {
  return Boolean(BACKEND.supabaseUrl && BACKEND.supabaseAnonKey && BACKEND.googleClientId);
}
