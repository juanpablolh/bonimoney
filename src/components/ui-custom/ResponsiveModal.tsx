import * as React from "react"
import { useMediaQuery } from "../../hooks/use-media-query"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"
import { Sheet } from 'react-modal-sheet'
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface ResponsiveModalProps {
    children: React.ReactNode
    title: string
    description?: string
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    hideHeader?: boolean
    showCloseButton?: boolean
}

export function ResponsiveModal({
    children,
    title,
    description,
    trigger,
    open,
    onOpenChange,
    hideHeader = false,
    showCloseButton = true,
}: ResponsiveModalProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
                <DialogContent showCloseButton={showCloseButton} className={cn("sm:max-w-[425px]", hideHeader && "p-0 border-none bg-transparent shadow-none ring-0 gap-0 overflow-visible")}>
                    {hideHeader ? (
                        <>
                            <VisuallyHidden>
                                <DialogTitle>{title}</DialogTitle>
                                <DialogDescription>{description || title}</DialogDescription>
                            </VisuallyHidden>
                            {children}
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>{title}</DialogTitle>
                                {description ? (
                                    <DialogDescription>{description}</DialogDescription>
                                ) : (
                                    <VisuallyHidden>
                                        <DialogDescription>{title}</DialogDescription>
                                    </VisuallyHidden>
                                )}
                            </DialogHeader>
                            {children}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Sheet
            isOpen={open || false}
            onClose={() => onOpenChange?.(false)}
            snapPoints={[0.9, 0.5, 0]}
            initialSnap={0}
            disableDrag={false}
        >
            <Sheet.Container style={{ borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
                <Sheet.Header disableDrag={hideHeader} />
                <Sheet.Content style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                    {hideHeader ? (
                        <div className="h-full flex flex-col">
                            {children}
                        </div>
                    ) : (
                        <div className="px-4 pb-8 flex flex-col h-full">
                            <h2 className="text-lg font-semibold mb-2">{title}</h2>
                            {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
                            <div className="flex-1 overflow-y-auto">
                                {children}
                            </div>
                        </div>
                    )}
                </Sheet.Content>
            </Sheet.Container>
            <Sheet.Backdrop onTap={() => onOpenChange?.(false)} />
        </Sheet>
    )
}
