import { useAuth } from '../../contexts/AuthContext';
import { SignOut } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function UserProfile() {
    const { user, signOut } = useAuth();

    if (!user) return null;

    return (
        <div className="bg-white rounded-[2rem] p-6 border border-stone-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-stone-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />

            <div className="relative z-10 flex items-center gap-4">
                <Avatar className="w-14 h-14 border-2 border-white shadow-md">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-stone-900 text-white font-black text-xl">
                        {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Cuenta</p>
                    <p className="text-lg font-black text-stone-900 tracking-tighter truncate leading-none">
                        {user.email?.split('@')[0]}
                    </p>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => signOut()}
                    className="w-12 h-12 rounded-2xl bg-stone-50 hover:bg-orange-50 hover:text-orange-600 transition-all text-stone-400"
                >
                    <SignOut size={22} weight="bold" />
                </Button>
            </div>
        </div>
    );
}
