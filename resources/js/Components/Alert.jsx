export default function Alert({ type, message }) {
    const [isVisible, setIsVisible] = useState(true);

    if (!message || !isVisible) return null;

    const alertClasses = {
        success: 'bg-green-100 border-green-400 text-green-700',
        error: 'bg-red-100 border-red-400 text-red-700',
        warning: 'bg-yellow-100 border-yellow-400 text-yellow-700'
    };

    return (
        <div className={`border px-4 py-3 rounded relative ${alertClasses[type]} flex justify-between items-center`} role="alert">
            <span className="block sm:inline">{message}</span>
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-0 right-0 px-4 py-3"
                aria-label="Close alert"
            >
                <span className="text-xl">&times;</span>
            </button>
        </div>
    );
}