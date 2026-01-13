import * as React from "react"
import { useMediaQuery } from "../../hooks/use-media-query"
import { useKeyboardHeight } from "../../hooks/use-keyboard-height"
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
    isNested?: boolean
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
    isNested = false,
}: ResponsiveModalProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const keyboardHeight = useKeyboardHeight()

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
                <DialogContent
                    showCloseButton={showCloseButton}
                    className={cn("sm:max-w-[425px]", hideHeader && "p-0 gap-0")}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
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
        <Drawer
            open={open}
            onOpenChange={onOpenChange}
            shouldScaleBackground={false}
            direction={isNested ? "right" : "bottom"}
        >
            {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
            <DrawerContent
                hideHandle={hideHeader || isNested}
                onOpenAutoFocus={(e) => e.preventDefault()}
                className={cn(
                    isNested ? "h-full" : "h-[96svh]",
                    hideHeader && "p-0 border-none"
                )}
            >
                <KeyboardHeightContext.Provider value={keyboardHeight}>
                    {hideHeader ? (
                        <>
                            <VisuallyHidden>
                                <DrawerTitle>{title}</DrawerTitle>
                                <DrawerDescription>{description || title}</DrawerDescription>
                            </VisuallyHidden>
                            {children}
                        </>
                    ) : (
                        <div className="flex flex-col h-full">
                            <DrawerHeader className="text-left pt-6">
                                <DrawerTitle>{title}</DrawerTitle>
                                {description ? (
                                    <DrawerDescription>{description}</DrawerDescription>
                                ) : (
                                    <VisuallyHidden>
                                        <DrawerDescription>{title}</DrawerDescription>
                                    </VisuallyHidden>
                                )}
                            </DrawerHeader>
                            <div className="px-0 pb-0 flex-1 overflow-y-auto no-scrollbar">
                                {children}
                            </div>
                        </div>
                    )}
                </KeyboardHeightContext.Provider>
            </DrawerContent>
        </Drawer>
    )
}
