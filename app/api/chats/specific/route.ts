import { supabaseServiceRoleClient as supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const user_1_address = searchParams.get("user_1_address");
  const user_2_address = searchParams.get("user_2_address");

  if (!user_1_address || !user_2_address) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("chats")
      .select("id")
      .eq("user_1", user_1_address)
      .eq("user_2", user_2_address)
      .limit(1)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching specific chat from database:", error);
    return NextResponse.json({ error: "Error fetching from database" }, { status: 500 });
  }
}