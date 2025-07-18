export function validateEnvironment() {
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "KIMI_API_KEY",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error("Missing required environment variables:", missingVars);
    throw new Error(`Missing environment variables: ${missingVars.join(", ")}`);
  }

  const apiKey = process.env.KIMI_API_KEY;
  if (apiKey && !apiKey.startsWith("sk-")) {
    console.error('Invalid API key format. API keys should start with "sk-"');
    throw new Error("Invalid API key format");
  }
  console.log("Environment variables validated successfully");
}
