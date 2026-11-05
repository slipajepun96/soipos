import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Check, Flashlight, Loader2, X } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { cn } from '@/lib/utils';

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'codabar', 'itf', 'qr_code', 'data_matrix'];
const SAME_CODE_PAUSE = 1500; // ms before the same barcode counts again (continuous mode)

function cameraError(error) {
    if (!window.isSecureContext) return 'The camera only works on a secure (https) page. Open the POS through its https address.';
    if (error?.name === 'NotAllowedError') return 'Camera permission was denied. Allow camera access for this site in your browser settings, then try again.';
    if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') return 'No camera found on this device.';
    if (error?.name === 'NotReadableError') return 'The camera is being used by another app. Close it and try again.';
    return 'Could not start the camera.';
}

/** Native BarcodeDetector where supported (Chrome/Android), otherwise ZXing. Returns stop(). */
async function startDecoder(stream, video, onCode) {
    if ('BarcodeDetector' in window) {
        try {
            const supported = await window.BarcodeDetector.getSupportedFormats();
            const formats = FORMATS.filter((f) => supported.includes(f));
            if (formats.length) {
                const detector = new window.BarcodeDetector({ formats });
                let active = true;
                let timer;
                const tick = async () => {
                    if (!active) return;
                    if (video.readyState >= 2) {
                        try {
                            const codes = await detector.detect(video);
                            if (codes[0]?.rawValue) onCode(codes[0].rawValue);
                        } catch { /* frame not ready */ }
                    }
                    timer = setTimeout(tick, 120);
                };
                tick();
                return () => { active = false; clearTimeout(timer); };
            }
        } catch { /* fall through to ZXing */ }
    }

    const { BrowserMultiFormatReader } = await import('@zxing/browser');
    const reader = new BrowserMultiFormatReader(undefined, { delayBetweenScanAttempts: 120 });
    const controls = await reader.decodeFromStream(stream, video, (result) => {
        if (result) onCode(result.getText());
    });
    return () => controls.stop();
}

/**
 * Camera barcode scanner. `onDetected(code)` returns { ok, message } so the dialog can
 * show what happened. In continuous mode the camera stays open for the next item.
 */
export default function BarcodeScannerDialog({ open, onOpenChange, onDetected }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-3 p-4 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Scan barcode</DialogTitle>
                    <DialogDescription>Point the camera at the product barcode.</DialogDescription>
                </DialogHeader>
                {open && <Scanner onDetected={onDetected} onClose={() => onOpenChange(false)} />}
            </DialogContent>
        </Dialog>
    );
}

function Scanner({ onDetected, onClose }) {
    const videoRef = useRef(null);
    const trackRef = useRef(null);
    const lastRef = useRef({ code: null, at: 0 });
    const continuousRef = useRef(true);
    const onDetectedRef = useRef(onDetected);
    onDetectedRef.current = onDetected;
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    const [status, setStatus] = useState('starting'); // starting | scanning | error
    const [error, setError] = useState('');
    const [result, setResult] = useState(null); // { ok, message }
    const [continuous, setContinuous] = useState(() => {
        try { return window.localStorage.getItem('soipos.scan.continuous') !== '0'; } catch { return true; }
    });
    const [torch, setTorch] = useState(null); // null = not supported

    useEffect(() => {
        continuousRef.current = continuous;
        try { window.localStorage.setItem('soipos.scan.continuous', continuous ? '1' : '0'); } catch { /* ignore */ }
    }, [continuous]);

    useEffect(() => {
        let stopDecoder = () => {};
        let stream;
        let cancelled = false;
        let clearResult;

        const handleCode = (raw) => {
            const code = String(raw).trim();
            const now = Date.now();
            if (!code || (code === lastRef.current.code && now - lastRef.current.at < SAME_CODE_PAUSE)) return;
            lastRef.current = { code, at: now };

            const outcome = onDetectedRef.current(code) || { ok: false, message: `No product with barcode ${code}.` };
            setResult(outcome);
            if (outcome.ok) navigator.vibrate?.(60);
            else navigator.vibrate?.([40, 60, 40]);
            clearTimeout(clearResult);
            clearResult = setTimeout(() => setResult(null), 2000);

            if (outcome.ok && !continuousRef.current) onCloseRef.current();
        };

        (async () => {
            try {
                if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
                });
                if (cancelled) return;
                const video = videoRef.current;
                video.srcObject = stream;
                await video.play().catch(() => {});

                const track = stream.getVideoTracks()[0];
                trackRef.current = track;
                if (track.getCapabilities?.().torch) setTorch(false);

                stopDecoder = await startDecoder(stream, video, handleCode);
                if (!cancelled) setStatus('scanning');
            } catch (e) {
                if (cancelled) return;
                setError(cameraError(e));
                setStatus('error');
            }
        })();

        return () => {
            cancelled = true;
            clearTimeout(clearResult);
            stopDecoder();
            stream?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    const toggleTorch = async () => {
        try {
            await trackRef.current.applyConstraints({ advanced: [{ torch: !torch }] });
            setTorch(!torch);
        } catch { setTorch(null); }
    };

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center">
                <CameraOff className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm">{error}</p>
                <p className="text-xs text-muted-foreground">You can still type or scan into the search box with a USB / Bluetooth scanner.</p>
                <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black">
                <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />
                {/* Aim box */}
                <div className="pointer-events-none absolute inset-x-[10%] top-1/2 h-1/3 -translate-y-1/2 rounded-md border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                {status === 'starting' && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-white">
                        <Loader2 className="h-4 w-4 animate-spin" />Starting camera…
                    </div>
                )}
                {result && (
                    <div className={cn(
                        'absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow',
                        result.ok ? 'bg-white text-black' : 'bg-destructive text-destructive-foreground',
                    )}
                    >
                        {result.ok ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
                        <span className="truncate">{result.message}</span>
                    </div>
                )}
                {torch !== null && (
                    <Button
                        type="button"
                        size="icon"
                        variant={torch ? 'default' : 'secondary'}
                        className="absolute right-3 top-3 h-9 w-9 rounded-full"
                        onClick={toggleTorch}
                        aria-label={torch ? 'Turn flashlight off' : 'Turn flashlight on'}
                    >
                        <Flashlight />
                    </Button>
                )}
            </div>

            <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        className="rounded border-input"
                        checked={continuous}
                        onChange={(e) => setContinuous(e.target.checked)}
                    />
                    Keep scanning after each item
                </label>
                <Button onClick={onClose}>
                    <Camera />Done
                </Button>
            </div>
        </div>
    );
}
