import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TARGET =
    process.env.VTON_ENDPOINT ?? "http://localhost:8000/api";

/** 프론트에서 오는 요청 바디 */
type GenderKo = "남성" | "여성";
interface VitonRequest {
    cloth_image: string;       // 순수 base64
    human_gender: GenderKo;    // "남성" | "여성"
    human_height: string;
    human_weight: string;
    n_images: number;
}

/** 백엔드 성공 응답 */
interface VitonSuccess {
    viton_images: string[];    // url 또는 base64 문자열 배열
    message?: string;
}
/** 백엔드 실패 응답(형태가 다양할 수 있어 느슨하게) */
interface VitonFailure {
    viton_images?: unknown;
    message?: string;
}
type VitonResponse = VitonSuccess | VitonFailure;

/** 타입 가드: 성공 응답 판별 */
function isVitonSuccess(x: unknown): x is VitonSuccess {
    if (typeof x !== "object" || x === null) return false;
    const v = (x as Record<string, unknown>).viton_images;
    return Array.isArray(v) && v.every((s) => typeof s === "string");
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as unknown;

        // 입력 바디 런타임 체크
        if (!isValidRequest(body)) {
            return NextResponse.json(
                { viton_images: [], message: "필수 필드 누락 또는 타입 불일치" },
                { status: 400 }
            );
        }

        const beRes = await fetch(TARGET, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body satisfies VitonRequest),
        });

        const json: unknown = await beRes.json().catch(() => null);

        if (!beRes.ok || !isVitonSuccess(json)) {
            const message =
                (json &&
                    typeof (json as VitonFailure).message === "string" &&
                    (json as VitonFailure).message) ||
                `업스트림 오류 (${beRes.status})`;
            return NextResponse.json(
                { viton_images: [], message },
                { status: beRes.status || 500 }
            );
        }

        // 성공
        return NextResponse.json({
            viton_images: json.viton_images,
            message: json.message ?? "",
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "프록시 오류";
        return NextResponse.json(
            { viton_images: [], message },
            { status: 500 }
        );
    }
}

/** 요청 바디 런타임 검증 */
function isValidRequest(x: unknown): x is VitonRequest {
    if (typeof x !== "object" || x === null) return false;
    const o = x as Record<string, unknown>;
    return (
        typeof o.cloth_image === "string" &&
        (o.human_gender === "남성" || o.human_gender === "여성") &&
        typeof o.human_height === "string" &&
        typeof o.human_weight === "string" &&
        typeof o.n_images === "number"
    );
}
