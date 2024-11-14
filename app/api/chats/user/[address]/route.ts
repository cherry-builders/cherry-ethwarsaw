import { supabase } from "@/lib/supabase/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params: { address } }: { params: { address: string } }) {
  if (!address) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.from("chats").select("*").or(`user_1.eq.${address},user_2.eq.${address}`);

    if (error) {
      if (error.code === "PGRST116") {
        // No chat found in database
        console.log("No chat found in database");
        return NextResponse.json({ data }, { status: 404 });
      }
      throw error;
    }

    if (!data) {
      console.log("No chat found in database");
      return NextResponse.json({ data }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user chats from database:", error);
    return NextResponse.json({ error: "Error fetching from database" }, { status: 500 });
  }
}
