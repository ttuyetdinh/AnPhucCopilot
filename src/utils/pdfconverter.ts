import pdf2md from "@opendocsg/pdf2md";

export async function processPdfToText(file: Blob): Promise<string> {
    const buffer = await file.arrayBuffer();
    return pdf2md(buffer);
}
