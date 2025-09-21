'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

// 정적 프리렌더 끄기 (sessionStorage 사용 + CSR 전용)
export const dynamic = 'force-dynamic';

export default function ResultPage() {
    return (
        // useSearchParams() 를 Suspense 경계로 감싸기 (Next 권장)
        <Suspense fallback={<Skeleton />}>
            <ResultContent />
        </Suspense>
    );
}

function ResultContent() {
    const sp = useSearchParams();
    const router = useRouter();
    const status = sp.get('status');
    const msg = sp.get('msg');

    const [images, setImages] = useState<string[]>([]);

    useEffect(() => {
        if (status === 'success') {
            const stored = sessionStorage.getItem('viton_images');
            if (stored) {
                try {
                    const arr = JSON.parse(stored) as string[];
                    setImages(arr.map(normalizeSrc));
                } catch {
                    setImages([]);
                }
            }
        }
    }, [status]);

    const success = status === 'success' && images.length > 0;

    return (
        <main className="min-h-dvh bg-gradient-to-b from-white to-slate-50">
            <div className="mx-auto w-full max-w-md p-5 sm:p-6">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    내 체형에 입힌<br />결과를 확인하세요!
                </h1>

                {/* 결과 카드 */}
                <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <div className="relative h-72 w-full overflow-hidden rounded-lg flex items-center justify-center bg-slate-50">
                        {success ? (
                            <img
                                src={images[0]}
                                alt="result"
                                className="block max-h-full max-w-full object-contain"
                                style={{ imageOrientation: 'from-image' }}
                            />
                        ) : (
                            <p className="text-red-500 font-medium text-center px-2">
                                {msg || '결과 이미지를 불러올 수 없습니다. 다시 시도해주세요.'}
                            </p>
                        )}
                    </div>
                </section>

                {/* 추가 이미지 */}
                {success && images.length > 1 && (
                    <section className="mt-4 grid grid-cols-2 gap-3">
                        {images.slice(1).map((url, idx) => (
                            <div
                                key={idx}
                                className="aspect-square rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center"
                            >
                                <img
                                    src={url}
                                    alt={`추가결과 ${idx}`}
                                    className="max-h-full max-w-full object-contain"
                                />
                            </div>
                        ))}
                    </section>
                )}

                {/* 버튼 */}
                <section className="mt-8 space-y-4">
                    <button
                        type="button"
                        className="w-full rounded-full bg-slate-900 px-5 py-3 text-white shadow-sm transition hover:bg-slate-800"
                    >
            <span className="inline-flex items-center gap-2">
              <Heart className="h-5 w-5" /> 좋아요
            </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push('/')}
                        className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-slate-800 shadow-sm transition hover:bg-slate-50"
                    >
                        다시 시도하기
                    </button>
                </section>
            </div>
        </main>
    );
}

/* ------- 유틸 & 폴백 ------- */

// base64 순수 문자열이면 data URL 접두사 붙여주기
function normalizeSrc(s: string): string {
    const lower = s?.toLowerCase?.() ?? '';
    if (
        lower.startsWith('http://') ||
        lower.startsWith('https://') ||
        lower.startsWith('/') ||
        lower.startsWith('data:')
    ) {
        return s;
    }
    return `data:image/png;base64,${s}`;
}

// Suspense fallback
function Skeleton() {
    return (
        <main className="min-h-dvh bg-gradient-to-b from-white to-slate-50">
            <div className="mx-auto w-full max-w-md p-5 sm:p-6">
                <div className="h-6 w-48 rounded bg-slate-200 animate-pulse" />
                <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <div className="relative h-72 w-full overflow-hidden rounded-lg bg-slate-100 animate-pulse" />
                </section>
            </div>
        </main>
    );
}
