import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/utils/supabase";
import { DocumentType } from "@prisma/client";
import { createDocumentWithChunks } from "@/services/documents";
import { processPdfToText } from "@/utils/pdfconverter";

export async function GET() {
    const result = await supabase.storage.from("documents").list();
    return NextResponse.json(result.data);
}

export async function POST(req: NextRequest) {
    try {
        const file = await req.blob();
        if (!file) {
            return NextResponse.error();
        }

        // Process PDF to text
        const text = await processPdfToText(file);

        // Create document and chunks
        const result = await createDocumentWithChunks({
            title: "Sample Document",
            content: text,
            documentType: DocumentType.General, // Adjust based on your DocumentType enum
            fileName: "a.pdf",
        });

        return NextResponse.json({ success: true, data: result ?? "nothing" });
    } catch (error) {
        console.error("Error in POST /api/documents:", error);
        return NextResponse.json({ success: false, error: (error as Error).message });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { path } = await req.json();
        if (typeof path !== "string") {
            return NextResponse.error();
        }

        await supabase.storage.from("documents").remove([path]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in DELETE /api/documents:", error);
        return NextResponse.json({ success: false, error: (error as Error).message });
    }
}
