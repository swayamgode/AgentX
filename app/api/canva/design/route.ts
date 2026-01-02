
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { topic } = await req.json();
    const accessToken = req.cookies.get("canva_access_token")?.value;

    if (!accessToken) {
        // If no token (and running locally for demo), return Mock Data so user sees the UI flow.
        // In production, return error 401.
        if (process.env.NODE_ENV === "development") {
            return NextResponse.json({
                design: {
                    url: "https://www.canva.com/design/DAF-placeholder/edit",
                    id: "mock-design-id"
                },
                message: "Mock Design Created (Provide Credentials to Realize)"
            });
        }
        return NextResponse.json({ error: "Not authorized with Canva" }, { status: 401 });
    }

    const templateId = process.env.CANVA_TEMPLATE_ID || "DAF-PLACEHOLDER";

    try {
        // Real API Call (Autofill)
        const response = await fetch("https://www.canva.com/api/v1/commits", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                brand_template_id: templateId,
                elements: {
                    "headline": { "type": "text", "text": topic || "New Video" }
                }
            })
        });

        // Note: The actual Canva Autofill API is complex (jobs/commits). 
        // This is a simplified representation.

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Canva API Error");
        }

        return NextResponse.json({ design: data });

    } catch (error) {
        console.error("Canva Design Error:", error);
        // Return Mock on failure for the demo
        return NextResponse.json({
            design: {
                url: "https://www.canva.com/design/DAF-placeholder/edit",
                id: "mock-design-id"
            },
            message: "Design creation failed (Check Keys), Mock link returned."
        });
    }
}
