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

// Context to share keyboard and viewport info with children
export const KeyboardViewportContext = React.createContext<{ keyboardHeight: number; vvHeight: number; isKeyboardOpen: boolean }>({
    keyboardHeight: 0,
    vvHeight: 0,
    isKeyboardOpen: false
})

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
    const { keyboardHeight, vvHeight, isKeyboardOpen } = useKeyboardHeight()

    // Dynamic drawer height: viewport height when keyboard is open, 96dvh when closed
    const drawerHeight = isKeyboardOpen ? `${vvHeight}px` : '96dvh'

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
                <DialogContent
                    showCloseButton={showCloseButton}
                    className={cn("sm:max-w-[425px]", hideHeader && "p-0 gap-0")}
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
            repositionInputs={false}
            direction={isNested ? "right" : "bottom"}
        >
            {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
            <DrawerContent
                hideHandle={hideHeader || isNested}
                className={cn(
                    isNested && "h-full",
                    hideHeader && "p-0 border-none",
                    "bg-neutral-50 flex flex-col rounded-t-3xl"
                )}
                style={isNested ? undefined : {
                    height: drawerHeight,
                    maxHeight: '100dvh',
                    transition: 'height 0.15s ease-out'
                }}
            >
                <KeyboardViewportContext.Provider value={{ keyboardHeight, vvHeight, isKeyboardOpen }}>
                    {hideHeader ? (
                        children
                    ) : (
                        <div className="flex flex-col h-full bg-neutral-50 overflow-hidden rounded-t-3xl">
                            {!isNested && (
                                <DrawerHeader className="text-left py-4 shrink-0 border-b border-neutral-100">
                                    <DrawerTitle className="font-serif text-2xl">{title}</DrawerTitle>
                                    {description ? (
                                        <DrawerDescription>{description}</DrawerDescription>
                                    ) : (
                                        <VisuallyHidden>
                                            <DrawerDescription>{title}</DrawerDescription>
                                        </VisuallyHidden>
                                    )}
                                </DrawerHeader>
                            )}
                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                {children}
                            </div>
                        </div>
                    )}
                </KeyboardViewportContext.Provider>
            </DrawerContent>
        </Drawer>
    )
}
