import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            cloth_image,
            human_gender,
            human_height,
            human_weight,
            n_images,
        } = body ?? {};

        if (!cloth_image || !human_gender || !human_height || !human_weight || !n_images) {
            return NextResponse.json({ ok: false, error: "필수 필드 누락" }, { status: 400 });
        }

        // base64 → Buffer
        const base64 = String(cloth_image).replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64, "base64");

        const uploadDir = path.join(process.cwd(), "uploads");
        await mkdir(uploadDir, { recursive: true });

        // n_images 만큼 저장 (지금은 항상 1)
        const urls: string[] = [];
        for (let i = 0; i < n_images; i++) {
            const filename = `${Date.now()}-${i}.png`;
            await writeFile(path.join(uploadDir, filename), buffer);
            urls.push(`/uploads/${encodeURIComponent(filename)}`);
        }

        return NextResponse.json({
            ok: true,
            images: urls, // 항상 배열 반환
            gender: human_gender,
            height: human_height,
            weight: human_weight,
            n_images,
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "업로드 실패";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }

}
