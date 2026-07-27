//Think of it as a notebook containing important settings
//Imagine tomorrow your backend moves to: 5000
//If you hardcoded 3001 in 20 places, you'd have to edit 20 files.
// In production this must be set via BUN_PUBLIC_BACKEND_URL (see bunfig.toml's
// BUN_PUBLIC_* env exposure) to the deployed backend's public URL.
const BACKEND_URL = process.env.BUN_PUBLIC_BACKEND_URL || "http://localhost:3001";

export default BACKEND_URL;