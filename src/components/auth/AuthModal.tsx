import { ResponsiveModal } from '../ui-custom/ResponsiveModal';
import MagicLinkAuth from './MagicLinkAuth';

interface AuthModalProps {
    open: boolean;
    onClose: () => void;
    reason?: string;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
    return (
        <ResponsiveModal
            open={open}
            onOpenChange={onClose}
            title="" // Header is inside MagicLinkAuth for better control
        >
            <MagicLinkAuth />
        </ResponsiveModal>
    );
}
