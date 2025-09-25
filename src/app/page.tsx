'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Gender = 'male' | 'female';

const GENDER_LABEL: Record<Gender, string> = {
    male: '남성',
    female: '여성',
};

const HEIGHT: Record<Gender, string[]> = {
    female: ['150cm 이하', '151~159cm', '160~169cm', '170cm 이상'],
    male: ['170cm 이하', '171~175cm', '176~179cm', '180cm 이상'],
};
const WEIGHT: Record<Gender, string[]> = {
    female: ['50kg 이하', '51~60kg', '61kg~69kg', '70kg 이상'],
    male: ['70kg 이하', '71~85kg', '86~99kg', '100kg 이상'],
};

// File -> base64 (태그 제거)
const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => {
            const result = String(fr.result);
            const pureBase64 = result.split(',')[1] || result;
            resolve(pureBase64);
        };
        fr.onerror = reject;
        fr.readAsDataURL(file);
    });

export default function TryOnPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [gender, setGender] = useState<Gender | null>(null);
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Blob 미리보기
    useEffect(() => {
        if (!file) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    const heightOptions = useMemo(() => (gender ? HEIGHT[gender] : []), [gender]);
    const weightOptions = useMemo(() => (gender ? WEIGHT[gender] : []), [gender]);

    const ready = Boolean(file && gender && height && weight);

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) setFile(f);
    };

    const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) setFile(f);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ready || !file || !gender) return;

        setSubmitting(true);
        try {
            const b64 = await toBase64(file);
            const payload = {
                cloth_image: b64,
                human_gender: GENDER_LABEL[gender], // ✅ "남성" / "여성"
                human_height: height,
                human_weight: weight,
                n_images: 1,
            };

            // ✅ 프록시로 호출
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok || !json?.viton_images) {
                throw new Error(json?.message || '업로드 실패');
            }

            // ✅ alert 유지(나중에 주석 처리 가능)
            // alert('전송 완료!\n' + JSON.stringify(json, null, 2));

            // ✅ 세션스토리지에 저장 (쿼리로 안 보냄 → URI_TOO_LONG 방지)
            sessionStorage.setItem('viton_images', JSON.stringify(json.viton_images));

            // ✅ 짧은 URL 이동
            router.push('/result?status=success');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '에러';
            // alert(msg);
            router.push(`/result?status=error&msg=${encodeURIComponent(msg)}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-dvh bg-gradient-to-b from-white to-slate-50">
            <form
                onSubmit={handleSubmit}
                className="mx-auto w-full max-w-md p-5 sm:p-6"
            ><h1
                className="
    text-xl font-bold tracking-tight
    text-white text-center
    rounded-2xl px-4 py-6
    bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500
    [background-size:200%_200%] bg-no-repeat
    shadow-md
    animate-fade-in-up
  "
            >
                맘에 드는 옷을<br />내 체형에 입혀보세요!
            </h1>




                {/* 업로드 카드 */}
                <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <label
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={onDrop}
                        className="relative block w-full cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-slate-400"
                    >
                        <div className="relative h-72 w-full overflow-hidden rounded-lg flex items-center justify-center">
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="preview"
                                    className="block max-h-full max-w-full object-contain"
                                    draggable={false}
                                    style={{ imageOrientation: 'from-image' }}
                                />
                            ) : (
                                <div className="text-slate-500 text-center">
                                    <div className="text-sm font-medium">옷 사진 업로드</div>
                                    <div className="text-xs mt-1">클릭 또는 드래그 앤 드롭</div>
                                </div>
                            )}
                        </div>

                        <input type="file" accept="image/*" className="hidden" onChange={onPickFile} />
                    </label>

                    {file && (
                        <div className="mt-3 flex items-center justify-between text-sm">
                            <span className="line-clamp-1 text-slate-600">{file.name}</span>
                            <button
                                type="button"
                                onClick={() => setFile(null)}
                                className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
                            >
                                변경
                            </button>
                        </div>
                    )}
                </section>

                {/* 성별 */}
                <section className="mt-6">
                    <div className="text-sm font-semibold text-slate-800 mb-2">성별</div>
                    <div className="grid grid-cols-2 gap-3">
                        <Chip
                            active={gender === 'male'}
                            onClick={() => {
                                setGender('male');
                                setHeight('');
                                setWeight('');
                            }}
                        >
                            남자
                        </Chip>
                        <Chip
                            active={gender === 'female'}
                            onClick={() => {
                                setGender('female');
                                setHeight('');
                                setWeight('');
                            }}
                        >
                            여자
                        </Chip>
                    </div>
                </section>

                {/* 키/몸무게 */}
                <section className="mt-6 space-y-4">
                    <div>
                        <div className="mb-2 text-sm font-semibold text-slate-800">키</div>
                        <div className="flex flex-wrap gap-2">
                            {(heightOptions.length ? heightOptions : ['성별을 먼저 선택']).map(
                                (opt) => (
                                    <Chip
                                        key={opt}
                                        active={height === opt}
                                        disabled={!gender}
                                        onClick={() => setHeight(opt)}
                                    >
                                        {opt}
                                    </Chip>
                                )
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="mb-2 text-sm font-semibold text-slate-800">몸무게</div>
                        <div className="flex flex-wrap gap-2">
                            {(weightOptions.length ? weightOptions : ['성별을 먼저 선택']).map(
                                (opt) => (
                                    <Chip
                                        key={opt}
                                        active={weight === opt}
                                        disabled={!gender}
                                        onClick={() => setWeight(opt)}
                                    >
                                        {opt}
                                    </Chip>
                                )
                            )}
                        </div>
                    </div>
                </section>

                {/* 버튼 */}
                <button
                    type="submit"
                    disabled={!ready || submitting}
                    className="mt-8 w-full rounded-full bg-slate-900 px-5 py-3 text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    {submitting ? '전송 중…' : '입혀보기'}
                </button>
            </form>
        </main>
    );
}

function Chip({
                  active,
                  disabled,
                  onClick,
                  children,
              }: {
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={[
                'rounded-full px-4 py-2 text-sm transition ring-1',
                active
                    ? 'bg-orange-500 text-white ring-orange-500 shadow-sm'
                    : 'bg-white text-slate-800 ring-slate-200 hover:bg-slate-50',
                disabled ? 'opacity-60 cursor-not-allowed' : '',
            ].join(' ')}
        >
            {children}
        </button>
    );
}
