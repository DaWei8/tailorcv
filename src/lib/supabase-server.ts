import { createServerComponentClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export const createClient = () => createServerComponentClient({ cookies });