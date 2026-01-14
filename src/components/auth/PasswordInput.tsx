import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Eye, EyeSlash } from '@phosphor-icons/react';

interface PasswordInputProps {
    id?: string;
    name?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    autoComplete?: 'current-password' | 'new-password';
}

export function PasswordInput({
    id,
    name,
    value,
    onChange,
    placeholder = '********',
    disabled = false,
    required = false,
    className = '',
    autoComplete = 'current-password',
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <Input
                id={id}
                name={name}
                type={showPassword ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                autoComplete={autoComplete}
                className={`h-12 bg-white border border-neutral-200 rounded-xl text-base font-normal placeholder:text-neutral-400 pl-4 pr-12 focus-visible:ring-0 focus-visible:border-neutral-300 shadow-sm transition-all ${className}`}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={disabled}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-50"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
                {showPassword ? (
                    <EyeSlash size={20} weight="regular" />
                ) : (
                    <Eye size={20} weight="regular" />
                )}
            </button>
        </div>
    );
}
