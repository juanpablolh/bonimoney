import * as React from "react"
import { useMediaQuery } from "../../hooks/use-media-query"
import { useKeyboardHeight, useStableViewportHeight } from "../../hooks/use-keyboard-height"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerDescription,
} from "@/components/ui/drawer"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

// Context to share keyboard height with children
export const KeyboardHeightContext = React.createContext<number>(0)

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
    const keyboardHeight = useKeyboardHeight()
    const stableHeight = useStableViewportHeight()

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
        <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
            {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
            <DrawerContent
                className={cn(hideHeader && "p-0 border-none")}
                style={{ maxHeight: stableHeight ? `${stableHeight * 0.85}px` : '85vh' }}
            >
                <KeyboardHeightContext.Provider value={keyboardHeight}>
                    {hideHeader ? (
                        <>
                            <VisuallyHidden>
                                <DrawerTitle>{title}</DrawerTitle>
                                <DrawerDescription>{description || title}</DrawerDescription>
                            </VisuallyHidden>
                            <div className="flex flex-col h-full mt-4">
                                {children}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
                            <DrawerHeader className="text-left">
                                <DrawerTitle>{title}</DrawerTitle>
                                {description ? (
                                    <DrawerDescription>{description}</DrawerDescription>
                                ) : (
                                    <VisuallyHidden>
                                        <DrawerDescription>{title}</DrawerDescription>
                                    </VisuallyHidden>
                                )}
                            </DrawerHeader>
                            <div className="px-0 pb-0 flex-1 overflow-hidden h-full">
                                {children}
                            </div>
                        </div>
                    )}
                </KeyboardHeightContext.Provider>
            </DrawerContent>
        </Drawer>
    )
}
