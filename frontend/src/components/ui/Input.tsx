import {FC, InputHTMLAttributes} from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

const Input: FC<InputProps> = ({ label, error, ...props}) => {
    return (
        <div className="mt-6">
            <label className="block text-xs mb-2">{label}</label>
            <input
                {...props}
                className={`w-full px-6 py-4 border-1 rounded-xl border-zinc-500 text-sm focus:border-zinc-300 transition-all ${
                    error
                    ? 'border-red-500 text-red-400'
                    : 'border-zinc-500'    
                }`}
            />
            {error && (
                <p className="text-red-400">{error}</p>
            )}
        </div>
    )
}

export default Input;