import { ResponsiveModal } from '../ui-custom/ResponsiveModal';
import MagicLinkAuth from '../auth/MagicLinkAuth';

interface AuthSheetProps {
    open: boolean;
    onClose: () => void;
    reason?: string;
}

export default function AuthSheet({ open, onClose }: AuthSheetProps) {
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
