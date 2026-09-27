/**
 * Google Client ID ใส่ในเกมได้ (นี่ไม่ใช่รหัสลับ)
 * Client Secret ห้ามใส่ในเว็บ — ใส่เฉพาะในหน้า Auth ของ Supabase
 *
 * เว็บจริง: https://evolley.dev
 * หลังสร้างโปรเจกต์ Supabase แล้ววาง URL กับ anon key ตรงนี้
 * แล้วค่อยเปิดหน้าล็อกอิน (ตอนนี้เกมข้ามไปเมนู)
 */
export const BACKEND = {
  googleClientId: "441173887104-aked2gdmq0co0fou4hlq3vsj0ra4q6ms.apps.googleusercontent.com",
  supabaseUrl: "",
  supabaseAnonKey: ""
};

export function backendReady() {
  return Boolean(BACKEND.supabaseUrl && BACKEND.supabaseAnonKey && BACKEND.googleClientId);
}
