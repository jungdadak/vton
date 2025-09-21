'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ResultPage() {
    return (
        <Suspense fallback={<p>Loading…</p>}>
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

                <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <div className="relative h-72 w-full overflow-hidden rounded-lg flex items-center justify-center bg-slate-50">
                        {success ? (
                            <img
                                src={images[0]}
                                alt="result"
                                className="block max-h-full max-w-full object-contain"
                            />
                        ) : (
                            <p className="text-red-500 font-medium text-center px-2">
                                {msg || '결과 이미지를 불러올 수 없습니다. 다시 시도해주세요.'}
                            </p>
                        )}
                    </div>
                </section>

                {success && images.length > 1 && (
                    <section className="mt-4 grid grid-cols-2 gap-3">
                        {images.slice(1).map((url, idx) => (
                            <div
                                key={idx}
                                className="aspect-square flex items-center justify-center bg-slate-100 rounded-xl"
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

                <section className="mt-8 space-y-4">
                    <button
                        type="button"
                        onClick={() => router.push('/')}
                        className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-slate-800 shadow-sm"
                    >
                        다시 시도하기
                    </button>
                </section>
            </div>
        </main>
    );
}

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
